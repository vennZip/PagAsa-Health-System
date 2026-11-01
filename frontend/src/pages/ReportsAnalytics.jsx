import { apiUrl } from "../config/api";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { Alert, PageHeader, StatCard, StatusBadge } from "../components/UI";

function ReportsAnalytics() {
  const { currentUser } = useAuth(); const navigate = useNavigate();
  const [report, setReport] = useState(null); const [error, setError] = useState("");
  const loadReport = useCallback(async () => { try { setError(""); const token = await currentUser.getIdToken(); const response = await fetch(apiUrl("/api/reports/dashboard"), { headers: { Authorization: `Bearer ${token}` } }); const data = await response.json(); if (!response.ok) throw new Error(data.message || "Failed to load analytics."); setReport(data.data); } catch (err) { setError(err.message || "Unable to load analytics."); } }, [currentUser]);
  useEffect(() => { loadReport(); }, [loadReport]);
  const statusPanel = (title, items) => <section><h2>{title}</h2>{items?.length ? <div className="status-list">{items.map((item) => <div key={item._id || "unknown"}><StatusBadge status={item._id || "unknown"} /><strong>{item.count}</strong></div>)}</div> : <p>No data available yet.</p>}</section>;
  return <div><PageHeader title="Reports and Analytics" description="A live summary based on current system records." actions={<><button onClick={() => navigate("/dashboard")}>Back to Dashboard</button><button onClick={loadReport}>Refresh Report</button></>} />{error && <Alert>{error}</Alert>}{report && <><div className="stat-grid"><StatCard icon="users" label="Total Users" value={report.totals.users} tone="blue" /><StatCard icon="users" label="Total Patients" value={report.totals.patients} tone="green" /><StatCard icon="calendar" label="Appointments" value={report.totals.appointments} tone="orange" /><StatCard icon="inventory" label="Low / Out of Stock" value={report.totals.lowStock} tone="red" /></div><div className="dashboard-grid">{statusPanel("Appointment Status Breakdown", report.appointmentStatuses)}{statusPanel("Queue Status Breakdown", report.queueStatuses)}</div></>}</div>;
}
export default ReportsAnalytics;
