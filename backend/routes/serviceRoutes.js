import express from "express";
import { createService, getAllServices, getAvailableServices, updateService } from "../controllers/serviceController.js";
import protect from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

// Anyone can view available health center services
router.get("/", getAvailableServices);
router.get("/manage", protect, authorizeRoles("admin"), getAllServices);
router.post("/", protect, authorizeRoles("admin"), createService);
router.put("/:id", protect, authorizeRoles("admin"), updateService);

export default router;
