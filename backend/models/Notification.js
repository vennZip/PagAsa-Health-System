import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    title: {
      type: String,
      required: true,
      trim: true
    },

    message: {
      type: String,
      required: true,
      trim: true
    },

    type: {
      type: String,
      enum: [
        "appointment",
        "queue",
        "inventory",
        "announcement",
        "system"
      ],
      default: "system"
    },

    isRead: {
      type: Boolean,
      default: false
    },

    readAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    collection: "notifications"
  }
);

const Notification = mongoose.model(
  "Notification",
  notificationSchema
);

export default Notification;