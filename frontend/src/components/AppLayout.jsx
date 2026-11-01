import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/useAuth";
import { Icon } from "./Icons";

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
  ["Notifications", "/notifications", "bell", ["admin", "staff", "patient"]],
  ["Activity Logs", "/activity-logs", "logs", ["admin"]],
  ["Reports", "/reports", "reports", ["admin"]],
  ["My Profile", "/my-profile", "profile", ["patient"]]
];

function AppLayout({ children }) {
  const { userProfile, logout, role } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const initials = (userProfile?.fullName || "Health Center").split(" ").map((word) => word[0]).slice(0, 2).join("");

  const handleLogout = async () => { await logout(); navigate("/login"); };
  return <div className="app-shell">
    <aside className={`sidebar ${isOpen ? "sidebar--open" : ""}`}>
      <div className="brand"><div className="brand-mark">✚</div><div><strong>Barangay Pag-Asa</strong><span>Health Center</span></div><button className="sidebar-close" onClick={() => setIsOpen(false)} aria-label="Close navigation"><Icon name="close" /></button></div>
      <div className="user-card"><div className="avatar">{initials}</div><div><strong>{userProfile?.fullName || "Health Center User"}</strong><span>{role || "user"}</span></div></div>
      <nav className="side-nav">{navigation.filter((item) => item[3].includes(role)).map(([label, to, icon]) => <NavLink key={to} to={to} onClick={() => setIsOpen(false)}><Icon name={icon} /> <span>{label}</span></NavLink>)}</nav>
      <button className="logout-button" onClick={handleLogout}><Icon name="logout" /> Logout</button>
    </aside>
    {isOpen && <button className="nav-scrim" onClick={() => setIsOpen(false)} aria-label="Close navigation" />}
    <main className="app-main"><header className="topbar"><button className="menu-button" onClick={() => setIsOpen(true)} aria-label="Open navigation"><Icon name="menu" /></button><div><span className="topbar-kicker">Barangay Pag-Asa Health Center</span></div><div className="topbar-user"><div className="avatar avatar--small">{initials}</div></div></header><div className="content-area">{children}</div></main>
  </div>;
}
export default AppLayout;
