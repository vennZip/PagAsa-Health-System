import { useCallback, useEffect, useState } from "react";
import { apiUrl } from "../config/api";
import { useAuth } from "../context/useAuth";
import { PageHeader } from "../components/UI";

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function ClinicCalendar() {
  const { currentUser } = useAuth();
  const [schedule, setSchedule] = useState(null);
  const [closedDate, setClosedDate] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const load = useCallback(async () => {
    const token = await currentUser.getIdToken();
    const response = await fetch(apiUrl("/api/schedule"), {
      cache: "no-store",
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Unable to load clinic hours.");
    setSchedule(data.data);
  }, [currentUser]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load().catch((loadError) => setError(loadError.message));
  }, [load]);

  const persistSchedule = async (nextSchedule, successMessage = "Clinic schedule updated.") => {
    try {
      setSaving(true);
      setError("");
      setNotice("");
      const token = await currentUser.getIdToken();
      const response = await fetch(apiUrl("/api/schedule"), {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ weeklyHours: nextSchedule.weeklyHours, closedDates: nextSchedule.closedDates })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to save clinic hours.");
      setSchedule(data.data);
      setDirty(false);
      setNotice(successMessage);
    } catch (saveError) {
      setError(saveError.message || "Unable to save clinic hours.");
      throw saveError;
    } finally {
      setSaving(false);
    }
  };

  const updateDay = (dayOfWeek, field, value, saveImmediately = false) => {
    const nextSchedule = {
      ...schedule,
      weeklyHours: schedule.weeklyHours.map((day) => Number(day.dayOfWeek) === dayOfWeek ? { ...day, [field]: value } : day)
    };
    setSchedule(nextSchedule);
    setDirty(true);
    setNotice("");
    if (saveImmediately) {
      persistSchedule(nextSchedule, `${dayNames[dayOfWeek]} is now ${value ? "open" : "closed"}.`).catch(() => undefined);
    }
  };

  const addClosedDate = () => {
    if (!closedDate || schedule.closedDates.includes(closedDate)) return;
    setSchedule((current) => ({ ...current, closedDates: [...current.closedDates, closedDate].sort() }));
    setClosedDate("");
    setDirty(true);
    setNotice("");
  };

  const removeClosedDate = (date) => {
    setSchedule((current) => ({ ...current, closedDates: current.closedDates.filter((item) => item !== date) }));
    setDirty(true);
    setNotice("");
  };

  if (!schedule) return <p>{error || "Loading clinic calendar..."}</p>;

  return <div>
    <PageHeader
      title="Clinic Calendar"
      description="Set weekly opening hours and special closed dates. Appointment slots use fixed 30-minute intervals."
      actions={<button onClick={() => persistSchedule(schedule)} disabled={saving || !dirty}>{saving ? "Saving..." : dirty ? "Save Calendar" : "Calendar Saved"}</button>}
    />
    {dirty && <p className="alert alert--info">You have unsaved time or closed-date changes. Open/closed switches save immediately.</p>}
    {notice && <p className="alert alert--success" role="status">{notice}</p>}
    {error && <p className="alert alert--error" role="alert">{error}</p>}

    <section>
      <h2>Weekly Clinic Hours</h2>
      <div className="schedule-days">
        {schedule.weeklyHours.slice().sort((a, b) => Number(a.dayOfWeek) - Number(b.dayOfWeek)).map((day) => {
          const dayOfWeek = Number(day.dayOfWeek);
          return <div className="schedule-day" key={dayOfWeek}>
            <strong>{dayNames[dayOfWeek]}</strong>
            <label className="toggle-label">
              <input type="checkbox" checked={day.isOpen} disabled={saving} onChange={(event) => updateDay(dayOfWeek, "isOpen", event.target.checked, true)} />
              {day.isOpen ? "Open" : "Closed"}
            </label>
            <input aria-label={`${dayNames[dayOfWeek]} opening time`} type="time" value={day.openTime} disabled={!day.isOpen || saving} onChange={(event) => updateDay(dayOfWeek, "openTime", event.target.value)} />
            <span>to</span>
            <input aria-label={`${dayNames[dayOfWeek]} closing time`} type="time" value={day.closeTime} disabled={!day.isOpen || saving} onChange={(event) => updateDay(dayOfWeek, "closeTime", event.target.value)} />
          </div>;
        })}
      </div>
    </section>

    <section>
      <h2>Special Closed Dates</h2>
      <p>Add holidays, maintenance days, or other dates when the clinic will not accept appointments.</p>
      <div className="closed-date-entry"><input type="date" value={closedDate} onChange={(event) => setClosedDate(event.target.value)} /><button type="button" onClick={addClosedDate}>Add Closed Date</button></div>
      <div className="closed-date-list">{schedule.closedDates.length ? schedule.closedDates.map((date) => <span key={date}>{new Date(`${date}T00:00:00`).toLocaleDateString("en-PH")} <button type="button" aria-label={`Remove ${date}`} onClick={() => removeClosedDate(date)}>×</button></span>) : <p>No special closed dates.</p>}</div>
    </section>
  </div>;
}
