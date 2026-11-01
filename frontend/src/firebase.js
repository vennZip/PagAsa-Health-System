import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAYEH6q9X7D8XYbZTlGZ2QZnBDTtzGstH4",
  authDomain: "barangay-pag-asa-health-center.firebaseapp.com",
  projectId: "barangay-pag-asa-health-center",
  storageBucket: "barangay-pag-asa-health-center.firebasestorage.app",
  messagingSenderId: "371255525816",
  appId: "1:371255525816:web:0d84501350c7459195cf4d"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);