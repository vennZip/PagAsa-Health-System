import { apiUrl } from "../config/api";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function MyNotifications() {
  const { currentUser } = useAuth(); const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]); const [error, setError] = useState("");
  const load = useCallback(async () => {
    try { const token = await currentUser.getIdToken(); const response = await fetch(apiUrl("/api/notifications/my"), { headers: { Authorization: `Bearer ${token}` } }); const data = await response.json(); if (!response.ok) throw new Error(data.message); setNotifications(data.data || []); } catch (err) { setError(err.message || "Unable to load notifications."); }
  }, [currentUser]);
  useEffect(() => { // eslint-disable-next-line react-hooks/set-state-in-effect
    load(); }, [load]);
  const markRead = async (id) => { try { const token = await currentUser.getIdToken(); const response = await fetch(apiUrl(`/api/notifications/${id}/read`), { method: "PATCH", headers: { Authorization: `Bearer ${token}` } }); if (!response.ok) throw new Error("Unable to update notification."); await load(); } catch (err) { setError(err.message); } };
  return <div><h1>My Notifications</h1><button onClick={() => navigate("/dashboard")}>Back to Dashboard</button>{error && <p style={{ color: "red" }}>{error}</p>}{notifications.length ? notifications.map((notification) => <section key={notification._id}><h3>{notification.title}</h3><p>{notification.message}</p><p><strong>Type:</strong> {notification.type}</p>{!notification.isRead && <button onClick={() => markRead(notification._id)}>Mark as Read</button>}<hr /></section>) : <p>You have no notifications.</p>}</div>;
}
export default MyNotifications;
