import express from "express";
import { createInventoryTransaction, createMedicine, getInventoryTransactions, getMedicines, updateMedicine } from "../controllers/medicineController.js";
import protect from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";

const router = express.Router();
router.use(protect, authorizeRoles("admin", "staff"));
router.get("/", getMedicines);
router.post("/", createMedicine);
router.put("/:id", updateMedicine);
router.post("/:id/transactions", createInventoryTransaction);
router.get("/transactions/history", getInventoryTransactions);
export default router;
