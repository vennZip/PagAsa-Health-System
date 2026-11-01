import mongoose from "mongoose";

const queueTicketSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true
    },

    queueNumber: {
      type: Number,
      required: true,
      min: 1
    },

    queueDate: {
      type: Date,
      required: true,
      default: Date.now
    },

    status: {
      type: String,
      enum: [
        "waiting",
        "called",
        "serving",
        "completed",
        "skipped"
      ],
      default: "waiting"
    },

    priority: {
      type: String,
      enum: ["normal", "priority"],
      default: "normal"
    },

    isActive: {
      type: Boolean,
      default: true
    },

    isCurrent: {
      type: Boolean,
      default: false
    },

    calledAt: {
      type: Date,
      default: null
    },

    completedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    collection: "queueTickets"
  }
);

// queueDate is stored as midnight UTC for the corresponding Philippine calendar day.
// Queue numbers must be unique within that calendar day.
queueTicketSchema.index(
  { queueDate: 1, queueNumber: 1 },
  { unique: true }
);

// A patient can hold only one active ticket per day.
queueTicketSchema.index(
  { queueDate: 1, patientId: 1 },
  {
    unique: true,
    partialFilterExpression: { isActive: true }
  }
);

// Only one patient can be called or served at a time.
queueTicketSchema.index(
  { queueDate: 1, isCurrent: 1 },
  {
    unique: true,
    partialFilterExpression: { isCurrent: true }
  }
);

const QueueTicket = mongoose.model(
  "QueueTicket",
  queueTicketSchema
);

export default QueueTicket;
