import Appointment from "../models/Appointment.js";
import Medicine from "../models/Medicine.js";
import Patient from "../models/Patient.js";
import QueueTicket from "../models/QueueTicket.js";
import User from "../models/User.js";

export const getDashboardAnalytics = async (req, res) => {
  try {
    const [users, patients, appointments, queueTickets, lowStock] = await Promise.all([
      User.countDocuments(), Patient.countDocuments(), Appointment.countDocuments(), QueueTicket.countDocuments(), Medicine.countDocuments({ status: { $in: ["low-stock", "out-of-stock"] } })
    ]);
    const appointmentStatuses = await Appointment.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
    const queueStatuses = await QueueTicket.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
    return res.status(200).json({ success: true, data: { totals: { users, patients, appointments, queueTickets, lowStock }, appointmentStatuses, queueStatuses } });
  } catch (error) { return res.status(500).json({ success: false, message: "Failed to generate analytics." }); }
};
