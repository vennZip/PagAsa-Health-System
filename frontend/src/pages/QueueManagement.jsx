import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function QueueManagement() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [queueTickets, setQueueTickets] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchQueueData = useCallback(async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError("");

      const token = await currentUser.getIdToken();
      const headers = { Authorization: `Bearer ${token}` };
      const [patientsResponse, queueResponse] = await Promise.all([
        fetch("http://localhost:5000/api/patients", { headers }),
        fetch("http://localhost:5000/api/queue", { headers })
      ]);

      const [patientsData, queueData] = await Promise.all([
        patientsResponse.json(),
        queueResponse.json()
      ]);

      if (!patientsResponse.ok) {
        throw new Error(patientsData.message || "Failed to load patients.");
      }

      if (!queueResponse.ok) {
        throw new Error(queueData.message || "Failed to load today's queue.");
      }

      setPatients(patientsData.data || []);
      setQueueTickets(queueData.data || []);
    } catch (err) {
      setError(err.message || "Unable to load queue information.");
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    // The data request updates state after its asynchronous API calls finish.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchQueueData();
  }, [fetchQueueData]);

  const activePatientIds = useMemo(
    () => new Set(
      queueTickets
        .filter((ticket) => ticket.isActive)
        .map((ticket) => ticket.patientId?._id || ticket.patientId)
    ),
    [queueTickets]
  );

  const filteredPatients = patients.filter((patient) => {
    const name = patient.userId?.fullName || "";
    const patientNumber = patient.patientNumber || "";
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
      const response = await fetch(`http://localhost:5000${url}`, {
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
    } catch (err) {
      setError(err.message || "Unable to update the queue.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleIssueTicket = (patient) => {
    const patientName = patient.userId?.fullName || "this patient";
    const confirmed = window.confirm(`Issue a queue ticket to ${patientName}?`);

    if (confirmed) {
      runQueueAction(
        "/api/queue",
        "POST",
        { patientId: patient._id },
        "Queue ticket issued successfully."
      );
    }
  };

  const formatTime = (date) => {
    if (!date) return "Not yet called";
    return new Date(date).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit"
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
        <table border="1" cellPadding="10">
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
            {queueTickets.map((ticket) => (
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

                  {["waiting", "completed", "skipped"].includes(ticket.status) && "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <hr />

      <h2>Issue a Queue Ticket</h2>
      <input
        type="text"
        placeholder="Search by name or patient number..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      {!loading && (
        <table border="1" cellPadding="10">
          <thead>
            <tr>
              <th>Patient Number</th>
              <th>Full Name</th>
              <th>Current Ticket</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredPatients.length > 0 ? (
              filteredPatients.map((patient) => {
                const hasActiveTicket = activePatientIds.has(patient._id);

                return (
                  <tr key={patient._id}>
                    <td>{patient.patientNumber}</td>
                    <td>{patient.userId?.fullName || "N/A"}</td>
                    <td>{hasActiveTicket ? "Active ticket issued" : "None"}</td>
                    <td>
                      <button
                        onClick={() => handleIssueTicket(patient)}
                        disabled={actionLoading || hasActiveTicket}
                      >
                        {hasActiveTicket ? "Ticket Active" : "Issue Ticket"}
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="4">No patients found.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default QueueManagement;
