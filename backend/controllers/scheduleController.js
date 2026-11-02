import Appointment from "../models/Appointment.js";
import ClinicSchedule from "../models/ClinicSchedule.js";

const defaults = () => ({
  name: "default",
  slotMinutes: 30,
  weeklyHours: Array.from({ length: 7 }, (_, dayOfWeek) => ({
    dayOfWeek,
    isOpen: dayOfWeek >= 1 && dayOfWeek <= 5,
    openTime: "08:00",
    closeTime: "17:00"
  })),
  closedDates: []
});

const getOrCreateSchedule = async () => {
  let schedule = await ClinicSchedule.findOne({ name: "default" });
  if (!schedule) schedule = await ClinicSchedule.create(defaults());
  return schedule;
};

const dateKey = (value) => {
  const match = String(value || "").match(/^\d{4}-\d{2}-\d{2}$/);
  return match ? match[0] : null;
};

const minutes = (time) => {
  const [hour, minute] = time.split(":").map(Number);
  return (hour * 60) + minute;
};

const timeLabel = (total) => `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;

export const buildAvailability = async (requestedDate) => {
  const key = dateKey(requestedDate);
  if (!key) return { error: "Choose a valid appointment date." };
  const selectedDate = new Date(`${key}T00:00:00.000Z`);
  const today = new Date();
  const todayKey = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit" }).format(today);
  if (key < todayKey) return { error: "Appointment dates cannot be in the past." };

  const schedule = await getOrCreateSchedule();
  const selectedDayOfWeek = selectedDate.getUTCDay();
  const day = schedule.weeklyHours.find((item) => Number(item.dayOfWeek) === selectedDayOfWeek);
  if (!day?.isOpen || schedule.closedDates.includes(key)) {
    return { schedule, date: key, isOpen: false, slots: [] };
  }

  const start = new Date(`${key}T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  const taken = await Appointment.find({
    appointmentDate: { $gte: start, $lt: end },
    status: { $in: ["pending", "approved"] }
  }).distinct("appointmentTime");
  const takenSet = new Set(taken);
  const slots = [];
  for (let value = minutes(day.openTime); value + schedule.slotMinutes <= minutes(day.closeTime); value += schedule.slotMinutes) {
    const time = timeLabel(value);
    slots.push({ time, available: !takenSet.has(time) });
  }
  return { schedule, date: key, isOpen: true, slots };
};

export const getSchedule = async (_req, res) => {
  const schedule = await getOrCreateSchedule();
  res.set("Cache-Control", "no-store");
  return res.json({ success: true, data: schedule });
};

export const getAvailability = async (req, res) => {
  try {
    const availability = await buildAvailability(req.query.date);
    if (availability.error) return res.status(400).json({ success: false, message: availability.error });
    res.set("Cache-Control", "no-store");
    return res.json({ success: true, data: availability });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to load appointment availability." });
  }
};

export const updateSchedule = async (req, res) => {
  try {
    const { weeklyHours, closedDates } = req.body;
    if (!Array.isArray(weeklyHours) || weeklyHours.length !== 7) {
      return res.status(400).json({ success: false, message: "Provide clinic hours for all seven days." });
    }
    const receivedDays = weeklyHours.map((day) => Number(day.dayOfWeek));
    if (new Set(receivedDays).size !== 7 || receivedDays.some((day) => !Number.isInteger(day) || day < 0 || day > 6)) {
      return res.status(400).json({ success: false, message: "Clinic hours must contain each day of the week exactly once." });
    }
    for (const day of weeklyHours) {
      if (day.isOpen && (!/^\d{2}:\d{2}$/.test(day.openTime) || !/^\d{2}:\d{2}$/.test(day.closeTime) || minutes(day.openTime) >= minutes(day.closeTime))) {
        return res.status(400).json({ success: false, message: "Each open day needs valid opening and closing times." });
      }
    }
    const safeClosedDates = [...new Set((closedDates || []).map(dateKey).filter(Boolean))].sort();
    const schedule = await ClinicSchedule.findOneAndUpdate(
      { name: "default" },
      { $set: { weeklyHours, closedDates: safeClosedDates, slotMinutes: 30, updatedBy: req.user.id } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    return res.json({ success: true, message: "Clinic schedule updated.", data: schedule });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update clinic schedule." });
  }
};
