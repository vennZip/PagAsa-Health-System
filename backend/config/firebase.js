import { readFileSync } from "node:fs";
import dotenv from "dotenv";
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

dotenv.config();

// Prefer an environment variable in deployment; retain the ignored local file for development.
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
  : JSON.parse(
    readFileSync(
      new URL("../firebase-service-account.json", import.meta.url),
      "utf8"
    )
  );

// Initialize Firebase Admin
const firebaseApp = initializeApp({
  credential: cert(serviceAccount)
});

// Export Firebase Authentication
export const firebaseAuth = getAuth(firebaseApp);

console.log("Firebase Admin initialized successfully!");
