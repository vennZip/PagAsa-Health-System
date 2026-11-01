import { existsSync, readFileSync } from "node:fs";
import dotenv from "dotenv";
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

dotenv.config();

const localCredentialUrl = new URL(
  "../firebase-service-account.json",
  import.meta.url
);

const getServiceAccount = () => {
  let rawCredentials = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    rawCredentials = Buffer.from(
      process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
      "base64"
    ).toString("utf8");
  }

  if (!rawCredentials && existsSync(localCredentialUrl)) {
    rawCredentials = readFileSync(localCredentialUrl, "utf8");
  }

  if (!rawCredentials) {
    throw new Error(
      "Firebase Admin credentials are not configured."
    );
  }

  try {
    const credentials = JSON.parse(rawCredentials);

    if (credentials.private_key) {
      credentials.private_key = credentials.private_key.replace(/\\n/g, "\n");
    }

    return credentials;
  } catch {
    throw new Error("Firebase Admin credentials contain invalid JSON.");
  }
};

const serviceAccount = getServiceAccount();

// Initialize Firebase Admin
const firebaseApp = initializeApp({
  credential: cert(serviceAccount)
});

// Export Firebase Authentication
export const firebaseAuth = getAuth(firebaseApp);

console.log("Firebase Admin initialized successfully!");
