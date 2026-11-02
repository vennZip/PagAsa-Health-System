import { apiUrl } from "../config/api";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { Pagination } from "../components/UI";

function QueueManagement() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [eligibleAppointments, setEligibleAppointments] = useState([]);
  const [queueTickets, setQueueTickets] = useState([]);
  const [ticketPanel, setTicketPanel] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [queuePage, setQueuePage] = useState(1); const [eligiblePage, setEligiblePage] = useState(1); const pageSize = 10;

  const fetchQueueData = useCallback(async (silent = false) => {
    if (!currentUser) return;

    try {
      if (!silent) setLoading(true);
      setError("");

      const token = await currentUser.getIdToken();
      const headers = { Authorization: `Bearer ${token}` };
      const [appointmentsResponse, queueResponse] = await Promise.all([
        fetch(apiUrl("/api/queue/eligible-appointments"), { cache: "no-store", headers }),
        fetch(apiUrl("/api/queue"), { cache: "no-store", headers })
      ]);

      const [appointmentsData, queueData] = await Promise.all([
        appointmentsResponse.json(),
        queueResponse.json()
      ]);

      if (!appointmentsResponse.ok) {
        throw new Error(appointmentsData.message || "Failed to load approved appointments.");
      }

      if (!queueResponse.ok) {
        throw new Error(queueData.message || "Failed to load today's queue.");
      }

      setEligibleAppointments(appointmentsData.data || []);
      setQueueTickets(queueData.data || []);
    } catch (err) {
      setError(err.message || "Unable to load queue information.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    // The data request updates state after its asynchronous API calls finish.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchQueueData();
    const interval = window.setInterval(() => fetchQueueData(true), 10000);
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") fetchQueueData(true);
    };
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [fetchQueueData]);

  const filteredAppointments = eligibleAppointments.filter((appointment) => {
    const name = appointment.patientId?.userId?.fullName || "";
    const patientNumber = appointment.patientId?.patientNumber || "";
    const searchValue = search.toLowerCase();

    return (
      name.toLowerCase().includes(searchValue) ||
      patientNumber.toLowerCase().includes(searchValue)
    );
  });

  const runQueueAction = async (url, method, body, successMessage) => {
    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      const token = await currentUser.getIdToken();
      const response = await fetch(apiUrl(`${url}`), {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: body ? JSON.stringify(body) : undefined
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Queue action failed.");
      }

      setSuccess(successMessage || data.message);
      await fetchQueueData();
      return true;
    } catch (err) {
      setError(err.message || "Unable to update the queue.");
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const handleIssueTicket = async () => {
    if (!ticketPanel) return;
    const completed = await runQueueAction(
      "/api/queue",
      "POST",
      { patientId: ticketPanel.patientId._id },
      "Queue ticket issued successfully."
    );
    if (completed) setTicketPanel(null);
  };

  const formatTime = (date) => {
    if (!date) return "Not yet called";
    return new Date(date).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit"
    });
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-PH", {
      timeZone: "Asia/Manila"
    });
  };

  return (
    <div>
      <h1>Queue Management</h1>
      <p>Issue and manage today&apos;s patient queue in first-in, first-out order.</p>

      <button onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
      <button onClick={fetchQueueData} disabled={loading || actionLoading}>
        {loading ? "Loading..." : "Refresh Queue"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}

      <hr />

      <h2>Today&apos;s Queue</h2>
      <button
        onClick={() => runQueueAction(
          "/api/queue/next/call",
          "PATCH",
          null,
          "Next patient called successfully."
        )}
        disabled={loading || actionLoading}
      >
        Call Next Patient
      </button>

      {loading ? (
        <p>Loading queue...</p>
      ) : queueTickets.length === 0 ? (
        <p>No tickets have been issued today.</p>
      ) : (
        <><table border="1" cellPadding="10">
          <thead>
            <tr>
              <th>Queue No.</th>
              <th>Patient</th>
              <th>Patient Number</th>
              <th>Status</th>
              <th>Called At</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {queueTickets.slice((queuePage - 1) * pageSize, queuePage * pageSize).map((ticket) => (
              <tr key={ticket._id}>
                <td>{ticket.queueNumber}</td>
                <td>{ticket.patientId?.userId?.fullName || "N/A"}</td>
                <td>{ticket.patientId?.patientNumber || "N/A"}</td>
                <td>{ticket.status}</td>
                <td>{formatTime(ticket.calledAt)}</td>
                <td>
                  {ticket.status === "called" && (
                    <>
                      <button
                        onClick={() => runQueueAction(
                          `/api/queue/${ticket._id}/status`,
                          "PATCH",
                          { status: "serving" },
                          "Patient is now being served."
                        )}
                        disabled={actionLoading}
                      >
                        Start Serving
                      </button>{" "}
                      <button
                        onClick={() => runQueueAction(
                          `/api/queue/${ticket._id}/status`,
                          "PATCH",
                          { status: "skipped" },
                          "Queue ticket skipped."
                        )}
                        disabled={actionLoading}
                      >
                        Skip
                      </button>
                    </>
                  )}

                  {ticket.status === "serving" && (
                    <>
                      <button
                        onClick={() => runQueueAction(
                          `/api/queue/${ticket._id}/status`,
                          "PATCH",
                          { status: "completed" },
                          "Queue ticket completed."
                        )}
                        disabled={actionLoading}
                      >
                        Complete
                      </button>{" "}
                      <button
                        onClick={() => runQueueAction(
                          `/api/queue/${ticket._id}/status`,
                          "PATCH",
                          { status: "skipped" },
                          "Queue ticket skipped."
                        )}
                        disabled={actionLoading}
                      >
                        Skip
                      </button>
                    </>
                  )}

                  {ticket.status === "waiting" && (
                    <span className="action-note">Waiting for call</span>
                  )}
                  {ticket.status === "completed" && (
                    <span className="action-note">Completed - no action needed</span>
                  )}
                  {ticket.status === "skipped" && (
                    <span className="action-note">Skipped - no action available</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table><Pagination page={queuePage} totalItems={queueTickets.length} pageSize={pageSize} onPageChange={setQueuePage} /></>
      )}

      <hr />

      <h2>Issue a Queue Ticket</h2>
      <p>Only patients with currently approved appointments and no ticket issued today are listed.</p>
      <input
        type="text"
        placeholder="Search by name or patient number..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      {!loading && (
        <><table border="1" cellPadding="10">
          <thead>
            <tr>
              <th>Patient Number</th>
              <th>Full Name</th>
              <th>Approved Service</th>
              <th>Appointment Date</th>
              <th>Appointment Time</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredAppointments.length > 0 ? (
              filteredAppointments.slice((eligiblePage - 1) * pageSize, eligiblePage * pageSize).map((appointment) => {
                const patient = appointment.patientId;
                return (
                  <tr key={appointment._id}>
                    <td>{patient?.patientNumber || "N/A"}</td>
                    <td>{patient?.userId?.fullName || "N/A"}</td>
                    <td>{appointment.serviceId?.serviceName || "N/A"}</td>
                    <td>{formatDate(appointment.appointmentDate)}</td>
                    <td>{appointment.appointmentTime}</td>
                    <td>
                      <button
                        onClick={() => setTicketPanel(appointment)}
                        disabled={actionLoading}
                      >
                        Review and Issue
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6">No approved appointments are currently eligible for a ticket.</td>
              </tr>
            )}
          </tbody>
        </table><Pagination page={eligiblePage} totalItems={filteredAppointments.length} pageSize={pageSize} onPageChange={setEligiblePage} /></>
      )}

      {ticketPanel && (
        <div className="modal-backdrop" role="presentation">
          <section className="decision-panel" role="dialog" aria-modal="true" aria-labelledby="issue-ticket-title">
            <h2 id="issue-ticket-title">Issue Queue Ticket</h2>
            <p>Review the approved appointment before issuing today&apos;s ticket.</p>
            <div className="review-list">
              <p><strong>Patient:</strong> {ticketPanel.patientId?.userId?.fullName || "N/A"}</p>
              <p><strong>Patient Number:</strong> {ticketPanel.patientId?.patientNumber || "N/A"}</p>
              <p><strong>Service:</strong> {ticketPanel.serviceId?.serviceName || "N/A"}</p>
              <p><strong>Appointment Date:</strong> {formatDate(ticketPanel.appointmentDate)}</p>
              <p><strong>Appointment Time:</strong> {ticketPanel.appointmentTime}</p>
            </div>
            {error && <p className="alert alert--error">{error}</p>}
            <div className="modal-actions">
              <button type="button" onClick={() => setTicketPanel(null)} disabled={actionLoading}>Cancel</button>
              <button type="button" onClick={handleIssueTicket} disabled={actionLoading}>
                {actionLoading ? "Issuing..." : "Confirm and Issue Ticket"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default QueueManagement;
