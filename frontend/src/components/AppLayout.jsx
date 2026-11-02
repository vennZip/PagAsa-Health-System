import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/useAuth";
import { Icon } from "./Icons";
import NotificationToasts from "./NotificationToasts";
import GlobalFooter from "./GlobalFooter";
import ContactBand from "./ContactBand";

const navigation = [
  ["Dashboard", "/dashboard", "dashboard", ["admin", "staff", "patient"]],
  ["Users", "/admin/users", "users", ["admin"]],
  ["Patients", "/staff-patients", "users", ["admin", "staff"]],
  ["Appointments", "/staff-appointments", "calendar", ["admin", "staff"]],
  ["My Appointments", "/appointments", "calendar", ["patient"]],
  ["Queue Management", "/queue-management", "queue", ["admin", "staff"]],
  ["My Queue", "/my-queue", "queue", ["patient"]],
  ["Inventory", "/inventory", "inventory", ["admin", "staff"]],
  ["Services", "/services-management", "service", ["admin"]],
  ["Clinic Calendar", "/clinic-calendar", "calendar", ["admin", "staff"]],
  ["Activity Logs", "/activity-logs", "logs", ["admin"]],
  ["Reports", "/reports", "reports", ["admin", "staff"]],
  ["Profile & Settings", "/account-settings", "profile", ["admin", "staff", "patient"]],
];

const clockFormatter = new Intl.DateTimeFormat("en-PH", {
  timeZone: "Asia/Manila",
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit"
});

function LiveClock() {
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <time className="live-clock" dateTime={currentTime.toISOString()}>
      {clockFormatter.format(currentTime)}
    </time>
  );
}

function AppLayout({ children }) {
  const { userProfile, logout, role } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const initials = (userProfile?.fullName || "Health Center")
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("");

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${isOpen ? "sidebar--open" : ""}`}>
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">P+</div>
          <div><strong>Barangay Pag-Asa</strong><span>Health Center</span></div>
          <button className="sidebar-close" onClick={() => setIsOpen(false)} aria-label="Close navigation"><Icon name="close" /></button>
        </div>
        <div className="user-card">
          <div className="avatar">{initials}</div>
          <div><strong>{userProfile?.fullName || "Health Center User"}</strong><span>{role || "user"}</span></div>
        </div>
        <nav className="side-nav">
          {navigation
            .filter((item) => item[3].includes(role))
            .map(([label, to, icon]) => (
              <NavLink key={to} to={to} onClick={() => setIsOpen(false)}>
                <Icon name={icon} />
                <span>{label}</span>
              </NavLink>
            ))}
        </nav>
        <button className="logout-button" onClick={handleLogout}><Icon name="logout" /> Logout</button>
      </aside>

      {isOpen && <button className="nav-scrim" onClick={() => setIsOpen(false)} aria-label="Close navigation" />}

      <main className="app-main">
        <ContactBand />
        <header className="topbar">
          <button className="menu-button" onClick={() => setIsOpen(true)} aria-label="Open navigation"><Icon name="menu" /></button>
          <div><span className="topbar-kicker">Barangay Pag-Asa Health Center</span></div>
          <div className="topbar-user">
            <LiveClock />
            <NotificationToasts />
            <div className="avatar avatar--small">{initials}</div>
          </div>
        </header>
        <div className="content-area">{children}</div>
        <GlobalFooter />
      </main>

    </div>
  );
}

export default AppLayout;
