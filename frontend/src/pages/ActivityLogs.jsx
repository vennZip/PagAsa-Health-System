import { apiUrl } from "../config/api";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { exportDateStamp, exportToExcel } from "../utils/exportExcel";
import { getDateRange, isDateWithinRange } from "../utils/reportFilters";
import { Alert, PageHeader, Pagination } from "../components/UI";

const pageSize = 15;

function ActivityLogs() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [datePreset, setDatePreset] = useState("today");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const token = await currentUser.getIdToken();
      const response = await fetch(apiUrl("/api/activity-logs"), { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to load activity logs.");
      setLogs(data.data || []);
    } catch (requestError) {
      setError(requestError.message || "Unable to load activity logs.");
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadLogs();
  }, [loadLogs]);

  const modules = useMemo(() => [...new Set(logs.map((log) => log.module).filter(Boolean))].sort(), [logs]);
  const range = useMemo(
    () => getDateRange(datePreset, customFrom, customTo),
    [customFrom, customTo, datePreset]
  );
  const invalidRange = Boolean(range.from && range.to && range.from > range.to);
  const exportRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return logs.filter((log) => {
      const matchesDate = isDateWithinRange(log.createdAt, range);
      const matchesModule = moduleFilter === "all" || log.module === moduleFilter;
      const searchable = `${log.userId?.fullName || ""} ${log.action || ""} ${log.description || ""}`.toLowerCase();
      return matchesDate && matchesModule && (!query || searchable.includes(query));
    });
  }, [logs, moduleFilter, range, search]);

  const exportLogs = async () => {
    try {
      setExporting(true);
      setError("");
      await exportToExcel({
        filename: `pagasa-activity-logs-${exportDateStamp()}.xlsx`,
        title: "SYSTEM ACTIVITY LOG REPORT",
        subtitle: `Administrative and operational activity — ${range.label}`,
        generatedBy: userProfile?.fullName || currentUser.displayName,
        summary: [
          { label: "Date coverage", value: range.label },
          { label: "Module", value: moduleFilter === "all" ? "All modules" : moduleFilter },
          { label: "Search", value: search.trim() || "No keyword filter" }
        ],
        columns: [
          { label: "Date and Time", width: 24, value: (log) => new Date(log.createdAt).toLocaleString("en-PH", { timeZone: "Asia/Manila" }) },
          { label: "User", width: 24, value: (log) => log.userId?.fullName || "Unknown user" },
          { label: "Module", width: 18, value: (log) => log.module },
          { label: "Action", width: 25, value: (log) => log.action },
          { label: "Description", width: 50, value: (log) => log.description }
        ],
        rows: exportRows
      });
    } catch (exportError) {
      setError(exportError.message || "Unable to create the Excel report.");
    } finally {
      setExporting(false);
    }
  };

  return <div>
    <PageHeader title="Activity Logs" description="Review system actions and export a formal audit report." actions={<><button onClick={() => navigate("/dashboard")}>Back to Dashboard</button><button onClick={loadLogs} disabled={loading}>Refresh</button></>} />
    {error && <Alert>{error}</Alert>}
    <section className="export-panel" aria-labelledby="activity-export-title">
      <div className="export-panel__heading"><div><span>Excel report</span><h2 id="activity-export-title">Choose activity to export</h2><p>Only records matching these options will be included.</p></div><strong>{invalidRange ? 0 : exportRows.length} records selected</strong></div>
      <div className="export-filter-grid">
        <div><label htmlFor="activity-date-range">Date range</label><select id="activity-date-range" value={datePreset} onChange={(event) => setDatePreset(event.target.value)}><option value="today">Today</option><option value="yesterday">Yesterday</option><option value="last7">Last 7 days</option><option value="last30">Last 30 days</option><option value="all">All dates</option><option value="custom">Custom range</option></select></div>
        {datePreset === "custom" && <><div><label htmlFor="activity-from">From</label><input id="activity-from" type="date" value={customFrom} onChange={(event) => setCustomFrom(event.target.value)} /></div><div><label htmlFor="activity-to">To</label><input id="activity-to" type="date" value={customTo} onChange={(event) => setCustomTo(event.target.value)} /></div></>}
        <div><label htmlFor="activity-module">Module</label><select id="activity-module" value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value)}><option value="all">All modules</option>{modules.map((module) => <option key={module} value={module}>{module}</option>)}</select></div>
        <div><label htmlFor="activity-search">User or activity</label><input id="activity-search" type="search" placeholder="Search user, action, or description" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
      </div>
      {invalidRange && <Alert>“From” date must be before or equal to the “To” date.</Alert>}
      <button onClick={exportLogs} disabled={loading || exporting || invalidRange || exportRows.length === 0}>{exporting ? "Preparing Excel Report..." : "Export Selected Records"}</button>
    </section>
    {loading ? <p>Loading activity logs...</p> : <><table><thead><tr><th>Date and Time</th><th>User</th><th>Module</th><th>Action</th><th>Description</th></tr></thead><tbody>{logs.length ? logs.slice((page - 1) * pageSize, page * pageSize).map((log) => <tr key={log._id}><td>{new Date(log.createdAt).toLocaleString("en-PH", { timeZone: "Asia/Manila" })}</td><td>{log.userId?.fullName || "Unknown user"}</td><td>{log.module}</td><td>{log.action}</td><td>{log.description}</td></tr>) : <tr><td colSpan="5">No activity logs found.</td></tr>}</tbody></table><Pagination page={page} totalItems={logs.length} pageSize={pageSize} onPageChange={setPage} /></>}
  </div>;
}

export default ActivityLogs;
