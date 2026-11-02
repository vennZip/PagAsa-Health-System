import express from "express";
import protect from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";
import { createAnnouncement, deleteAnnouncement, getAnnouncements, submitFeedback } from "../controllers/announcementController.js";

const router = express.Router();
router.get("/", protect, getAnnouncements);
router.post("/", protect, authorizeRoles("admin"), createAnnouncement);
router.delete("/:id", protect, authorizeRoles("admin"), deleteAnnouncement);
router.post("/feedback", protect, submitFeedback);
export default router;
