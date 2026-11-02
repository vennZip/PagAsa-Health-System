import { useCallback, useEffect, useRef, useState } from "react";
import { apiUrl } from "../config/api";
import { useAuth } from "../context/useAuth";
import { playNotificationChime, unlockNotificationSound } from "../utils/notificationSound";
import { Icon } from "./Icons";
import { Pagination } from "./UI";

const PAGE_SIZE = 8;

export default function NotificationToasts() {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const knownIds = useRef(null);
  const load = useCallback(async () => {
    if (!currentUser) return;
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(apiUrl("/api/notifications/my"), { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) return;
      const next = data.data || [];
      const unreadItems = next.filter((item) => !item.isRead);
      if (knownIds.current !== null) {
        const incoming = unreadItems.filter((item) => !knownIds.current.has(item._id)).slice(0, 3);
        if (incoming.length) { playNotificationChime(); setToasts((current) => [...incoming, ...current].slice(0, 4)); }
      }
      knownIds.current = new Set(next.map((item) => item._id));
      setNotifications(next);
    } catch { /* Notification polling cannot interrupt page use. */ }
  }, [currentUser]);
  useEffect(() => { load(); const interval = window.setInterval(load, 10000); return () => window.clearInterval(interval); }, [load]);
  useEffect(() => { const unlock = () => unlockNotificationSound(); window.addEventListener("pointerdown", unlock, { once: true }); window.addEventListener("keydown", unlock, { once: true }); return () => { window.removeEventListener("pointerdown", unlock); window.removeEventListener("keydown", unlock); }; }, []);
  const markRead = async (id) => { const token = await currentUser.getIdToken(); await fetch(apiUrl(`/api/notifications/${id}/read`), { method: "PATCH", headers: { Authorization: `Bearer ${token}` } }); setNotifications((current) => current.map((item) => item._id === id ? { ...item, isRead: true } : item)); setToasts((current) => current.filter((item) => item._id !== id)); };
  const markAll = async () => { const token = await currentUser.getIdToken(); await fetch(apiUrl("/api/notifications/read-all"), { method: "PATCH", headers: { Authorization: `Bearer ${token}` } }); setNotifications((current) => current.map((item) => ({ ...item, isRead: true }))); };
  const unread = notifications.filter((item) => !item.isRead).length;
  const visible = notifications.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  return <><div className="notification-center"><button type="button" className="notification-trigger" onClick={() => setOpen((value) => !value)} aria-label={`Notifications, ${unread} unread`} aria-expanded={open}><Icon name="bell" />{unread > 0 && <span className="notification-badge">{unread > 99 ? "99+" : unread}</span>}</button>{open && <aside className="notification-panel"><div className="notification-panel-header"><div><h2>Notifications</h2><p>{unread} unread</p></div><button type="button" onClick={markAll} disabled={!unread}>Mark all as read</button></div><div className="notification-panel-list">{visible.length ? visible.map((item) => <article className={item.isRead ? "notification-item" : "notification-item notification-item--unread"} key={item._id}><span>{item.type}</span><h3>{item.title}</h3><p>{item.message}</p><small>{new Date(item.createdAt).toLocaleString("en-PH")}</small>{!item.isRead && <button type="button" onClick={() => markRead(item._id)}>Mark as read</button>}</article>) : <p>No notifications yet.</p>}</div><Pagination page={page} totalItems={notifications.length} pageSize={PAGE_SIZE} onPageChange={setPage} /></aside>}</div><aside className="toast-stack" aria-live="polite">{toasts.map((item) => <article className={`notification-toast notification-toast--${item.type}`} key={item._id}><button type="button" className="toast-close" onClick={() => setToasts((current) => current.filter((toast) => toast._id !== item._id))} aria-label="Dismiss">×</button><span className="toast-type">{item.type}</span><h3>{item.title}</h3><p>{item.message}</p><button type="button" onClick={() => markRead(item._id)}>Mark as read</button></article>)}</aside></>;
}
