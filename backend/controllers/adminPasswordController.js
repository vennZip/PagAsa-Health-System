import mongoose from "mongoose";
import User from "../models/User.js";
import { logActivity } from "../utils/activityLogger.js";
import { isValidPassword, PASSWORD_POLICY_MESSAGE } from "../utils/passwordPolicy.js";

// Firebase Admin stays on the server; inject it so tests never change real accounts.
export const createSetUserPassword = (firebaseAuth) => async (req, res) => {
  res.set("Cache-Control", "no-store");
  if (!req.user) return res.status(401).json({ success: false, message: "Authentication is required." });
  if (req.user.role !== "admin") return res.status(403).json({ success: false, message: "Only admins can set account passwords." });

  const { id } = req.params;
  const { password } = req.body || {};
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid user ID." });
  if (String(id) === String(req.user.id)) return res.status(400).json({ success: false, message: "Use your profile settings to change your own password." });
  if (!isValidPassword(password)) {
    return res.status(400).json({ success: false, message: PASSWORD_POLICY_MESSAGE });
  }

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    // Updating the password also invalidates existing Firebase sessions.
    // Existing authentication middleware checks token revocation on every request.
    await firebaseAuth.updateUser(user.firebaseUid, { password });
    await logActivity({ userId: req.user.id, action: "Set account password", module: "Users", description: `An admin set a new password for ${user.fullName}.`, targetId: user._id, ipAddress: req.ip });
    return res.json({ success: true, message: "Password updated successfully. The account owner can sign in with the new password." });
  } catch (error) {
    if (error.code === "auth/user-not-found") return res.status(404).json({ success: false, message: "This account no longer exists in the authentication service." });
    if (["auth/invalid-password", "auth/password-does-not-meet-requirements"].includes(error.code)) {
      return res.status(400).json({ success: false, message: PASSWORD_POLICY_MESSAGE });
    }
    // Do not log SDK error messages or request bodies: they may contain a password.
    console.error("Admin password update failed:", error.code || "unexpected-error");
    return res.status(500).json({ success: false, message: "Unable to update the password. Please try again." });
  }
};
