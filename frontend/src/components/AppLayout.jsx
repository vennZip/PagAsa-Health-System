import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/useAuth";
import { Icon } from "./Icons";
import NotificationToasts from "./NotificationToasts";
import GlobalFooter from "./GlobalFooter";
import ContactBand from "./ContactBand";
import HealthCrossLogo from "./HealthCrossLogo";

const navigation = [
  ["Dashboard", "/dashboard", "dashboard", ["admin", "staff", "patient"]],
  ["Users", "/admin/users", "users", ["admin"]],
  ["Patients", "/staff-patients", "users", ["admin", "staff"]],
  ["Appointments", "/staff-appointments", "calendar", ["admin", "staff"]],
  ["My Appointments", "/appointments", "calendar", ["patient"]],
  ["My Records", "/my-records", "records", ["patient"]],
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
    <div className="app-shell app-shell--top-nav">
      <main className="app-main">
        <div className="site-header">
          <ContactBand />
          <header className="topbar hospital-topbar">
            <div className="header-brand">
              <HealthCrossLogo className="header-brand-mark" />
              <div><strong>Barangay Pag-Asa</strong><span>Health Center</span></div>
            </div>
            <div className="topbar-user">
              <LiveClock />
              <NotificationToasts />
              <button className="header-profile" type="button" onClick={() => navigate("/account-settings")} aria-label="Open profile and settings">
                <span className="avatar avatar--small">{initials}</span>
                <span className="header-user-copy"><strong>{userProfile?.fullName || "Health Center User"}</strong><small>{role || "user"}</small></span>
              </button>
              <button className="header-logout" type="button" onClick={handleLogout}><Icon name="logout" /><span>Logout</span></button>
              <button className="menu-button" type="button" onClick={() => setIsOpen((open) => !open)} aria-label={isOpen ? "Close navigation" : "Open navigation"} aria-expanded={isOpen} aria-controls="primary-navigation"><Icon name={isOpen ? "close" : "menu"} /></button>
            </div>
          </header>
          <nav id="primary-navigation" className={`top-navigation ${isOpen ? "top-navigation--open" : ""}`} aria-label="Primary navigation">
            <div className="top-navigation__inner">
              {navigation
                .filter((item) => item[3].includes(role))
                .map(([label, to, icon]) => (
                  <NavLink key={to} to={to} onClick={() => setIsOpen(false)}>
                    <Icon name={icon} />
                    <span>{label}</span>
                  </NavLink>
                ))}
              <button className="mobile-nav-logout" type="button" onClick={handleLogout}>
                <Icon name="logout" />
                <span>Logout</span>
              </button>
            </div>
          </nav>
        </div>

        {isOpen && <button className="nav-scrim top-nav-scrim" onClick={() => setIsOpen(false)} aria-label="Close navigation" />}
        <div className="content-area">{children}</div>
        <GlobalFooter />
      </main>

    </div>
  );
}

export default AppLayout;
