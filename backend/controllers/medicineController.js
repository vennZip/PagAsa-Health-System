import mongoose from "mongoose";
import InventoryTransaction from "../models/InventoryTransaction.js";
import Medicine from "../models/Medicine.js";
import { logActivity } from "../utils/activityLogger.js";
import { notifyRoles } from "../utils/notificationService.js";

const getStockStatus = (quantity, minimumStock) => {
  if (quantity === 0) return "out-of-stock";
  if (quantity <= minimumStock) return "low-stock";
  return "available";
};

export const getMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.find().sort({ medicineName: 1 });
    return res.status(200).json({ success: true, count: medicines.length, data: medicines });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to retrieve medicines." });
  }
};

export const createMedicine = async (req, res) => {
  try {
    const { medicineName, description, unit, quantity = 0, minimumStock = 10, expirationDate } = req.body;
    if (!medicineName || !unit || quantity < 0 || minimumStock < 0) {
      return res.status(400).json({ success: false, message: "Medicine name, unit, and valid stock values are required." });
    }
    const medicine = await Medicine.create({
      medicineName,
      description,
      unit,
      quantity,
      minimumStock,
      expirationDate: expirationDate || null,
      status: getStockStatus(Number(quantity), Number(minimumStock))
    });
    if (["low-stock", "out-of-stock"].includes(medicine.status)) {
      await notifyRoles(["admin", "staff"], "Inventory warning", `${medicine.medicineName} is ${medicine.status.replaceAll("-", " ")}.`, "inventory");
    }
    return res.status(201).json({ success: true, message: "Medicine added successfully.", data: medicine });
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ success: false, message: "This medicine already exists." });
    return res.status(500).json({ success: false, message: "Failed to add medicine." });
  }
};

export const updateMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const { medicineName, description, unit, minimumStock, expirationDate } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid medicine ID." });
    const medicine = await Medicine.findById(id);
    if (!medicine) return res.status(404).json({ success: false, message: "Medicine not found." });
    if (medicineName) medicine.medicineName = medicineName;
    if (description !== undefined) medicine.description = description;
    if (unit) medicine.unit = unit;
    if (minimumStock !== undefined && Number(minimumStock) >= 0) medicine.minimumStock = Number(minimumStock);
    if (expirationDate !== undefined) medicine.expirationDate = expirationDate || null;
    medicine.status = getStockStatus(medicine.quantity, medicine.minimumStock);
    await medicine.save();
    return res.status(200).json({ success: true, message: "Medicine updated successfully.", data: medicine });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update medicine." });
  }
};

export const createInventoryTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { transactionType, quantity, reason } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id) || !["stock-in", "stock-out", "adjustment", "expired"].includes(transactionType) || !Number.isFinite(Number(quantity)) || Number(quantity) <= 0 || !reason?.trim()) {
      return res.status(400).json({ success: false, message: "A valid transaction type, quantity, and reason are required." });
    }
    const medicine = await Medicine.findById(id);
    if (!medicine) return res.status(404).json({ success: false, message: "Medicine not found." });
    const previousStatus = medicine.status;
    const amount = Number(quantity);
    const addStock = ["stock-in", "adjustment"].includes(transactionType);
    if (!addStock && medicine.quantity < amount) return res.status(400).json({ success: false, message: "Insufficient stock for this transaction." });
    medicine.quantity += addStock ? amount : -amount;
    medicine.status = getStockStatus(medicine.quantity, medicine.minimumStock);
    await medicine.save();
    if (medicine.status !== previousStatus && ["low-stock", "out-of-stock"].includes(medicine.status)) {
      await notifyRoles(["admin", "staff"], "Inventory warning", `${medicine.medicineName} is ${medicine.status.replaceAll("-", " ")} with ${medicine.quantity} ${medicine.unit} remaining.`, "inventory");
    }
    const transaction = await InventoryTransaction.create({ medicineId: medicine._id, transactionType, quantity: amount, reason: reason.trim(), performedBy: req.user.id });
    await logActivity({ userId: req.user.id, action: "Inventory transaction", module: "Inventory", description: `${transactionType} of ${amount} ${medicine.unit} for ${medicine.medicineName}.`, targetId: medicine._id, ipAddress: req.ip });
    return res.status(201).json({ success: true, message: "Inventory updated successfully.", data: { medicine, transaction } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update inventory." });
  }
};

export const getInventoryTransactions = async (req, res) => {
  try {
    const transactions = await InventoryTransaction.find()
      .populate("medicineId", "medicineName unit")
      .populate("performedBy", "fullName")
      .sort({ transactionDate: -1 })
      .limit(100);
    return res.status(200).json({ success: true, count: transactions.length, data: transactions });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to retrieve inventory transactions." });
  }
};
