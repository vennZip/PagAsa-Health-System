import mongoose from "mongoose";

const healthRecordSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true
    },

    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true
    },

    visitDate: {
      type: Date,
      required: true,
      default: Date.now
    },

    complaint: {
      type: String,
      required: true,
      trim: true
    },

    observations: {
      type: String,
      trim: true,
      default: ""
    },

    notes: {
      type: String,
      trim: true,
      default: ""
    }
  },
  {
    timestamps: true,
    collection: "healthRecords"
  }
);

const HealthRecord = mongoose.model(
  "HealthRecord",
  healthRecordSchema
);

export default HealthRecord;