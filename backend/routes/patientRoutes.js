import express from "express";

import {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  getMyPatientProfile,
  updateMyPatientProfile
} from "../controllers/patientController.js";

import protect from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";
import checkPatientAccess from "../middleware/patientAccessMiddleware.js";

const router = express.Router();

// Admin and staff can view all patients
router.get(
  "/",
  protect,
  authorizeRoles("admin", "staff"),
  getPatients
);

// Patients can view their own profile
router.get(
  "/me",
  protect,
  authorizeRoles("patient"),
  getMyPatientProfile
);

// Patients can update only their own profile
router.put(
  "/me",
  protect,
  authorizeRoles("patient"),
  updateMyPatientProfile
);

// Admin, staff, or the profile owner can view a patient by ID
router.get(
  "/:id",
  protect,
  authorizeRoles("admin", "staff", "patient"),
  checkPatientAccess,
  getPatientById
);

// Patients, admin, and staff can register patient profiles
router.post(
  "/",
  protect,
  authorizeRoles("admin", "staff", "patient"),
  createPatient
);

// Only admin and staff can update profiles by patient ID
router.put(
  "/:id",
  protect,
  authorizeRoles("admin", "staff"),
  updatePatient
);

export default router;