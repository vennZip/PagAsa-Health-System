import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true
    },

    fullName: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    role: {
      type: String,
      enum: ["admin", "staff", "patient"],
      required: true,
      default: "patient"
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    },

    privacyConsent: {
      accepted: {
        type: Boolean,
        default: false
      },
      acceptedAt: Date,
      version: String
    }
  },
  {
    timestamps: true,
    collection: "users"
  }
);

const User = mongoose.model("User", userSchema);

export default User;
