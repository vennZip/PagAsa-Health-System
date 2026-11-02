import mongoose from "mongoose";
import Patient from "../models/Patient.js";
import QueueTicket from "../models/QueueTicket.js";
import Appointment from "../models/Appointment.js";
import { logActivity } from "../utils/activityLogger.js";
import { notifyPatient } from "../utils/notificationService.js";

const getPhilippinesQueueDay = () => {
  const dateParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());

  const parts = Object.fromEntries(
    dateParts
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, value])
  );

  return new Date(
    Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day))
  );
};

const getQueueDayRange = () => {
  const start = getPhilippinesQueueDay();
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
};

// GET: Currently approved appointments eligible for a queue ticket.
export const getEligibleQueueAppointments = async (req, res) => {
  try {
    const { start } = getQueueDayRange();
    const appointments = await Appointment.find({
      status: "approved"
    })
      .select("patientId serviceId appointmentDate appointmentTime")
      .populate({
        path: "patientId",
        select: "patientNumber contactNumber",
        populate: { path: "userId", select: "fullName" }
      })
      .populate("serviceId", "serviceName")
      .sort({ appointmentDate: 1, appointmentTime: 1 });

    const patientIds = appointments
      .map((appointment) => appointment.patientId?._id)
      .filter(Boolean);
    const existingTickets = await QueueTicket.find({
      queueDate: start,
      isActive: true,
      patientId: { $in: patientIds }
    }).select("patientId");
    const ticketedPatients = new Set(
      existingTickets.map((ticket) => String(ticket.patientId))
    );
    const eligibleAppointments = appointments.filter(
      (appointment) => !ticketedPatients.has(String(appointment.patientId?._id))
    );

    return res.status(200).json({
      success: true,
      count: eligibleAppointments.length,
      data: eligibleAppointments
    });
  } catch (error) {
    console.error("Get eligible queue appointments error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve approved appointments for the queue."
    });
  }
};

// POST: Issue the next FIFO ticket for a patient on the current Philippine date.
export const issueQueueTicket = async (req, res) => {
  try {
    const { patientId } = req.body;

    if (!patientId || !mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({
        success: false,
        message: "A valid patient ID is required."
      });
    }

    const patient = await Patient.findById(patientId);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found."
      });
    }

    const { start: queueDate } = getQueueDayRange();
    const approvedAppointment = await Appointment.findOne({
      patientId,
      status: "approved"
    });

    if (!approvedAppointment) {
      return res.status(403).json({
        success: false,
        message: "A queue ticket requires a currently approved appointment."
      });
    }

    const existingTicket = await QueueTicket.findOne({
      patientId,
      queueDate,
      isActive: true
    });

    if (existingTicket) {
      return res.status(409).json({
        success: false,
        message: "This patient already has an active queue ticket today.",
        data: existingTicket
      });
    }

    // The unique index prevents duplicate numbers if two staff members issue tickets together.
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const latestTicket = await QueueTicket.findOne({ queueDate })
        .sort({ queueNumber: -1 })
        .select("queueNumber")
        .lean();

      const queueNumber = (latestTicket?.queueNumber || 0) + 1;

      try {
        const queueTicket = await QueueTicket.create({
          patientId,
          queueNumber,
          queueDate,
          priority: "normal"
        });
        await logActivity({ userId: req.user.id, action: "Issued queue ticket", module: "Queue Management", description: `Issued queue number ${queueNumber}.`, targetId: queueTicket._id, ipAddress: req.ip });
        await notifyPatient(patientId, "Queue ticket issued", `Your queue number for today is ${queueNumber}.`, "queue");

        return res.status(201).json({
          success: true,
          message: "Queue ticket issued successfully.",
          data: queueTicket
        });
      } catch (error) {
        if (error?.code === 11000 && error.keyPattern?.patientId) {
          return res.status(409).json({
            success: false,
            message: "This patient already has an active queue ticket today."
          });
        }

        if (error?.code !== 11000 || attempt === 2) {
          throw error;
        }
      }
    }
  } catch (error) {
    console.error("Issue queue ticket error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to issue queue ticket."
    });
  }
};

