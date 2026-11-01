import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function ActivityLogs() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const token = await currentUser.getIdToken();
      const response = await fetch("http://localhost:5000/api/activity-logs", { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to load activity logs.");
      setLogs(data.data || []);
    } catch (err) { setError(err.message || "Unable to load activity logs."); } finally { setLoading(false); }
  }, [currentUser]);

  useEffect(() => { // eslint-disable-next-line react-hooks/set-state-in-effect
    loadLogs(); }, [loadLogs]);

  return <div><h1>Activity Logs</h1><button onClick={() => navigate("/dashboard")}>Back to Dashboard</button><button onClick={loadLogs} disabled={loading}>Refresh</button>{error && <p style={{ color: "red" }}>{error}</p>}{loading ? <p>Loading activity logs...</p> : <table border="1" cellPadding="10"><thead><tr><th>Date and Time</th><th>User</th><th>Module</th><th>Action</th><th>Description</th></tr></thead><tbody>{logs.length ? logs.map((log) => <tr key={log._id}><td>{new Date(log.createdAt).toLocaleString()}</td><td>{log.userId?.fullName || "Unknown user"}</td><td>{log.module}</td><td>{log.action}</td><td>{log.description}</td></tr>) : <tr><td colSpan="5">No activity logs found.</td></tr>}</tbody></table>}</div>;
}
export default ActivityLogs;
