import express from "express";

import {
  registerUser,
  getCurrentUser,
  updateMyEmail,
  getAllUsers,
  updateUserRole,
  updateUserStatus
} from "../controllers/userController.js";

import verifyFirebaseToken from "../middleware/firebaseAuthMiddleware.js";
import protect from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

// Register a MongoDB user profile after Firebase verification
router.post(
  "/register",
  verifyFirebaseToken,
  registerUser
);

// Retrieve the currently logged-in user's profile and role
router.get(
  "/me",
  protect,
  getCurrentUser
);

router.patch(
  "/me/email",
  verifyFirebaseToken,
  updateMyEmail
);

// Get all registered users (Admin only)
router.get(
  "/",
  protect,
  authorizeRoles("admin"),
  getAllUsers
);

// Update a user's role (Admin only)
router.patch(
  "/:id/role",
  protect,
  authorizeRoles("admin"),
  updateUserRole
);

// Activate or deactivate a user (Admin only)
router.patch(
  "/:id/status",
  protect,
  authorizeRoles("admin"),
  updateUserStatus
);

export default router;
