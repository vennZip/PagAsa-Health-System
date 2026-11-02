import mongoose from "mongoose";

const daySchema = new mongoose.Schema({
  dayOfWeek: { type: Number, min: 0, max: 6, required: true },
  isOpen: { type: Boolean, default: false },
  openTime: { type: String, default: "08:00" },
  closeTime: { type: String, default: "17:00" }
}, { _id: false });

const clinicScheduleSchema = new mongoose.Schema({
  name: { type: String, default: "default", unique: true },
  slotMinutes: { type: Number, default: 30, min: 15, max: 120 },
  weeklyHours: { type: [daySchema], default: [] },
  closedDates: { type: [String], default: [] },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
}, { timestamps: true, collection: "clinic_schedules" });

export default mongoose.model("ClinicSchedule", clinicScheduleSchema);
