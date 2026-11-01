import express from "express";

import {
  createAppointment,
  getMyAppointments,
  cancelAppointment,
  getAllAppointments,
  updateAppointmentStatus,
  completeAppointment
} from "../controllers/appointmentController.js";

import protect from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

// GET: Staff/Admin view all appointments
router.get(
  "/",
  protect,
  authorizeRoles("admin", "staff"),
  getAllAppointments
);

// PATCH: Staff/Admin approve or reject an appointment
router.patch(
  "/:id/status",
  protect,
  authorizeRoles("admin", "staff"),
  updateAppointmentStatus
);

// PATCH: Staff/Admin mark appointment as completed
router.patch(
  "/:id/complete",
  protect,
  authorizeRoles("admin", "staff"),
  completeAppointment
);

// Patient requests an appointment
router.post(
  "/",
  protect,
  authorizeRoles("patient"),
  createAppointment
);

// Patient views their own appointments
router.get(
  "/my",
  protect,
  authorizeRoles("patient"),
  getMyAppointments
);

// Patient cancels their own pending appointment
router.patch(
  "/:id/cancel",
  protect,
  authorizeRoles("patient"),
  cancelAppointment
);

export default router;