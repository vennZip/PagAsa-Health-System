import { apiUrl } from "../config/api";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/useAuth";
import { useNavigate } from "react-router-dom";

function Appointments() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [appointments, setAppointments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);

  const [error, setError] = useState("");
  const [appointmentError, setAppointmentError] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    serviceId: "",
    appointmentDate: "",
    appointmentTime: ""
  });

  const activeAppointment = appointments.find(
    (appointment) => ["pending", "approved"].includes(appointment.status)
  );

  // Load available services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch(
          apiUrl("/api/services")
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load services.");
        }

        setServices(data.data);
      } catch (err) {
        setError(err.message || "Unable to load services.");
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  // Load the patient's appointments
  const fetchAppointments = useCallback(async () => {
    try {
      setAppointmentError("");

      const token = await currentUser.getIdToken();

      const response = await fetch(
        apiUrl("/api/appointments/my"),
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load appointments."
        );
      }

      setAppointments(data.data);
    } catch (err) {
      console.error("Appointments error:", err);
      setAppointmentError(
        err.message || "Unable to load appointments."
      );
    } finally {
      setAppointmentsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return undefined;

    // The request updates state only after its asynchronous work completes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAppointments();
    const interval = window.setInterval(fetchAppointments, 10000);
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") fetchAppointments();
    };
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [currentUser, fetchAppointments]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Submit appointment request
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    try {
      setSaving(true);

      const token = await currentUser.getIdToken();

      const response = await fetch(
        apiUrl("/api/appointments"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to submit appointment."
        );
      }

      setSuccess("Appointment request submitted successfully!");

      setFormData({
        serviceId: "",
        appointmentDate: "",
        appointmentTime: ""
      });

      await fetchAppointments();

    } catch (err) {
      console.error("Appointment error:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  // Cancel a pending appointment
  const handleCancel = async (appointmentId) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this appointment?"
    );

    if (!confirmed) return;

    try {
      const token = await currentUser.getIdToken();

      const response = await fetch(
        apiUrl(`/api/appointments/${appointmentId}/cancel`),
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
          data.message || "Failed to cancel appointment."
        );
      }

      alert("Appointment cancelled successfully!");

      await fetchAppointments();

    } catch (err) {
      console.error("Cancel appointment error:", err);
      alert(err.message || "Unable to cancel appointment.");
    }
  };

  const formatDate = (date) => {
    if (!date) return "Not available";

    return new Date(date).toLocaleDateString();
  };

  return (
    <div>
      <h1>My Appointments</h1>
      <p>Request and view your health center appointments.</p>

      <hr />

      <h2>Available Health Services</h2>

      {loading && <p>Loading available services...</p>}

      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && services.length === 0 && (
        <p>No available services at the moment.</p>
      )}

      {!loading && services.map((service) => (
        <section key={service._id}>
          <h3>{service.serviceName}</h3>
          <p>{service.description}</p>
          <p>Category: {service.category}</p>
          <p>Status: {service.availability}</p>
        </section>
      ))}

      <hr />

      <h2>Request an Appointment</h2>

      {success && <p style={{ color: "green" }}>{success}</p>}

      {activeAppointment && (
        <p className="alert alert--error">
          You already have a {activeAppointment.status} appointment. You can
          request another after it is completed, or cancel it while it is pending.
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <label>Select Health Service</label>
        <br />

        <select
          name="serviceId"
          value={formData.serviceId}
          onChange={handleChange}
          required
        >
          <option value="">Choose a service</option>

          {services.map((service) => (
            <option key={service._id} value={service._id}>
              {service.serviceName}
            </option>
          ))}
        </select>

        <br /><br />

        <label>Appointment Date</label>
        <br />

        <input
          type="date"
          name="appointmentDate"
          value={formData.appointmentDate}
          onChange={handleChange}
          min={new Date().toLocaleDateString("en-CA")}
          required
        />

        <br /><br />

        <label>Preferred Appointment Time</label>
        <br />

        <input
          type="time"
          name="appointmentTime"
          value={formData.appointmentTime}
          onChange={handleChange}
          required
        />

        <br /><br />

        <button
          type="submit"
          disabled={
            saving ||
            loading ||
            appointmentsLoading ||
            services.length === 0 ||
            Boolean(activeAppointment)
          }
        >
          {saving ? "Submitting..." : "Submit Appointment Request"}
        </button>
      </form>

      <hr />

      <h2>My Appointment History</h2>

      <button type="button" onClick={fetchAppointments} disabled={appointmentsLoading}>
        Refresh Appointment Status
      </button>

      {appointmentsLoading && (
        <p>Loading your appointments...</p>
      )}

      {appointmentError && (
        <p style={{ color: "red" }}>{appointmentError}</p>
      )}

      {!appointmentsLoading &&
        !appointmentError &&
        appointments.length === 0 && (
          <p>You have no appointment requests yet.</p>
        )}

      {!appointmentsLoading && appointments.map((appointment) => (
        <section key={appointment._id}>
          <h3>
            {appointment.serviceId?.serviceName || "Unknown Service"}
          </h3>

          <p>
            <strong>Date:</strong>{" "}
            {formatDate(appointment.appointmentDate)}
          </p>

          <p>
            <strong>Time:</strong> {appointment.appointmentTime}
          </p>

          <p>
            <strong>Status:</strong>{" "}
            {appointment.status.toUpperCase()}
          </p>

          {appointment.remarks && (
            <p>
              <strong>Remarks:</strong> {appointment.remarks}
            </p>
          )}

          
{appointment.status === "pending" && (
  <button
    onClick={() => handleCancel(appointment._id)}
  >
    Cancel Appointment
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

export default Appointments;
