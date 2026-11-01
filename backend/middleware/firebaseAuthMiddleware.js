import { firebaseAuth } from "../config/firebase.js";

const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Firebase authentication token is required."
      });
    }

    const token = authHeader.split(" ")[1];

    // Verify the Firebase ID token
    const decodedToken = await firebaseAuth.verifyIdToken(token, true);

    // Attach verified Firebase information
    req.firebaseUser = {
      uid: decodedToken.uid,
      email: decodedToken.email
    };

    next();

  } catch (error) {
    console.error("Firebase token verification error:", error.message);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired Firebase authentication token."
    });
  }
};

export default verifyFirebaseToken;