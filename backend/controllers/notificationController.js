import mongoose from "mongoose";
import Notification from "../models/Notification.js";

export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(100);
    return res.status(200).json({ success: true, count: notifications.length, data: notifications });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to retrieve notifications." });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid notification ID." });
    const notification = await Notification.findOneAndUpdate({ _id: id, userId: req.user.id }, { isRead: true, readAt: new Date() }, { new: true });
    if (!notification) return res.status(404).json({ success: false, message: "Notification not found." });
    return res.status(200).json({ success: true, message: "Notification marked as read.", data: notification });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update notification." });
  }
};

export const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );
    return res.status(200).json({ success: true, message: "All notifications marked as read." });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to update notifications." });
  }
};
