import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    action: {
      type: String,
      required: true,
      trim: true
    },

    module: {
      type: String,
      required: true,
      enum: [
        "Authentication",
        "User Management",
        "Patient Management",
        "Appointments",
        "Health Records",
        "Queue Management",
        "Inventory",
        "Services",
        "Reports",
        "Other"
      ]
    },

    description: {
      type: String,
      required: true,
      trim: true
    },

    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },

    ipAddress: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true,
    collection: "activityLogs"
  }
);

const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);

export default ActivityLog;