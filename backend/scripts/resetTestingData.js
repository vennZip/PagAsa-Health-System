/**
 * Destructive non-admin data purge for Barangay Pag-Asa Health Center.
 *
 * Default: preflight only (no data is changed).
 * Execute: npm run reset:testing-data -- --execute --confirm PURGE_NON_ADMIN_DATA
 *
 * Preserves MongoDB users with role "admin" and their Firebase identities.
 * Uses deleteMany(), never dropDatabase() or drop(), so indexes remain intact.
 * Output contains counts only, never identities or credentials.
 */
import "dotenv/config";
import mongoose from "mongoose";
import { readFileSync } from "node:fs";
import { cert, deleteApp, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const EXPECTED_MONGODB_DATABASE = "pagasa_health_center";
const EXPECTED_FIREBASE_PROJECT_ID = "barangay-pag-asa-health-center";
const CONFIRMATION_PHRASE = "PURGE_NON_ADMIN_DATA";
const USER_COLLECTION = "users";
const DATA_COLLECTIONS = Object.freeze([
  "patients",
  "appointments",
  "healthRecords",
  "queueTickets",
  "medicines",
  "inventoryTransactions",
  "services",
  "activityLogs",
  "notifications",
  "announcements",
  "feedback",
  "clinic_schedules",
]);
const APPLICATION_COLLECTIONS = Object.freeze([USER_COLLECTION, ...DATA_COLLECTIONS]);

const args = new Set(process.argv.slice(2));
const shouldExecute = args.has("--execute");
const confirmationIndex = process.argv.indexOf("--confirm");
const confirmation = confirmationIndex === -1 ? undefined : process.argv[confirmationIndex + 1];

function required(value, message) {
  if (!value) throw new Error(message);
  return value;
}

function loadFirebaseServiceAccount() {
  const inlineJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const base64Json = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  const json = inlineJson
    ?? (base64Json ? Buffer.from(base64Json, "base64").toString("utf8") : undefined)
    ?? readFileSync(new URL("../firebase-service-account.json", import.meta.url), "utf8");

  try {
    return JSON.parse(json);
  } catch {
    throw new Error("Firebase service-account configuration is invalid JSON.");
  }
}

async function listFirebaseUserIds(auth) {
  const uids = [];
  let pageToken;
  do {
    const page = await auth.listUsers(1000, pageToken);
    uids.push(...page.users.map((user) => user.uid));
    pageToken = page.pageToken;
  } while (pageToken);
  return uids;
}

async function deleteFirebaseUsers(auth, uids) {
  let deletedCount = 0;
  for (let start = 0; start < uids.length; start += 1000) {
    const result = await auth.deleteUsers(uids.slice(start, start + 1000));
    deletedCount += result.successCount;
    if (result.failureCount > 0) {
      throw new Error(
        `Firebase deleted ${deletedCount} targeted accounts before ${result.failureCount} deletion(s) failed. `
        + "MongoDB was not changed; rerun preflight before retrying.",
      );
    }
  }
  return deletedCount;
}

async function collectionCounts(mongo) {
  return Promise.all(DATA_COLLECTIONS.map(async (name) => ({
    name,
    count: await mongo.db.collection(name).countDocuments({}),
  })));
}

async function main() {
  if (shouldExecute && confirmation !== CONFIRMATION_PHRASE) {
    throw new Error(`Destructive mode requires: --execute --confirm ${CONFIRMATION_PHRASE}`);
  }

  const mongoUri = required(process.env.MONGODB_URI, "MONGODB_URI is not configured.");
  const serviceAccount = loadFirebaseServiceAccount();
  const configuredProjectId = required(serviceAccount.project_id, "Firebase project ID is missing.");
  if (configuredProjectId !== EXPECTED_FIREBASE_PROJECT_ID) {
    throw new Error("Firebase project mismatch. Nothing was deleted.");
  }

  const firebaseApp = initializeApp(
    { credential: cert(serviceAccount) },
    `non-admin-data-purge-${Date.now()}`,
  );
  const auth = getAuth(firebaseApp);
  const mongo = await mongoose.createConnection(mongoUri).asPromise();

  try {
    if (mongo.name !== EXPECTED_MONGODB_DATABASE) {
      throw new Error("MongoDB database mismatch. Nothing was deleted.");
    }

    const liveCollections = (await mongo.db.listCollections({}, { nameOnly: true }).toArray())
      .map(({ name }) => name)
      .filter((name) => !name.startsWith("system."));
    const unexpectedCollections = liveCollections.filter(
      (name) => !APPLICATION_COLLECTIONS.includes(name),
    );
    if (unexpectedCollections.length > 0) {
      throw new Error(
        `Found ${unexpectedCollections.length} unexpected collection(s). Nothing was deleted; review the purge allowlist.`,
      );
    }

    const admins = await mongo.db.collection(USER_COLLECTION)
      .find({ role: "admin" }, { projection: { _id: 0, firebaseUid: 1 } })
      .toArray();
    const adminUids = new Set(admins.map(({ firebaseUid }) => firebaseUid).filter(Boolean));
    if (admins.length === 0 || adminUids.size !== admins.length) {
      throw new Error("No complete administrator account set was found. Nothing was deleted.");
    }

    const firebaseUids = await listFirebaseUserIds(auth);
    const firebaseUidSet = new Set(firebaseUids);
    const missingAdminAuthCount = [...adminUids].filter((uid) => !firebaseUidSet.has(uid)).length;
    if (missingAdminAuthCount > 0) {
      throw new Error("An administrator is missing its Firebase identity. Nothing was deleted.");
    }

    const firebaseTargets = firebaseUids.filter((uid) => !adminUids.has(uid));
    const nonAdminUserCount = await mongo.db.collection(USER_COLLECTION)
      .countDocuments({ role: { $ne: "admin" } });
    const dataCounts = await collectionCounts(mongo);

    console.log(`MongoDB database verified: ${mongo.name}`);
    console.log(`Firebase project verified: ${configuredProjectId}`);
    console.log(`Administrator accounts preserved: ${admins.length}`);
    console.log(`Non-admin MongoDB accounts targeted: ${nonAdminUserCount}`);
    console.log(`Non-admin Firebase accounts targeted: ${firebaseTargets.length}`);
    console.table(dataCounts);

    if (!shouldExecute) {
      console.log("Preflight complete. No data was changed.");
      console.log(
        `To execute, rerun with: npm run reset:testing-data -- --execute --confirm ${CONFIRMATION_PHRASE}`,
      );
      return;
    }

    const deletedFirebaseCount = await deleteFirebaseUsers(auth, firebaseTargets);
    console.log(`Deleted ${deletedFirebaseCount} non-admin Firebase Authentication account(s).`);

    const userResult = await mongo.db.collection(USER_COLLECTION)
      .deleteMany({ role: { $ne: "admin" } });
    console.log(`Deleted ${userResult.deletedCount} non-admin MongoDB account(s).`);
    for (const { name } of dataCounts) {
      const result = await mongo.db.collection(name).deleteMany({});
      console.log(`Deleted ${result.deletedCount} document(s) from ${name}.`);
    }

    const remainingFirebaseUids = await listFirebaseUserIds(auth);
    const remainingNonAdminFirebase = remainingFirebaseUids.filter((uid) => !adminUids.has(uid)).length;
    const remainingNonAdminUsers = await mongo.db.collection(USER_COLLECTION)
      .countDocuments({ role: { $ne: "admin" } });
    const remainingDataCounts = await collectionCounts(mongo);
    const remainingDataDocuments = remainingDataCounts.reduce((sum, item) => sum + item.count, 0);
    const remainingAdmins = await mongo.db.collection(USER_COLLECTION).countDocuments({ role: "admin" });

    if (
      remainingAdmins !== admins.length
      || remainingNonAdminUsers !== 0
      || remainingNonAdminFirebase !== 0
      || remainingDataDocuments !== 0
    ) {
      throw new Error("Post-purge verification failed. Review the system before using it.");
    }

    console.log("Verification passed: only administrator accounts remain and all system records are empty.");
    console.log("Collections, indexes, application code, and administrator authentication were preserved.");
  } finally {
    await mongo.close();
    await deleteApp(firebaseApp);
  }
}

main().catch((error) => {
  console.error(`Non-admin data purge aborted: ${error.message}`);
  process.exitCode = 1;
});
