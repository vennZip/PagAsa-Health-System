import User from "../models/User.js";
import Patient from "../models/Patient.js";
import { logActivity } from "../utils/activityLogger.js";

// Register a user profile in MongoDB
export const registerUser = async (req, res) => {
  try {
    const { uid, email, authTime } = req.firebaseUser;
    const { privacyConsent } = req.body;

    const existingUser = await User.findOne({
      firebaseUid: uid
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "This user profile is already registered."
      });
    }

    const names = {};
    for (const field of ["firstName", "secondName", "middleName", "lastName", "suffix"]) {
      const value = req.body[field] ?? "";
      if (typeof value !== "string" || value.trim().length > (field === "suffix" ? 30 : 100)) {
        return res.status(400).json({ success: false, message: "Please enter valid name fields." });
      }
      names[field] = field === "suffix" ? value.trim() : value.trim().replace(/^\p{L}/u, (letter) => letter.toLocaleUpperCase("en-PH"));
    }
    if (!names.firstName || !names.lastName || !email) {
      return res.status(400).json({ success: false, message: "First name, last name, and verified email are required." });
    }
    const fullName = Object.values(names).filter(Boolean).join(" ");

    const existingEmail = await User.findOne({ email });

    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: "This email is already registered."
      });
    }

    if (privacyConsent !== true) {
      return res.status(400).json({
        success: false,
        message: "You must agree to the privacy notice before creating an account."
      });
    }

    const user = await User.create({
      firebaseUid: uid,
      fullName,
      ...names,
      email,
      role: "patient",
      privacyConsent: {
        accepted: true,
        acceptedAt: new Date(),
        version: "2026-11-02"
      },
      activeAuthTime: authTime
    });

    res.status(201).json({
      success: true,
      message: "User profile registered successfully.",
      data: user
    });

  } catch (error) {
    console.error("User registration error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to register user profile."
    });
  }
};

// Make the newest Firebase sign-in the account's only active session.
export const activateSession = async (req, res) => {
  try {
    const { uid, authTime } = req.firebaseUser;
    const user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User profile not found."
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive. Access denied."
      });
    }

    user.activeAuthTime = authTime;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Session activated successfully."
    });
  } catch (error) {
    console.error("Activate session error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to activate the session."
    });
  }
};

// Get the currently logged-in user's MongoDB profile
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "-__v"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User profile not found."
      });
    }

    res.status(200).json({
      success: true,
      data: user,
      hasPatientProfile: user.role !== "patient" || Boolean(await Patient.exists({ userId: user._id }))
    });

  } catch (error) {
    console.error("Get current user error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve user profile."
    });
  }
};

// Synchronize an authenticated Firebase email change with MongoDB
export const updateMyEmail = async (req, res) => {
  try {
    const { uid, email } = req.firebaseUser;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "A valid Firebase email is required."
      });
    }

    const user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User profile not found."
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive. Access denied."
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: user._id }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "This email is already registered."
      });
    }

    user.email = normalizedEmail;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Email updated successfully.",
      data: user
    });
  } catch (error) {
    console.error("Update email error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to update email."
    });
  }
};

// Get all registered users (Admin only)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-__v -firebaseUid")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });

  } catch (error) {
    console.error("Get all users error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve users."
    });
  }
};

const allowedRoles = ["patient", "staff", "admin"];

// Update another user's role (Admin only)
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role."
      });
    }

    if (String(id) === String(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own role."
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: "User role updated successfully.",
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Update user role error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to update user role."
    });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, statusRemark = "" } = req.body;

    if (typeof statusRemark !== "string" || statusRemark.trim().length > 500) {
      return res.status(400).json({ success: false, message: "The status remark must be 500 characters or fewer." });
    }

    const allowedStatuses = ["active", "inactive"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid account status."
      });
    }

    // Prevent an admin from deactivating their own account
    if (String(id) === String(req.user.id) && status === "inactive") {
      return res.status(400).json({
        success: false,
        message: "You cannot deactivate your own account."
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    user.status = status;
    user.statusRemark = status === "inactive" ? statusRemark.trim() : "";
    await user.save();
    await logActivity({ userId: req.user.id, action: "Changed account status", module: "Users", description: `${user.fullName}: ${status}.${user.statusRemark ? ` Remark: ${user.statusRemark}` : ""}`, targetId: user._id, ipAddress: req.ip });

    res.status(200).json({
      success: true,
      message: "User status updated successfully.",
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        status: user.status,
        statusRemark: user.statusRemark
      }
    });

  } catch (error) {
    console.error("Update user status error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to update user status."
    });
  }
};
