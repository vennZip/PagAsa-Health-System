import express from "express";
import { getDashboardAnalytics } from "../controllers/reportController.js";
import protect from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";
const router = express.Router();
router.get("/dashboard", protect, authorizeRoles("admin", "staff"), getDashboardAnalytics);
export default router;
