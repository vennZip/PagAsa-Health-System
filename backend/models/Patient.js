import mongoose from "mongoose";

const patientSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },

    patientNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    birthDate: {
      type: Date,
      required: true
    },

    sex: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true
    },

    address: {
      type: String,
      required: true,
      trim: true
    },

    contactNumber: {
      type: String,
      required: true,
      trim: true,
      match: [/^09\d{9}$/, "Contact number must be a Philippine mobile number beginning with 09."]
    },

    emergencyContact: {
      name: {
        type: String,
        trim: true
      },
      relationship: {
        type: String,
        trim: true
      },
      contactNumber: {
        type: String,
        trim: true,
        validate: {
          validator: (value) => !value || /^09\d{9}$/.test(value),
          message: "Emergency contact number must be a Philippine mobile number beginning with 09."
        }
      }
    }
  },
  {
    timestamps: true,
    collection: "patients"
  }
);

const Patient = mongoose.model("Patient", patientSchema);

export default Patient;
