import { apiUrl } from "../config/api";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function MyQueueStatus() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTicket = useCallback(async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError("");
      const token = await currentUser.getIdToken();
      const response = await fetch(apiUrl("/api/queue/my"), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load your queue status.");
      }

      setTicket(data.data);
    } catch (err) {
      setError(err.message || "Unable to load your queue status.");
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    // The request updates state after the asynchronous API call finishes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTicket();
  }, [fetchTicket]);

  return (
    <div>
      <h1>My Queue Status</h1>
      <button onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
      <button onClick={fetchTicket} disabled={loading}>
        {loading ? "Loading..." : "Refresh Status"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && !ticket && (
        <p>You do not have an active queue ticket today.</p>
      )}

      {!loading && !error && ticket && (
        <section>
          <h2>Queue Number: {ticket.queueNumber}</h2>
          <p><strong>Status:</strong> {ticket.status}</p>
          <p>
            Your ticket is active. Please wait for the health center staff to call you.
          </p>
        </section>
      )}
    </div>
  );
}

export default MyQueueStatus;
