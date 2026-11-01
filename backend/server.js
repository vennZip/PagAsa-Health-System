import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import "./config/firebase.js";
import patientRoutes from "./routes/patientRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import serviceRoutes from "./routes/serviceRoutes.js";
import healthRecordRoutes from "./routes/healthRecordRoutes.js";
import queueRoutes from "./routes/queueRoutes.js";
import medicineRoutes from "./routes/medicineRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import activityLogRoutes from "./routes/activityLogRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";

dotenv.config();

const app = express();

// Middleware
const allowedOrigins = [
  "http://localhost:5173",
  ...((process.env.FRONTEND_URL || "").split(",").map((origin) => origin.trim()).filter(Boolean))
];

app.use(cors({
  origin(origin, callback) {
    // Requests without an Origin header include server-to-server and local API tools.
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Origin is not allowed by CORS."));
  }
}));
app.use(express.json({ limit: "100kb" }));

app.use("/api/patients", patientRoutes);
app.use("/api/users", userRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/health-records", healthRecordRoutes);
app.use("/api/queue", queueRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/activity-logs", activityLogRoutes);
app.use("/api/reports", reportRoutes);

// Test route
app.get("/", (req, res) => {
  res.json({
    message: "Barangay Pag-Asa Health Center API is running!"
  });
});

// Start server
const startServer = async () => {
  await connectDB();

  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
