import mongoose from "mongoose";
import Announcement from "../models/Announcement.js";
import Feedback from "../models/Feedback.js";
import { notifyRoles } from "../utils/notificationService.js";

export const getAnnouncements = async (_req, res) => {
  try {
    const data = await Announcement.find().populate("authorId", "fullName role").sort({ isPinned: -1, createdAt: -1 }).limit(200);
    return res.json({ success: true, count: data.length, data });
  } catch { return res.status(500).json({ success: false, message: "Failed to load announcements." }); }
};

export const createAnnouncement = async (req, res) => {
  try {
    const message = String(req.body.message || "").trim();
    if (!message) return res.status(400).json({ success: false, message: "Announcement text is required." });
    const imageData = String(req.body.imageData || "");
    if (imageData && !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(imageData)) {
      return res.status(400).json({ success: false, message: "Upload a valid JPG, PNG, or WebP image." });
    }
    if (imageData.length > 1_400_000) {
      return res.status(413).json({ success: false, message: "The announcement image must be 1 MB or smaller." });
    }
    const announcement = await Announcement.create({ authorId: req.user.id, message, imageData, imageAlt: String(req.body.imageAlt || "").trim(), isPinned: Boolean(req.body.isPinned) });
    await notifyRoles(["admin", "staff", "patient"], "New health center announcement", message.slice(0, 240), "announcement");
    await announcement.populate("authorId", "fullName role");
    return res.status(201).json({ success: true, message: "Announcement posted.", data: announcement });
  } catch { return res.status(500).json({ success: false, message: "Failed to post announcement." }); }
};

export const deleteAnnouncement = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: "Invalid announcement ID." });
  const item = await Announcement.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ success: false, message: "Announcement not found." });
  return res.json({ success: true, message: "Announcement deleted." });
};

export const submitFeedback = async (req, res) => {
  try {
    const rating = Number(req.body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ success: false, message: "Choose a rating from 1 to 5." });
    const feedback = await Feedback.create({ userId: req.user.id, rating, message: String(req.body.message || "").trim() });
    return res.status(201).json({ success: true, message: "Thank you for your feedback.", data: feedback });
  } catch { return res.status(500).json({ success: false, message: "Failed to submit feedback." }); }
};
