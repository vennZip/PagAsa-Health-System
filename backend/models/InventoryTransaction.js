import mongoose from "mongoose";

const inventoryTransactionSchema = new mongoose.Schema(
  {
    medicineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Medicine",
      required: true
    },

    transactionType: {
      type: String,
      enum: ["stock-in", "stock-out", "adjustment", "expired"],
      required: true
    },

    quantity: {
      type: Number,
      required: true,
      min: 1
    },

    reason: {
      type: String,
      required: true,
      trim: true
    },

    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    transactionDate: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    collection: "inventoryTransactions"
  }
);

const InventoryTransaction = mongoose.model(
  "InventoryTransaction",
  inventoryTransactionSchema
);

export default InventoryTransaction;