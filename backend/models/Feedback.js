import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  message: { type: String, trim: true, maxlength: 1500, default: "" }
}, { timestamps: true, collection: "feedback" });

export default mongoose.model("Feedback", feedbackSchema);
