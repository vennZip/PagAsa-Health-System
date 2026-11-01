import Patient from "../models/Patient.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import { randomBytes } from "node:crypto";

// GET: Retrieve all patients
export const getPatients = async (req, res) => {
  try {
    const patients = await Patient.find()
      .select("-__v")
      .populate("userId", "fullName email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: patients.length,
      data: patients
    });
  } catch (error) {
    console.error("Get patients error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve patients."
    });
  }
};

// GET: Retrieve one patient by ID
export const getPatientById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid patient ID."
      });
    }

    const patient = await Patient.findById(req.params.id)
      .select("-__v")
      .populate("userId", "fullName email");

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found."
      });
    }

    res.status(200).json({
      success: true,
      data: patient
    });
  } catch (error) {
    console.error("Get patient by ID error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve patient."
    });
  }
};

// POST: Register a patient profile
export const createPatient = async (req, res) => {
  try {
    const {
      birthDate,
      sex,
      address,
      contactNumber,
      emergencyContact
    } = req.body;

    const userId =
      req.user.role === "patient"
        ? req.user.id
        : req.body.userId;

    if (!userId || !birthDate || !sex || !address || !contactNumber) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required patient information."
      });
    }

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID."
      });
    }

    const existingUser = await User.findById(userId);

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User account not found."
      });
    }

    if (existingUser.role !== "patient") {
      return res.status(400).json({
        success: false,
        message: "Only patient accounts can have patient profiles."
      });
    }

    const patientNumber = `PAG-${new Date().getFullYear()}-${randomBytes(3)
      .toString("hex")
      .toUpperCase()}`;

    const patient = await Patient.create({
      userId,
      patientNumber,
      birthDate,
      sex,
      address,
      contactNumber,
      emergencyContact
    });

    res.status(201).json({
      success: true,
      message: "Patient registered successfully.",
      data: patient
    });
  } catch (error) {
    console.error("Create patient error:", error.message);

    res.status(error.code === 11000 ? 409 : 400).json({
      success: false,
      message: error.code === 11000
        ? "The user or patient number is already registered."
        : "Failed to register patient."
    });
  }
};

// PUT: Update a patient profile
export const updatePatient = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid patient ID."
      });
    }

    const {
      birthDate,
      sex,
      address,
      contactNumber,
      emergencyContact
    } = req.body;

    const allowedFields = {
      birthDate,
      sex,
      address,
      contactNumber,
      emergencyContact
    };

    Object.keys(allowedFields).forEach((key) => {
      if (allowedFields[key] === undefined) {
        delete allowedFields[key];
      }
    });

    if (Object.keys(allowedFields).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one valid field to update."
      });
    }

    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { $set: allowedFields },
      {
        new: true,
        runValidators: true
      }
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found."
      });
    }

    res.status(200).json({
      success: true,
      message: "Patient updated successfully.",
      data: patient
    });
  } catch (error) {
    console.error("Update patient error:", error.message);

    res.status(400).json({
      success: false,
      message: "Failed to update patient."
    });
  }
};

// GET: Retrieve the logged-in patient's own profile
export const getMyPatientProfile = async (req, res) => {
  try {
    const patient = await Patient.findOne({
      userId: req.user.id
    })
      .select("-__v")
      .populate("userId", "fullName email");

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient profile not found."
      });
    }

    res.status(200).json({
      success: true,
      data: patient
    });
  } catch (error) {
    console.error("Get my patient profile error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve your profile."
    });
  }
};

// PUT: Update the logged-in patient's own profile
export const updateMyPatientProfile = async (req, res) => {
  try {
    const {
      birthDate,
      sex,
      address,
      contactNumber,
      emergencyContact
    } = req.body;

    const allowedFields = {
      birthDate,
      sex,
      address,
      contactNumber,
      emergencyContact
    };

    Object.keys(allowedFields).forEach((key) => {
      if (allowedFields[key] === undefined) {
        delete allowedFields[key];
      }
    });

    if (Object.keys(allowedFields).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one field to update."
      });
    }

    const patient = await Patient.findOneAndUpdate(
      { userId: req.user.id },
      { $set: allowedFields },
      {
        new: true,
        runValidators: true
      }
    ).select("-__v");

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient profile not found."
      });
    }

    res.status(200).json({
      success: true,
      message: "Your profile was updated successfully.",
      data: patient
    });

  } catch (error) {
    console.error("Update my profile error:", error.message);

    res.status(400).json({
      success: false,
      message: "Failed to update your profile."
    });
  }
};