import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiUrl } from "../config/api";
import { useAuth } from "../context/useAuth";
import { Alert, PageHeader, Pagination, StatCard, StatusBadge } from "../components/UI";

const pageSize = 8;

const formatDate = (value, withTime = false) => {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {})
  }).format(new Date(value));
};

function ArchiveEntry({ entry }) {
  return (
    <article className={`archive-entry archive-entry--${entry.type}`}>
      <div className="archive-entry__marker" aria-hidden="true" />
      <div className="archive-entry__content">
        <div className="archive-entry__heading">
          <div>
            <span className="archive-entry__type">{entry.typeLabel}</span>
            <h2>{entry.title}</h2>
          </div>
          {entry.status && <StatusBadge status={entry.status} />}
        </div>
        <time dateTime={entry.date}>{formatDate(entry.date, entry.withTime)}</time>
        <dl className="archive-entry__details">
          {entry.details.map(({ label, value }) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value || "Not recorded"}</dd>
            </div>
          ))}
        </dl>
      </div>
    </article>
  );
}

function PatientArchive() {
  const { id } = useParams();
  const { currentUser, role } = useAuth();
  const navigate = useNavigate();
  const [archive, setArchive] = useState(null);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadArchive = async () => {
      try {
        setLoading(true);
        setError("");
        const token = await currentUser.getIdToken();
        const endpoint = role === "patient" ? "/api/patients/me/archive" : `/api/patients/${id}/archive`;
        const response = await fetch(apiUrl(endpoint), {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Unable to load the patient archive.");
        setArchive(data.data);
      } catch (requestError) {
        setError(requestError.message || "Unable to load the patient archive.");
      } finally {
        setLoading(false);
      }
    };

    if (currentUser && (role === "patient" || id)) loadArchive();
  }, [currentUser, id, role]);

  const timeline = useMemo(() => {
    if (!archive) return [];
    const records = archive.healthRecords.map((record) => ({
      id: record._id, type: "record", typeLabel: "Clinical record", date: record.visitDate,
      title: record.serviceId?.serviceName || "Health center visit",
      details: [
        { label: "Chief complaint", value: record.complaint },
        { label: "Observations", value: record.observations || "None recorded" },
        { label: "Notes", value: record.notes || "None recorded" },
        { label: "Recorded by", value: record.staffId?.fullName }
      ]
    }));
    const appointments = archive.appointments.map((appointment) => ({
      id: appointment._id, type: "appointment", typeLabel: "Appointment", date: appointment.appointmentDate,
      title: appointment.serviceId?.serviceName || "Health service appointment", status: appointment.status,
      details: [
        { label: "Scheduled time", value: appointment.appointmentTime },
        { label: "Remarks", value: appointment.remarks || "None recorded" },
        { label: "Reviewed by", value: appointment.approvedBy?.fullName }
      ]
    }));
    const queues = archive.queueTickets.map((ticket) => ({
      id: ticket._id, type: "queue", typeLabel: "Queue visit", date: ticket.queueDate,
      title: `Queue ticket ${ticket.queueNumber}`, status: ticket.status,
      details: [
        { label: "Priority", value: ticket.priority },
        { label: "Called at", value: ticket.calledAt ? formatDate(ticket.calledAt, true) : "Not called" },
        { label: "Completed at", value: ticket.completedAt ? formatDate(ticket.completedAt, true) : "Not completed" }
      ]
    }));
    return [...records, ...appointments, ...queues].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [archive]);

  const filtered = filter === "all" ? timeline : timeline.filter((entry) => entry.type === filter);
  const pagedEntries = filtered.slice((page - 1) * pageSize, page * pageSize);
  const changeFilter = (nextFilter) => { setFilter(nextFilter); setPage(1); };

  if (loading) return <section className="archive-loading" aria-busy="true">Loading patient history...</section>;
  if (error) return <><Alert>{error}</Alert><button onClick={() => navigate(-1)}>Go Back</button></>;
  if (!archive) return <Alert>No archive was found for this patient.</Alert>;

  const { patient, summary } = archive;
  return (
    <div className="patient-archive">
      <PageHeader
        title="Patient History"
        description="A chronological, read-only record of clinic activity."
        actions={<button type="button" className="button-secondary" onClick={() => navigate(role === "patient" ? "/account-settings" : "/staff-patients")}>Back</button>}
      />
      <section className="archive-patient-summary" aria-labelledby="archive-patient-name">
        <div><span>Patient archive</span><h2 id="archive-patient-name">{patient.userId?.fullName || "Patient"}</h2></div>
        <dl><div><dt>Patient number</dt><dd>{patient.patientNumber}</dd></div><div><dt>Member since</dt><dd>{formatDate(patient.createdAt)}</dd></div></dl>
      </section>
      <div className="stat-grid archive-stats">
        <StatCard icon="records" label="Clinical Records" value={summary.healthRecords} tone="blue" />
        <StatCard icon="calendar" label="Appointments" value={summary.appointments} tone="orange" />
        <StatCard icon="service" label="Completed" value={summary.completedAppointments} tone="green" />
        <StatCard icon="queue" label="Queue Visits" value={summary.queueVisits} tone="blue" />
      </div>
      <section className="archive-history" aria-labelledby="archive-history-title">
        <div className="archive-toolbar">
          <div><h2 id="archive-history-title">History timeline</h2><p>{filtered.length} historical {filtered.length === 1 ? "entry" : "entries"}</p></div>
          <div className="archive-filters" role="group" aria-label="Filter patient history">
            {[['all', 'All'], ['record', 'Clinical'], ['appointment', 'Appointments'], ['queue', 'Queue']].map(([value, label]) => (
              <button key={value} type="button" className={filter === value ? "archive-filter--active" : "button-secondary"} aria-pressed={filter === value} onClick={() => changeFilter(value)}>{label}</button>
            ))}
          </div>
        </div>
        {pagedEntries.length ? <div className="archive-timeline">{pagedEntries.map((entry) => <ArchiveEntry key={`${entry.type}-${entry.id}`} entry={entry} />)}</div> : <div className="archive-empty" role="status"><h3>No history in this category</h3><p>Records will appear here after the patient receives a related service.</p></div>}
        <Pagination page={page} totalItems={filtered.length} pageSize={pageSize} onPageChange={setPage} />
      </section>
    </div>
  );
}

export default PatientArchive;
