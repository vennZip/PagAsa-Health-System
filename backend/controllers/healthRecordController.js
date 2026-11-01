import mongoose from "mongoose";
import HealthRecord from "../models/HealthRecord.js";
import Patient from "../models/Patient.js";
import Service from "../models/Service.js";

// Create a new health record
export const createHealthRecord = async (req, res) => {
  try {
    const {
      patientId,
      serviceId,
      visitDate,
      complaint,
      observations,
      notes
    } = req.body;

    // Validate required fields
    if (!patientId || !serviceId || !visitDate || !complaint) {
      return res.status(400).json({
        success: false,
        message: "Patient, service, visit date, and complaint are required."
      });
    }

    // Validate IDs
    if (
      !mongoose.Types.ObjectId.isValid(patientId) ||
      !mongoose.Types.ObjectId.isValid(serviceId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid patient or service ID."
      });
    }

    // Check if patient exists
    const patient = await Patient.findById(patientId);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found."
      });
    }

    // Health records may only be created for an existing, available service.
    const service = await Service.findById(serviceId);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found."
      });
    }

    if (service.availability !== "available") {
      return res.status(400).json({
        success: false,
        message: "This service is currently unavailable."
      });
    }

    // Create the health record
    const healthRecord = await HealthRecord.create({
      patientId,
      staffId: req.user.id,
      serviceId,
      visitDate,
      complaint,
      observations,
      notes
    });

    return res.status(201).json({
      success: true,
      message: "Health record created successfully.",
      data: healthRecord
    });

  } catch (error) {
    console.error("Create health record error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create health record."
    });
  }
};

// Get all health records for a specific patient
export const getPatientHealthRecords = async (req, res) => {
  try {
    const { patientId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid patient ID."
      });
    }

    const patient = await Patient.findById(patientId);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found."
      });
    }

    const healthRecords = await HealthRecord.find({ patientId })
      .populate("staffId", "fullName email")
      .populate("serviceId", "serviceName category")
      .sort({ visitDate: -1 });

    return res.status(200).json({
      success: true,
      count: healthRecords.length,
      data: healthRecords
    });

  } catch (error) {
    console.error("Get patient health records error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve health records."
    });
  }
};
