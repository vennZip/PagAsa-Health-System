import { apiUrl } from "../config/api";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/useAuth";
import { useNavigate } from "react-router-dom";

function StaffAppointments() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [decision, setDecision] = useState(null);
  const [completion, setCompletion] = useState(null);
  const [remarks, setRemarks] = useState("");

  // Retrieve all appointments from the backend
  const fetchAppointments = useCallback(async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError("");

      const token = await currentUser.getIdToken();

      const response = await fetch(
        apiUrl("/api/appointments"),
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to retrieve appointments."
        );
      }

      setAppointments(data.data);

    } catch (err) {
      console.error("Staff appointments error:", err);
      setError(
        err.message || "Unable to load appointments."
      );
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Load appointments when the page opens
  useEffect(() => {
    // The request updates state only after its asynchronous work completes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAppointments();
  }, [fetchAppointments]);

  // Approve or reject an appointment
  const openDecisionPanel = (appointment, status) => {
    setError("");
    setSuccess("");
    setRemarks("");
    setDecision({ appointment, status });
  };

  const closeDecisionPanel = () => {
    if (actionLoading) return;
    setDecision(null);
    setRemarks("");
  };

  const handleUpdateStatus = async (event) => {
    event.preventDefault();

    if (!decision) return;

    const { appointment, status } = decision;

    if (status === "rejected" && !remarks.trim()) {
      setError("Please provide a reason when rejecting an appointment.");
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      const token = await currentUser.getIdToken();

      const response = await fetch(
        apiUrl(`/api/appointments/${appointment._id}/status`),
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            status,
            remarks: remarks.trim()
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update appointment."
        );
      }

      setSuccess(`Appointment ${status} successfully.`);
      setDecision(null);
      setRemarks("");

      await fetchAppointments();

    } catch (err) {
      console.error("Update appointment error:", err);
      setError(
        err.message || "Unable to update appointment."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Mark an approved appointment as completed
  const handleCompleteAppointment = async () => {
    if (!completion) return;

    try {
      setActionLoading(true);
      setError("");

      const token = await currentUser.getIdToken();

      const response = await fetch(
        apiUrl(`/api/appointments/${completion._id}/complete`),
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to complete appointment."
        );
      }

      setSuccess("Appointment marked as completed successfully.");
      setCompletion(null);

      await fetchAppointments();

    } catch (err) {
      console.error("Complete appointment error:", err);
      setError(
        err.message || "Unable to complete appointment."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Format appointment date
  const formatDate = (date) => {
    if (!date) return "Not available";

    return new Date(date).toLocaleDateString();
  };

  return (
    <div>
      <h1>Staff Appointment Management</h1>

      <p>
        View and manage all patient appointment requests.
      </p>

      <hr />

      <h2>All Appointment Requests</h2>

      {loading && <p>Loading appointments...</p>}

      {error && (
        <p style={{ color: "red" }}>{error}</p>
      )}

      {success && <p className="alert alert--success">{success}</p>}

      {!loading && !error && appointments.length === 0 && (
        <p>No appointment requests found.</p>
      )}

      {!loading && appointments.map((appointment) => (
        <section key={appointment._id}>
          <h3>
            {appointment.serviceId?.serviceName || "Unknown Service"}
          </h3>

          <p>
            <strong>Patient:</strong>{" "}
            {appointment.patientId?.userId?.fullName || "Unknown"}
          </p>

          <p>
            <strong>Patient Number:</strong>{" "}
            {appointment.patientId?.patientNumber || "Not available"}
          </p>

          <p>
            <strong>Contact Number:</strong>{" "}
            {appointment.patientId?.contactNumber || "Not available"}
          </p>

          <p>
            <strong>Appointment Date:</strong>{" "}
            {formatDate(appointment.appointmentDate)}
          </p>

          <p>
            <strong>Appointment Time:</strong>{" "}
            {appointment.appointmentTime}
          </p>

          <p>
            <strong>Status:</strong>{" "}
            {appointment.status.toUpperCase()}
          </p>

          {appointment.remarks && (
            <p>
              <strong>Remarks:</strong>{" "}
              {appointment.remarks}
            </p>
          )}

          {/* Staff/Admin appointment actions */}

          {appointment.status === "pending" && (
            <div>
              <button
                onClick={() =>
                  openDecisionPanel(appointment, "approved")
                }
                disabled={actionLoading}
              >
                Approve
              </button>

              {" "}

              <button
                onClick={() =>
                  openDecisionPanel(appointment, "rejected")
                }
                disabled={actionLoading}
              >
                Reject
              </button>
            </div>
          )}

          {appointment.status === "approved" && (
            <button
              onClick={() =>
                {
                  setError("");
                  setSuccess("");
                  setCompletion(appointment);
                }
              }
              disabled={actionLoading}
            >
              Mark as Completed
            </button>
          )}

          <hr />
        </section>
      ))}

      {decision && (
        <div className="modal-backdrop" role="presentation">
          <section
            className="decision-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="appointment-decision-title"
          >
            <h2 id="appointment-decision-title">
              {decision.status === "approved" ? "Approve" : "Reject"} Appointment
            </h2>
            <p>
              <strong>Patient:</strong>{" "}
              {decision.appointment.patientId?.userId?.fullName || "Unknown"}
            </p>
            <p>
              <strong>Service:</strong>{" "}
              {decision.appointment.serviceId?.serviceName || "Unknown Service"}
            </p>
            <p>
              Add a message the patient can read with this decision.
              {decision.status === "rejected" && " A rejection reason is required."}
            </p>

            {error && <p className="alert alert--error">{error}</p>}

            <form onSubmit={handleUpdateStatus}>
              <div>
                <label htmlFor="appointment-remarks">Remarks</label>
                <textarea
                  id="appointment-remarks"
                  value={remarks}
                  onChange={(event) => setRemarks(event.target.value)}
                  placeholder={
                    decision.status === "approved"
                      ? "e.g., Please arrive 15 minutes early."
                      : "Explain why this request cannot be approved."
                  }
                  required={decision.status === "rejected"}
                  autoFocus
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={closeDecisionPanel} disabled={actionLoading}>
                  Cancel
                </button>
                <button type="submit" disabled={actionLoading}>
                  {actionLoading
                    ? "Saving..."
                    : `Confirm ${decision.status === "approved" ? "Approval" : "Rejection"}`}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {completion && (
        <div className="modal-backdrop" role="presentation">
          <section
            className="decision-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="complete-appointment-title"
          >
            <h2 id="complete-appointment-title">Complete Appointment</h2>
            <p>Confirm that this patient&apos;s appointment has finished.</p>
            <div className="review-list">
              <p><strong>Patient:</strong> {completion.patientId?.userId?.fullName || "Unknown"}</p>
              <p><strong>Service:</strong> {completion.serviceId?.serviceName || "Unknown Service"}</p>
              <p><strong>Date:</strong> {formatDate(completion.appointmentDate)}</p>
              <p><strong>Time:</strong> {completion.appointmentTime}</p>
            </div>
            {error && <p className="alert alert--error">{error}</p>}
            <div className="modal-actions">
              <button type="button" onClick={() => setCompletion(null)} disabled={actionLoading}>
                Cancel
              </button>
              <button type="button" onClick={handleCompleteAppointment} disabled={actionLoading}>
                {actionLoading ? "Completing..." : "OK - Mark as Completed"}
              </button>
            </div>
          </section>
        </div>
      )}

      <button onClick={() => navigate("/dashboard")}>
        Back to Dashboard
      </button>
    </div>
  );
}

export default StaffAppointments;
