import Notification from "../models/Notification.js";
import Patient from "../models/Patient.js";

export const notifyPatient = async (patientId, title, message, type) => {
  try {
    const patient = await Patient.findById(patientId).select("userId");
    if (patient) await Notification.create({ userId: patient.userId, title, message, type });
  } catch (error) {
    console.error("Notification error:", error.message);
  }
};
