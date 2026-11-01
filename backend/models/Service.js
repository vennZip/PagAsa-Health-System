import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    serviceName: {
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

    category: {
      type: String,
      required: true,
      enum: [
        "Consultation",
        "Maternal Care",
        "Child Care",
        "Immunization",
        "Health Education",
        "Other"
      ]
    },

    availability: {
      type: String,
      enum: ["available", "unavailable"],
      default: "available"
    },

    requirements: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true,
    collection: "services"
  }
);

const Service = mongoose.model("Service", serviceSchema);

export default Service;