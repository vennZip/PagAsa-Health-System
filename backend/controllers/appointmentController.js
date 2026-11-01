import Appointment from "../models/Appointment.js";
import Patient from "../models/Patient.js";
import Service from "../models/Service.js";
import mongoose from "mongoose";
import { logActivity } from "../utils/activityLogger.js";
import { notifyPatient, notifyRoles } from "../utils/notificationService.js";

// POST: Patient requests an appointment
export const createAppointment = async (req, res) => {
  try {
    const { serviceId, appointmentDate, appointmentTime } = req.body;

    // Check required fields
    if (!serviceId || !appointmentDate || !appointmentTime) {
      return res.status(400).json({
        success: false,
        message: "Please provide the service, date, and time."
      });
    }

    // Find the logged-in patient's profile
    const patient = await Patient.findOne({
      userId: req.user.id
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient profile not found."
      });
    }

    const activeAppointment = await Appointment.findOne({
      patientId: patient._id,
      status: { $in: ["pending", "approved"] }
    }).select("status appointmentDate appointmentTime");

    if (activeAppointment) {
      return res.status(409).json({
        success: false,
        message: "You already have an active appointment. Wait for it to be completed, or cancel it while it is pending, before requesting another one.",
        data: activeAppointment
      });
    }

    // Check whether the selected service exists
    const service = await Service.findById(serviceId);

    if (!service || service.availability !== "available") {
      return res.status(404).json({
        success: false,
        message: "Selected health service is unavailable."
      });
    }

    // Validate appointment date
    const selectedDate = new Date(appointmentDate);

    if (
      Number.isNaN(selectedDate.getTime()) ||
      selectedDate < new Date(new Date().setHours(0, 0, 0, 0))
    ) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid current or future appointment date."
      });
    }

    // Create appointment request
    const appointment = await Appointment.create({
      patientId: patient._id,
      serviceId,
      appointmentDate: selectedDate,
      appointmentTime,
      status: "pending"
    });
    await logActivity({ userId: req.user.id, action: "Requested appointment", module: "Appointments", description: "Submitted an appointment request.", targetId: appointment._id, ipAddress: req.ip });
    await notifyRoles(
      ["admin", "staff"],
      "New appointment request",
      `${req.user.fullName} requested ${service.serviceName} on ${selectedDate.toLocaleDateString("en-PH")}.`,
      "appointment"
    );

    res.status(201).json({
      success: true,
      message: "Appointment request submitted successfully.",
      data: appointment
    });

  } catch (error) {
    console.error("Create appointment error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to submit appointment request."
    });
  }
};

// GET: Retrieve the logged-in patient's appointments
export const getMyAppointments = async (req, res) => {
  try {
    const patient = await Patient.findOne({
      userId: req.user.id
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient profile not found."
      });
    }

    const appointments = await Appointment.find({
      patientId: patient._id
    })
      .populate("serviceId", "serviceName description category")
      .sort({ appointmentDate: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });

  } catch (error) {
    console.error("Get appointments error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve appointments."
    });
  }
};

// PATCH: Patient cancels their own pending appointment
export const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment ID."
      });
    }

    const patient = await Patient.findOne({
      userId: req.user.id
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient profile not found."
      });
    }

    const appointment = await Appointment.findOne({
      _id: id,
      patientId: patient._id
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found."
      });
    }
    if (appointment.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending appointments can be cancelled."
      });
    }

    appointment.status = "cancelled";
    await appointment.save();
    await logActivity({ userId: req.user.id, action: "Cancelled appointment", module: "Appointments", description: "Cancelled a pending appointment request.", targetId: appointment._id, ipAddress: req.ip });
    await notifyRoles(
      ["admin", "staff"],
      "Appointment cancelled",
      `${req.user.fullName} cancelled a pending appointment request.`,
      "appointment"
    );

    res.status(200).json({
      success: true,
      message: "Appointment cancelled successfully.",
      data: appointment
    });

  } catch (error) {
    console.error("Cancel appointment error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to cancel appointment."
    });
  }
};

// GET: Retrieve all appointments for Staff/Admin
export const getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate({
        path: "patientId",
        select: "patientNumber contactNumber",
        populate: {
          path: "userId",
          select: "fullName email"
        }
      })
      .populate(
        "serviceId",
        "serviceName description category"
      )
      .populate("approvedBy", "fullName")
      .sort({
        appointmentDate: 1,
        appointmentTime: 1
      });

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });

  } catch (error) {
    console.error("Get all appointments error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve all appointments."
    });
  }
};

// PATCH: Staff/Admin approve or reject an appointment
export const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment ID."
      });
    }

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be approved or rejected."
      });
    }

    const appointment = await Appointment.findOneAndUpdate(
      {
        _id: id,
        status: "pending"
      },
      {
        $set: {
          status,
          remarks: remarks || "",
          approvedBy: status === "approved" ? req.user.id : null
        }
      },
      {
        new: true,
        runValidators: true
      }
    )
      .populate("patientId")
      .populate("serviceId", "serviceName category")
      .populate("approvedBy", "fullName");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found or it is no longer pending."
      });
    }
    const statusLabel = status === "approved" ? "approved" : "rejected";
    await logActivity({ userId: req.user.id, action: `${statusLabel === "approved" ? "Approved" : "Rejected"} appointment`, module: "Appointments", description: `Marked an appointment as ${statusLabel}.`, targetId: appointment._id, ipAddress: req.ip });
    await notifyPatient(appointment.patientId._id, `Appointment ${statusLabel}`, `Your appointment request was ${statusLabel}.${remarks ? ` Remarks: ${remarks}` : ""}`, "appointment");

    res.status(200).json({
      success: true,
      message: `Appointment ${status} successfully.`,
      data: appointment
    });

  } catch (error) {
    console.error("Update appointment status error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to update appointment status."
    });
  }
};

// PATCH: Staff/Admin mark an approved appointment as completed
export const completeAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment ID."
      });
    }

    const appointment = await Appointment.findOneAndUpdate(
      {
        _id: id,
        status: "approved"
      },
      {
        $set: {
          status: "completed"
        }
      },
      {
        new: true,
        runValidators: true
      }
    )
      .populate("patientId")
      .populate("serviceId", "serviceName category")
      .populate("approvedBy", "fullName");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found or it is not approved."
      });
    }

    await logActivity({ userId: req.user.id, action: "Completed appointment", module: "Appointments", description: "Marked an appointment as completed.", targetId: appointment._id, ipAddress: req.ip });
    await notifyPatient(appointment.patientId._id, "Appointment completed", "Your appointment has been marked as completed.", "appointment");

    res.status(200).json({
      success: true,
      message: "Appointment marked as completed successfully.",
      data: appointment
    });

  } catch (error) {
    console.error("Complete appointment error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to complete appointment."
    });
  }
};
