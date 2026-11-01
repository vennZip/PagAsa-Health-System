import { apiUrl } from "../config/api";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { PageHeader, StatCard } from "../components/UI";

function AdminDashboard() {
  const { userProfile, currentUser } = useAuth();
  const navigate = useNavigate();
  const [totals, setTotals] = useState(null);
  const loadSummary = useCallback(async () => { try { const token = await currentUser.getIdToken(); const response = await fetch(apiUrl("/api/reports/dashboard"), { headers: { Authorization: `Bearer ${token}` } }); const data = await response.json(); if (response.ok) setTotals(data.data?.totals); } catch { /* Dashboard actions remain available if summary data is unavailable. */ } }, [currentUser]);
  useEffect(() => { loadSummary(); }, [loadSummary]);
  return <div><PageHeader title="Admin Dashboard" description={`Welcome back, ${userProfile?.fullName || "Administrator"}. Here is your health center overview.`} /><div className="stat-grid"><StatCard icon="users" label="Total Patients" value={totals?.patients ?? "â€”"} tone="blue" /><StatCard icon="calendar" label="Appointments" value={totals?.appointments ?? "â€”"} tone="orange" /><StatCard icon="queue" label="Queue Tickets" value={totals?.queueTickets ?? "â€”"} tone="green" /><StatCard icon="inventory" label="Low Stock Medicines" value={totals?.lowStock ?? "â€”"} tone="red" /></div><div className="dashboard-grid"><section><h2>Quick Actions</h2><p>Common administrative tasks for the health center.</p><div className="quick-actions"><button onClick={() => navigate("/admin/users")}>Manage Users</button><button onClick={() => navigate("/staff-appointments")}>Review Appointments</button><button onClick={() => navigate("/services-management")}>Manage Services</button><button onClick={() => navigate("/reports")}>View Reports</button></div></section><section><h2>Administration</h2><p>Keep daily health center operations organized.</p><div className="quick-actions"><button onClick={() => navigate("/queue-management")}>Manage Queue</button><button onClick={() => navigate("/inventory")}>Manage Inventory</button><button onClick={() => navigate("/activity-logs")}>Activity Logs</button><button onClick={() => navigate("/notifications")}>Notifications</button></div></section></div></div>;
}
export default AdminDashboard;
