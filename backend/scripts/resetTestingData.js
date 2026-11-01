/**
 * Destructive testing-data reset for Barangay Pag-Asa Health Center.
 *
 * Default: preflight only (no data is changed).
 * Execute: npm run reset:testing-data -- --execute --confirm RESET_PAGASA_TESTING_DATA
 *
 * This intentionally uses deleteMany(), never dropDatabase() or drop(). That preserves
 * the database, collections, indexes, schemas, models, and application source code.
 */
import "dotenv/config";
import mongoose from "mongoose";
import { readFileSync } from "node:fs";
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const EXPECTED_MONGODB_DATABASE = "pagasa_health_center";
const EXPECTED_FIREBASE_PROJECT_ID = "barangay-pag-asa-health-center";
const CONFIRMATION_PHRASE = "RESET_PAGASA_TESTING_DATA";

// Derived from every Mongoose model in backend/models. Keep this allowlist explicit.
const APPLICATION_COLLECTIONS = Object.freeze([
  "users",
  "patients",
  "appointments",
  "healthRecords",
  "queueTickets",
  "medicines",
  "inventoryTransactions",
  "services",
  "activityLogs",
  "notifications",
]);

const args = new Set(process.argv.slice(2));
const shouldExecute = args.has("--execute");
const confirmationIndex = process.argv.indexOf("--confirm");
const confirmation = confirmationIndex === -1 ? undefined : process.argv[confirmationIndex + 1];

function required(value, message) {
  if (!value) throw new Error(message);
  return value;
}

function loadFirebaseServiceAccount() {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
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
  for (let start = 0; start < uids.length; start += 1000) {
    const batch = uids.slice(start, start + 1000);
    const result = await auth.deleteUsers(batch);
    if (result.failureCount > 0) {
      const failures = result.errors
        .map(({ index, error }) => `item ${index}: ${error.code ?? error.message}`)
        .join(", ");
      throw new Error(`Firebase deleted ${result.successCount} accounts but failed ${result.failureCount}: ${failures}`);
    }
  }
}

async function main() {
  if (shouldExecute && confirmation !== CONFIRMATION_PHRASE) {
    throw new Error(
      `Destructive mode requires: --execute --confirm ${CONFIRMATION_PHRASE}`,
    );
  }

  const mongoUri = required(process.env.MONGODB_URI, "MONGODB_URI is not configured.");
  const serviceAccount = loadFirebaseServiceAccount();
  const configuredProjectId = required(serviceAccount.project_id, "Firebase project ID is missing.");

  if (configuredProjectId !== EXPECTED_FIREBASE_PROJECT_ID) {
    throw new Error(
      `Firebase project mismatch: expected ${EXPECTED_FIREBASE_PROJECT_ID}, got ${configuredProjectId}.`,
    );
  }

  const firebaseApp = initializeApp({ credential: cert(serviceAccount) }, "testing-data-reset");
  const auth = getAuth(firebaseApp);
  const mongo = await mongoose.createConnection(mongoUri).asPromise();

  try {
    if (mongo.name !== EXPECTED_MONGODB_DATABASE) {
      throw new Error(
        `MongoDB database mismatch: expected ${EXPECTED_MONGODB_DATABASE}, got ${mongo.name}.`,
      );
    }

    const liveCollections = (await mongo.db.listCollections({}, { nameOnly: true }).toArray())
      .map(({ name }) => name)
      .filter((name) => !name.startsWith("system."));
    const unexpectedCollections = liveCollections.filter(
      (name) => !APPLICATION_COLLECTIONS.includes(name),
    );

    if (unexpectedCollections.length > 0) {
      throw new Error(
        `Unexpected non-system MongoDB collections found; nothing was deleted: ${unexpectedCollections.join(", ")}. ` +
          "Review and explicitly add only verified application collections to APPLICATION_COLLECTIONS.",
      );
    }

    const mongoCounts = await Promise.all(
      APPLICATION_COLLECTIONS.map(async (name) => ({
        name,
        count: await mongo.db.collection(name).countDocuments({}),
      })),
    );
    const firebaseUids = await listFirebaseUserIds(auth);

    console.log(`MongoDB database verified: ${mongo.name}`);
    console.log(`Firebase project verified: ${configuredProjectId}`);
    console.table(mongoCounts);
    console.log(`Firebase Authentication accounts targeted: ${firebaseUids.length}`);

    if (!shouldExecute) {
      console.log("Preflight complete. No data was changed.");
      console.log(`To execute, rerun with: npm run reset:testing-data -- --execute --confirm ${CONFIRMATION_PHRASE}`);
      return;
    }

    // There is no cross-service transaction. Firebase deletion occurs first; MongoDB follows only if it succeeds.
    await deleteFirebaseUsers(auth, firebaseUids);
    console.log(`Deleted ${firebaseUids.length} Firebase Authentication accounts.`);

    for (const { name } of mongoCounts) {
      const result = await mongo.db.collection(name).deleteMany({});
      console.log(`Deleted ${result.deletedCount} MongoDB documents from ${name}.`);
    }

    console.log("Testing-data reset completed. Collections and indexes were preserved.");
  } finally {
    await mongo.close();
  }
}

main().catch((error) => {
  console.error(`Testing-data reset aborted: ${error.message}`);
  process.exitCode = 1;
});
