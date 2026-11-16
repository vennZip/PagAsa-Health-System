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
  const lastRequest = useRef(0);
  const load = useCallback(async (signal) => {
    if (!currentUser) return false;
    try {
      lastRequest.current = Date.now();
      const token = await currentUser.getIdToken();
      if (signal.aborted) return false;
      const response = await fetch(apiUrl("/api/notifications/my"), { signal, cache: "no-store", headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (signal.aborted) return false;
      if (response.status === 401 || response.status === 403) {
        window.dispatchEvent(new CustomEvent("pagasa:session-rejected", { detail: data.message }));
        return false;
      }
      if (!response.ok) return false;
      const next = data.data || [];
      const unreadItems = next.filter((item) => !item.isRead);
      const seenKey = `pagasa_notifications_seen_${currentUser.uid}`;
      if (knownIds.current === null) {
        knownIds.current = new Set(JSON.parse(sessionStorage.getItem(seenKey) || "[]"));
      }
      const incoming = unreadItems.filter((item) => !knownIds.current.has(item._id)).slice(0, 3);
      if (incoming.length) { playNotificationChime(); setToasts((current) => [...incoming, ...current].slice(0, 4)); }
      knownIds.current = new Set(next.map((item) => item._id));
      sessionStorage.setItem(seenKey, JSON.stringify([...knownIds.current]));
      setNotifications(next);
      return true;
    } catch { return false; /* Retry with backoff; do not flood the console. */ }
  }, [currentUser]);
  useEffect(() => {
    if (!currentUser) return undefined;
    const controller = new AbortController();
    let timer;
    let inFlight = false;
    let delay = 60000;
    const refresh = async () => {
      if (controller.signal.aborted || inFlight || document.visibilityState === "hidden") return;
      window.clearTimeout(timer);
      inFlight = true;
      const ok = await load(controller.signal);
      inFlight = false;
      delay = ok ? 60000 : Math.min(delay * 2, 300000);
      if (!controller.signal.aborted) timer = window.setTimeout(refresh, delay);
    };
    const whenVisible = () => {
      if (document.visibilityState === "hidden") window.clearTimeout(timer);
      else if (Date.now() - lastRequest.current >= delay) refresh();
      else { window.clearTimeout(timer); timer = window.setTimeout(refresh, Math.max(0, delay - (Date.now() - lastRequest.current))); }
    };
    const onDemand = () => refresh();
    refresh();
    document.addEventListener("visibilitychange", whenVisible);
    window.addEventListener("pagasa:refresh-notifications", onDemand);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", whenVisible);
      window.removeEventListener("pagasa:refresh-notifications", onDemand);
    };
  }, [currentUser, load]);
  useEffect(() => { const unlock = () => unlockNotificationSound(); window.addEventListener("pointerdown", unlock, { once: true }); window.addEventListener("keydown", unlock, { once: true }); return () => { window.removeEventListener("pointerdown", unlock); window.removeEventListener("keydown", unlock); }; }, []);
  const markRead = async (id) => {
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(apiUrl(`/api/notifications/${id}/read`), { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) return;
      setNotifications((current) => current.map((item) => item._id === id ? { ...item, isRead: true } : item));
      setToasts((current) => current.filter((item) => item._id !== id));
    } catch { /* Keep unread notifications available for another attempt. */ }
  };
  const markAll = async () => {
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(apiUrl("/api/notifications/read-all"), { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) return;
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
      setToasts([]);
    } catch { /* Keep unread notifications available for another attempt. */ }
  };
  const unread = notifications.filter((item) => !item.isRead).length;
  const visible = notifications.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  return <><div className="notification-center"><button type="button" className="notification-trigger" onClick={() => { if (!open) window.dispatchEvent(new Event("pagasa:refresh-notifications")); setOpen((value) => !value); }} aria-label={`Notifications, ${unread} unread`} aria-expanded={open}><Icon name="bell" />{unread > 0 && <span className="notification-badge">{unread > 99 ? "99+" : unread}</span>}</button>{open && <aside className="notification-panel"><div className="notification-panel-header"><div><h2>Notifications</h2><p>{unread} unread</p></div><button type="button" onClick={markAll} disabled={!unread}>Mark all as read</button></div><div className="notification-panel-list">{visible.length ? visible.map((item) => <article className={item.isRead ? "notification-item" : "notification-item notification-item--unread"} key={item._id}><span>{item.type}</span><h3>{item.title}</h3><p>{item.message}</p><small>{new Date(item.createdAt).toLocaleString("en-PH")}</small>{!item.isRead && <button type="button" onClick={() => markRead(item._id)}>Mark as read</button>}</article>) : <p>No notifications yet.</p>}</div><Pagination page={page} totalItems={notifications.length} pageSize={PAGE_SIZE} onPageChange={setPage} /></aside>}</div><aside className="toast-stack" aria-live="polite">{toasts.map((item) => <article className={`notification-toast notification-toast--${item.type}`} key={item._id}><button type="button" className="toast-close" onClick={() => setToasts((current) => current.filter((toast) => toast._id !== item._id))} aria-label="Dismiss">×</button><span className="toast-type">{item.type}</span><h3>{item.title}</h3><p>{item.message}</p><button type="button" onClick={() => markRead(item._id)}>Mark as read</button></article>)}</aside></>;
}
