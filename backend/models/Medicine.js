import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema(
  {
    medicineName: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    description: {
      type: String,
      trim: true,
      default: ""
    },

    unit: {
      type: String,
      required: true,
      trim: true
    },

    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },

    minimumStock: {
      type: Number,
      required: true,
      min: 0,
      default: 10
    },

    expirationDate: {
      type: Date,
      default: null
    },

    status: {
      type: String,
      enum: ["available", "low-stock", "out-of-stock"],
      default: "available"
    }
  },
  {
    timestamps: true,
    collection: "medicines"
  }
);

const Medicine = mongoose.model("Medicine", medicineSchema);

export default Medicine;
