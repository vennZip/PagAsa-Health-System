import { useCallback, useEffect, useState } from "react";
import { apiUrl } from "../config/api";
import { useAuth } from "../context/useAuth";
import { PageHeader, StatCard } from "../components/UI";
import AnnouncementFeed from "../components/AnnouncementFeed";

export default function AdminDashboard() {
  const { currentUser, userProfile } = useAuth(); const [totals, setTotals] = useState(null);
  const load = useCallback(async () => { try { const token = await currentUser.getIdToken(); const response = await fetch(apiUrl("/api/reports/dashboard"), { headers: { Authorization: `Bearer ${token}` } }); const data = await response.json(); if (response.ok) setTotals(data.data?.totals); } catch { /* Feed remains usable. */ } }, [currentUser]);
  useEffect(() => { // eslint-disable-next-line react-hooks/set-state-in-effect
    load(); }, [load]);
  return <div><PageHeader title="Health Center Feed" description={`Welcome back, ${userProfile?.fullName || "Administrator"}. Post and review health center updates.`} /><div className="stat-grid"><StatCard icon="users" label="Total Patients" value={totals?.patients ?? "..."} tone="blue" /><StatCard icon="calendar" label="Appointments" value={totals?.appointments ?? "..."} tone="orange" /><StatCard icon="queue" label="Queue Tickets" value={totals?.queueTickets ?? "..."} tone="green" /><StatCard icon="inventory" label="Low Stock" value={totals?.lowStock ?? "..."} tone="red" /></div><AnnouncementFeed /></div>;
}
