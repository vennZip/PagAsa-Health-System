import User from "../models/User.js";

// Register a user profile in MongoDB
export const registerUser = async (req, res) => {
  try {
    const { uid, email } = req.firebaseUser;
    const { fullName, privacyConsent } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({
        success: false,
        message: "Full name and verified email are required."
      });
    }

    const existingUser = await User.findOne({
      firebaseUid: uid
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "This user profile is already registered."
      });
    }

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
      email,
      role: "patient",
      privacyConsent: {
        accepted: true,
        acceptedAt: new Date(),
        version: "2026-11-02"
      }
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
      data: user
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
    const { status } = req.body;

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
    await user.save();

    res.status(200).json({
      success: true,
      message: "User status updated successfully.",
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        status: user.status
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
