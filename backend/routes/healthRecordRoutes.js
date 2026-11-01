import express from "express";

import {
  createHealthRecord,
  getPatientHealthRecords
} from "../controllers/healthRecordController.js";

import protect from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";
import checkPatientAccess from "../middleware/patientAccessMiddleware.js";

const router = express.Router();

// Staff and administrators can create health records for patients.
router.post(
  "/",
  protect,
  authorizeRoles("admin", "staff"),
  createHealthRecord
);

// Staff and administrators can view any patient's records.
// Patients can view records only for their own patient profile.
router.get(
  "/patient/:patientId",
  protect,
  authorizeRoles("admin", "staff", "patient"),
  checkPatientAccess,
  getPatientHealthRecords
);

export default router;
