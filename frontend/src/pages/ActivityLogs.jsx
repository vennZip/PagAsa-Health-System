import { apiUrl } from "../config/api";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { exportDateStamp, exportToExcel } from "../utils/exportExcel";
import { Pagination } from "../components/UI";

function ActivityLogs() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(1); const pageSize = 15;

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const token = await currentUser.getIdToken();
      const response = await fetch(apiUrl("/api/activity-logs"), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to load activity logs.");
      setLogs(data.data || []);
    } catch (err) {
      setError(err.message || "Unable to load activity logs.");
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadLogs();
  }, [loadLogs]);

  const exportLogs = async () => {
    try {
      setExporting(true);
      setError("");
      await exportToExcel({
        filename: `pagasa-activity-logs-${exportDateStamp()}.xlsx`,
        title: "SYSTEM ACTIVITY LOG REPORT",
        subtitle: "Formal record of administrative and operational system activity",
        generatedBy: userProfile?.fullName || currentUser.displayName,
        summary: [
          { label: "Report type", value: "Activity audit" },
          { label: "Coverage", value: "All available records" }
        ],
        columns: [
          { label: "Date and Time", width: 24, value: (log) => new Date(log.createdAt).toLocaleString("en-PH", { timeZone: "Asia/Manila" }) },
          { label: "User", width: 24, value: (log) => log.userId?.fullName || "Unknown user" },
          { label: "Module", width: 18, value: (log) => log.module },
          { label: "Action", width: 25, value: (log) => log.action },
          { label: "Description", width: 50, value: (log) => log.description }
        ],
        rows: logs
      });
    } catch (exportError) {
      setError(exportError.message || "Unable to create the Excel report.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <h1>Activity Logs</h1>
      <button onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
      <button onClick={loadLogs} disabled={loading}>Refresh</button>
      <button onClick={exportLogs} disabled={loading || exporting || logs.length === 0}>
        {exporting ? "Preparing Excel Report..." : "Export Excel Report"}
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {loading ? (
        <p>Loading activity logs...</p>
      ) : (
        <><table border="1" cellPadding="10">
          <thead><tr><th>Date and Time</th><th>User</th><th>Module</th><th>Action</th><th>Description</th></tr></thead>
          <tbody>{logs.length ? logs.slice((page - 1) * pageSize, page * pageSize).map((log) => <tr key={log._id}><td>{new Date(log.createdAt).toLocaleString()}</td><td>{log.userId?.fullName || "Unknown user"}</td><td>{log.module}</td><td>{log.action}</td><td>{log.description}</td></tr>) : <tr><td colSpan="5">No activity logs found.</td></tr>}</tbody>
        </table><Pagination page={page} totalItems={logs.length} pageSize={pageSize} onPageChange={setPage} /></>
      )}
    </div>
  );
}

export default ActivityLogs;
