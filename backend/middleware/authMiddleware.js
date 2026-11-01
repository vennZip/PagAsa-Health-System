import { firebaseAuth } from "../config/firebase.js";
import User from "../models/User.js";

const protect = async (req, res, next) => {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Authentication token is required."
      });
    }

    // Extract the Firebase ID token
    const token = authHeader.split(" ")[1];

    // Verify the Firebase token
    const decodedToken = await firebaseAuth.verifyIdToken(
      token,
      true
    );

    // Find the corresponding user in MongoDB
    const user = await User.findOne({
      firebaseUid: decodedToken.uid
    }).select("-__v");

    if (!user) {
      return res.status(403).json({
        success: false,
        message: "User account is not registered in the system."
      });
    }

    // Check whether the account is active
    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive. Access denied."
      });
    }

    // Attach verified user information to the request
    req.user = {
      id: user._id,
      firebaseUid: user.firebaseUid,
      fullName: user.fullName,
      email: user.email,
      role: user.role
    };

    // Continue to the next middleware or controller
    next();

  } catch (error) {
    console.error("Authentication error:", error.message);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token."
    });
  }
};

export default protect;
