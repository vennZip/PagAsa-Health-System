import Notification from "../models/Notification.js";
import Patient from "../models/Patient.js";
import User from "../models/User.js";

export const notifyPatient = async (patientId, title, message, type) => {
  try {
    const patient = await Patient.findById(patientId).select("userId");
    if (patient) await Notification.create({ userId: patient.userId, title, message, type });
  } catch (error) {
    console.error("Notification error:", error.message);
  }
};

export const notifyRoles = async (roles, title, message, type) => {
  try {
    const users = await User.find({
      role: { $in: roles },
      status: "active"
    }).select("_id");

    if (users.length > 0) {
      await Notification.insertMany(
        users.map((user) => ({
          userId: user._id,
          title,
          message,
          type
        }))
      );
    }
  } catch (error) {
    console.error("Role notification error:", error.message);
  }
};
