import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  message: { type: String, required: true, trim: true, maxlength: 2000 },
  imageData: { type: String, default: "" },
  imageAlt: { type: String, trim: true, maxlength: 180, default: "" },
  isPinned: { type: Boolean, default: false }
}, { timestamps: true, collection: "announcements" });

export default mongoose.model("Announcement", announcementSchema);
