import { apiUrl } from "../config/api";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/useAuth";
import { useNavigate } from "react-router-dom";
import { Pagination } from "../components/UI";
import ConfirmDialog from "../components/ConfirmDialog";

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
  const [availability, setAvailability] = useState(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [servicePage, setServicePage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const pageSize = 6;

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
    if (e.target.name === "appointmentDate") setAvailability(null);
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  useEffect(() => {
    if (!formData.appointmentDate || !currentUser) return undefined;
    let active = true;
    const loadAvailability = async () => {
      try {
        setAvailabilityLoading(true);
        const token = await currentUser.getIdToken();
        const response = await fetch(apiUrl(`/api/schedule/availability?date=${formData.appointmentDate}`), { cache: "no-store", headers: { Authorization: `Bearer ${token}` } });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        if (active) { setAvailability(data.data); setFormData((current) => ({ ...current, appointmentTime: "" })); }
      } catch (err) { if (active) { setAvailability(null); setError(err.message || "Unable to load available times."); } }
      finally { if (active) setAvailabilityLoading(false); }
    };
    loadAvailability();
    return () => { active = false; };
  }, [formData.appointmentDate, currentUser]);

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
  const handleCancel = async () => {
    if (!cancelTarget) return;
    try {
      setCancelLoading(true);
      const token = await currentUser.getIdToken();

      const response = await fetch(
        apiUrl(`/api/appointments/${cancelTarget._id}/cancel`),
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

      setSuccess("Appointment cancelled successfully!");
      setCancelTarget(null);
      await fetchAppointments();

    } catch (err) {
      console.error("Cancel appointment error:", err);
      setAppointmentError(err.message || "Unable to cancel appointment.");
    } finally {
      setCancelLoading(false);
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

      {!loading && services.slice((servicePage - 1) * pageSize, servicePage * pageSize).map((service) => (
        <section key={service._id}>
          <h3>{service.serviceName}</h3>
          <p>{service.description}</p>
          <p>Category: {service.category}</p>
          <p>Status: {service.availability}</p>
        </section>
      ))}
      <Pagination page={servicePage} totalItems={services.length} pageSize={pageSize} onPageChange={setServicePage} />

      <hr />

      <h2>Request an Appointment</h2>

      {success && <p className="alert alert--success">{success}</p>}

      {activeAppointment ? (
        <section className="active-appointment-panel">
          <h3>Current Appointment: {activeAppointment.status.toUpperCase()}</h3>
          <p>
            <strong>Service:</strong>{" "}
            {activeAppointment.serviceId?.serviceName || "Health center service"}
          </p>
          <p><strong>Date:</strong> {formatDate(activeAppointment.appointmentDate)}</p>
          <p><strong>Time:</strong> {activeAppointment.appointmentTime}</p>
          <p className="alert alert--info">
            A new request becomes available after this appointment is completed.
            {activeAppointment.status === "pending" && " You may also cancel this pending request below."}
          </p>
        </section>
      ) : (
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

        <label>Available 30-Minute Appointment Time</label>
        <br />

        <select
          name="appointmentTime"
          value={formData.appointmentTime}
          onChange={handleChange}
          disabled={availabilityLoading || !availability?.isOpen}
          required
        ><option value="">{availabilityLoading ? "Checking available times..." : "Choose an available time"}</option>{availability?.slots.filter((slot) => slot.available).map((slot) => <option key={slot.time} value={slot.time}>{slot.time}</option>)}</select>
        {formData.appointmentDate && availability && !availability.isOpen && <p className="alert alert--error">The clinic is closed on this date. Please choose another day.</p>}
        {availability?.isOpen && !availability.slots.some((slot) => slot.available) && <p className="alert alert--error">This date is fully booked. Please choose another day.</p>}

        <br /><br />

        <button
          type="submit"
          disabled={
            saving ||
            loading ||
            appointmentsLoading ||
            services.length === 0
            || !availability?.isOpen
            || !formData.appointmentTime
          }
        >
          {saving ? "Submitting..." : "Submit Appointment Request"}
        </button>
        </form>
      )}

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

      {!appointmentsLoading && appointments.slice((historyPage - 1) * pageSize, historyPage * pageSize).map((appointment) => (
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
    onClick={() => setCancelTarget(appointment)}
  >
    Cancel Appointment
  </button>
)}


          <hr />
        </section>
      ))}
      <Pagination page={historyPage} totalItems={appointments.length} pageSize={pageSize} onPageChange={setHistoryPage} />

      <ConfirmDialog open={Boolean(cancelTarget)} title="Cancel Appointment" confirmLabel="Yes, Cancel Appointment" danger busy={cancelLoading} onCancel={() => setCancelTarget(null)} onConfirm={handleCancel}><p>Are you sure you want to cancel this pending appointment?</p><div className="review-list"><p><strong>Service:</strong> {cancelTarget?.serviceId?.serviceName || "Health center service"}</p><p><strong>Date:</strong> {formatDate(cancelTarget?.appointmentDate)}</p><p><strong>Time:</strong> {cancelTarget?.appointmentTime}</p></div></ConfirmDialog>

      <button onClick={() => navigate("/dashboard")}>
        Back to Dashboard
      </button>
    </div>
  );
}

export default Appointments;
