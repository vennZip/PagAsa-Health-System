import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../config/api";
import { useAuth } from "../context/useAuth";

const destinationFor = (type, role) => {
  if (type === "appointment") {
    return role === "patient" ? "/appointments" : "/staff-appointments";
  }
  if (type === "queue") {
    return role === "patient" ? "/my-queue" : "/queue-management";
  }
  if (type === "inventory") return "/inventory";
  return role === "patient" ? "/my-profile" : "/dashboard";
};

function NotificationToasts({ onUnreadCountChange }) {
  const { currentUser, role } = useAuth();
  const navigate = useNavigate();
  const [toasts, setToasts] = useState([]);
  const knownIds = useRef(null);

  const loadNotifications = useCallback(async () => {
    if (!currentUser) return;

    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(apiUrl("/api/notifications/my"), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) return;

      const notifications = data.data || [];
      const unread = notifications.filter((notification) => !notification.isRead);
      onUnreadCountChange(unread.length);

      if (knownIds.current === null) {
        knownIds.current = new Set(notifications.map((notification) => notification._id));
        return;
      }

      const incoming = unread
        .filter((notification) => !knownIds.current.has(notification._id))
        .slice(0, 3);

      notifications.forEach((notification) => knownIds.current.add(notification._id));

      if (incoming.length > 0) {
        setToasts((current) => [...incoming, ...current].slice(0, 4));
      }
    } catch {
      // Notification polling should never interrupt the current page.
    }
  }, [currentUser, onUnreadCountChange]);

  useEffect(() => {
    loadNotifications();
    const interval = window.setInterval(loadNotifications, 10000);
    return () => window.clearInterval(interval);
  }, [loadNotifications]);

  const viewNotification = async (notification) => {
    try {
      const token = await currentUser.getIdToken();
      await fetch(apiUrl(`/api/notifications/${notification._id}/read`), {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
    } finally {
      setToasts((current) => current.filter((item) => item._id !== notification._id));
      onUnreadCountChange((count) => Math.max(0, count - 1));
      navigate(destinationFor(notification.type, role));
    }
  };

  return (
    <aside className="toast-stack" aria-live="polite" aria-label="New notifications">
      {toasts.map((notification) => (
        <article className={`notification-toast notification-toast--${notification.type}`} key={notification._id}>
          <button
            type="button"
            className="toast-close"
            onClick={() => setToasts((current) => current.filter((item) => item._id !== notification._id))}
            aria-label="Dismiss notification"
          >
            ×
          </button>
          <span className="toast-type">{notification.type}</span>
          <h3>{notification.title}</h3>
          <p>{notification.message}</p>
          <button type="button" onClick={() => viewNotification(notification)}>
            View Details
          </button>
        </article>
      ))}
    </aside>
  );
}

export default NotificationToasts;
