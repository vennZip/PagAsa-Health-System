import express from "express";
import protect from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";
import { getAvailability, getSchedule, updateSchedule } from "../controllers/scheduleController.js";

const router = express.Router();
router.get("/", protect, getSchedule);
router.get("/availability", protect, getAvailability);
router.put("/", protect, authorizeRoles("admin", "staff"), updateSchedule);
export default router;
