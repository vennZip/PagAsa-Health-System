import Patient from "../models/Patient.js";

const checkPatientAccess = async (req, res, next) => {
  try {
    // Admin and staff access is controlled by role authorization
    if (["admin", "staff"].includes(req.user.role)) {
      return next();
    }

    // Patients may only access their own patient profile
    if (req.user.role !== "patient") {
      return res.status(403).json({
        success: false,
        message: "Access denied."
      });
    }

    // Find the patient's profile using their verified account ID
    const patient = await Patient.findOne({
      userId: req.user.id
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient profile not found."
      });
    }

    // Check the requested patient ID. Routes may use either :id or :patientId.
    const requestedPatientId = req.params.id || req.params.patientId;

    if (
      requestedPatientId &&
      patient._id.toString() !== requestedPatientId
    ) {
      return res.status(403).json({
        success: false,
        message: "You cannot access another patient's information."
      });
    }

    req.patient = patient;

    next();

  } catch (error) {
    console.error("Patient access error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to verify patient access."
    });
  }
};

export default checkPatientAccess;
