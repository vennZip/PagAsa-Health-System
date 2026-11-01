import { apiUrl } from "../config/api";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { Alert, PageHeader, StatCard } from "../components/UI";

const APPOINTMENT_STATUSES = [
  "pending",
  "approved",
  "completed",
  "rejected",
  "cancelled"
];

const QUEUE_STATUSES = [
  "waiting",
  "called",
  "serving",
  "completed",
  "skipped"
];

const chartColors = {
  pending: "#d97706",
  approved: "#1677e8",
  completed: "#0d9b63",
  rejected: "#d92d20",
  cancelled: "#64748b",
  waiting: "#d97706",
  called: "#1677e8",
  serving: "#7c3aed",
  skipped: "#64748b"
};

function StatusChart({ title, statuses, data }) {
  const counts = new Map(
    (data || []).map((item) => [item._id || "unknown", item.count])
  );
  const values = statuses.map((status) => ({
    status,
    count: counts.get(status) || 0
  }));
  const maximum = Math.max(...values.map((item) => item.count), 1);

  return (
    <section className="analytics-chart">
      <h2>{title}</h2>
      <div className="chart-bars">
        {values.map(({ status, count }) => (
          <div className="chart-row" key={status}>
            <span className="chart-label">{status}</span>
            <div className="chart-track">
              <div
                className="chart-fill"
                style={{
                  width: `${(count / maximum) * 100}%`,
                  backgroundColor: chartColors[status]
                }}
              />
            </div>
            <strong>{count}</strong>
          </div>
        ))}
      </div>
      <p className="chart-caption">Live totals grouped by current status.</p>
    </section>
  );
}

function ReportsAnalytics() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadReport = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const token = await currentUser.getIdToken();
      const response = await fetch(apiUrl("/api/reports/dashboard"), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load analytics.");
      }

      setReport(data.data);
    } catch (err) {
      setError(err.message || "Unable to load analytics.");
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    // The request updates state only after its asynchronous work completes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadReport();
  }, [loadReport]);

  return (
    <div>
      <PageHeader
        title="Reports and Analytics"
        description="Live operational charts based on current health center records."
        actions={(
          <>
            <button onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
            <button onClick={loadReport} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh Report"}
            </button>
          </>
        )}
      />

      {error && <Alert>{error}</Alert>}
      {loading && !report && <p>Loading analytics...</p>}

      {report && (
        <>
          <div className="stat-grid">
            <StatCard icon="users" label="Total Users" value={report.totals.users} tone="blue" />
            <StatCard icon="users" label="Total Patients" value={report.totals.patients} tone="green" />
            <StatCard icon="calendar" label="Appointments" value={report.totals.appointments} tone="orange" />
            <StatCard icon="queue" label="Queue Tickets" value={report.totals.queueTickets} tone="blue" />
            <StatCard icon="inventory" label="Low / Out of Stock" value={report.totals.lowStock} tone="red" />
          </div>

          <div className="dashboard-grid analytics-grid">
            <StatusChart
              title="Appointment Statuses"
              statuses={APPOINTMENT_STATUSES}
              data={report.appointmentStatuses}
            />
            <StatusChart
              title="Queue Statuses"
              statuses={QUEUE_STATUSES}
              data={report.queueStatuses}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default ReportsAnalytics;
