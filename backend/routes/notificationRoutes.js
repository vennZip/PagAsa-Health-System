import express from "express";
import { getMyNotifications, markAllNotificationsRead, markNotificationRead } from "../controllers/notificationController.js";
import protect from "../middleware/authMiddleware.js";
const router = express.Router();
router.get("/my", protect, getMyNotifications);
router.patch("/read-all", protect, markAllNotificationsRead);
router.patch("/:id/read", protect, markNotificationRead);
export default router;
