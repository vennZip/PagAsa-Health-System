import express from "express";

import {
  issueQueueTicket,
  getTodayQueue,
  callNextQueueTicket,
  updateQueueTicketStatus,
  getMyQueueTicket
} from "../controllers/queueController.js";

import protect from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

// Patient views only their own active ticket for today.
router.get("/my", protect, authorizeRoles("patient"), getMyQueueTicket);

// Staff and administrators manage the daily FIFO queue.
router.get("/", protect, authorizeRoles("admin", "staff"), getTodayQueue);
router.post("/", protect, authorizeRoles("admin", "staff"), issueQueueTicket);
router.patch(
  "/next/call",
  protect,
  authorizeRoles("admin", "staff"),
  callNextQueueTicket
);
router.patch(
  "/:id/status",
  protect,
  authorizeRoles("admin", "staff"),
  updateQueueTicketStatus
);

export default router;
