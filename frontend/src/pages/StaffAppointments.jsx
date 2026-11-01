import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/useAuth";
import { useNavigate } from "react-router-dom";

function StaffAppointments() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Retrieve all appointments from the backend
  const fetchAppointments = useCallback(async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError("");

      const token = await currentUser.getIdToken();

      const response = await fetch(
        "http://localhost:5000/api/appointments",
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
    fetchAppointments();
  }, [fetchAppointments]);

  // Approve or reject an appointment
  const handleUpdateStatus = async (appointmentId, status) => {
    const remarks = window.prompt(
      `Enter remarks for this ${status} appointment:`
    );

    if (remarks === null) return;

    try {
      setActionLoading(true);
      setError("");

      const token = await currentUser.getIdToken();

      const response = await fetch(
        `http://localhost:5000/api/appointments/${appointmentId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            status,
            remarks
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update appointment."
        );
      }

      alert(`Appointment ${status} successfully!`);

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
  const handleCompleteAppointment = async (appointmentId) => {
    const confirmed = window.confirm(
      "Are you sure you want to mark this appointment as completed?"
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);
      setError("");

      const token = await currentUser.getIdToken();

      const response = await fetch(
        `http://localhost:5000/api/appointments/${appointmentId}/complete`,
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

      alert("Appointment marked as completed!");

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
                  handleUpdateStatus(appointment._id, "approved")
                }
                disabled={actionLoading}
              >
                Approve
              </button>

              {" "}

              <button
                onClick={() =>
                  handleUpdateStatus(appointment._id, "rejected")
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
                handleCompleteAppointment(appointment._id)
              }
              disabled={actionLoading}
            >
              Mark as Completed
            </button>
          )}

          <hr />
        </section>
      ))}

      <button onClick={() => navigate("/dashboard")}>
        Back to Dashboard
      </button>
    </div>
  );
}

export default StaffAppointments;