// GET: Staff/Admin view today's queue in FIFO order.
export const getTodayQueue = async (req, res) => {
  try {
    const queueDate = getPhilippinesQueueDay();
    const queueTickets = await QueueTicket.find({ queueDate })
      .populate({
        path: "patientId",
        select: "patientNumber contactNumber",
        populate: {
          path: "userId",
          select: "fullName"
        }
      })
      .sort({ queueNumber: 1 });

    return res.status(200).json({
      success: true,
      count: queueTickets.length,
      data: queueTickets
    });
  } catch (error) {
    console.error("Get today's queue error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve today's queue."
    });
  }
};

// PATCH: Call the earliest waiting ticket, preserving FIFO order.
export const callNextQueueTicket = async (req, res) => {
  try {
    const queueDate = getPhilippinesQueueDay();
    const activeTicket = await QueueTicket.findOne({
      queueDate,
      isCurrent: true
    });

    if (activeTicket) {
      return res.status(400).json({
        success: false,
        message: "Complete or skip the current patient before calling the next ticket."
      });
    }

    const queueTicket = await QueueTicket.findOneAndUpdate(
      { queueDate, status: "waiting" },
      {
        $set: {
          status: "called",
          isCurrent: true,
          calledAt: new Date()
        }
      },
      { new: true, sort: { queueNumber: 1 } }
    ).populate({
      path: "patientId",
      select: "patientNumber contactNumber",
      populate: {
        path: "userId",
        select: "fullName"
      }
    });

    if (!queueTicket) {
      return res.status(404).json({
        success: false,
        message: "No waiting queue tickets found today."
      });
    }
    await logActivity({ userId: req.user.id, action: "Called next patient", module: "Queue Management", description: `Called queue number ${queueTicket.queueNumber}.`, targetId: queueTicket._id, ipAddress: req.ip });
    await notifyPatient(queueTicket.patientId._id, "You are being called", `Queue number ${queueTicket.queueNumber} is now being called.`, "queue");

    return res.status(200).json({
      success: true,
      message: "Next patient called successfully.",
      data: queueTicket
    });
  } catch (error) {
    console.error("Call next queue ticket error:", error.message);

    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Another staff member has already called the next patient."
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to call the next queue ticket."
    });
  }
};

// PATCH: Move a called or serving ticket through the queue workflow.
export const updateQueueTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid queue ticket ID."
      });
    }

    if (!["serving", "completed", "skipped"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be serving, completed, or skipped."
      });
    }

    const queueTicket = await QueueTicket.findById(id);

    if (!queueTicket) {
      return res.status(404).json({
        success: false,
        message: "Queue ticket not found."
      });
    }

    const allowedTransitions = {
      called: ["serving", "skipped"],
      serving: ["completed", "skipped"]
    };

    if (!allowedTransitions[queueTicket.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `A ${queueTicket.status} ticket cannot be changed to ${status}.`
      });
    }

    queueTicket.status = status;

    if (status === "completed") {
      queueTicket.completedAt = new Date();
    }

    if (["completed", "skipped"].includes(status)) {
      queueTicket.isActive = false;
      queueTicket.isCurrent = false;
    }

    await queueTicket.save();
    await logActivity({ userId: req.user.id, action: "Updated queue ticket", module: "Queue Management", description: `Marked queue number ${queueTicket.queueNumber} as ${status}.`, targetId: queueTicket._id, ipAddress: req.ip });
    await notifyPatient(queueTicket.patientId, "Queue status updated", `Your queue ticket is now ${status}.`, "queue");

    return res.status(200).json({
      success: true,
      message: `Queue ticket marked as ${status}.`,
      data: queueTicket
    });
  } catch (error) {
    console.error("Update queue ticket status error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to update queue ticket."
    });
  }
};

// GET: Patient views only their own active ticket for today.
export const getMyQueueTicket = async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user.id });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient profile not found."
      });
    }

    const queueDate = getPhilippinesQueueDay();
    const queueTicket = await QueueTicket.findOne({
      patientId: patient._id,
      queueDate,
      isActive: true
    });

    return res.status(200).json({
      success: true,
      data: queueTicket
    });
  } catch (error) {
    console.error("Get my queue ticket error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve queue ticket."
    });
  }
};
