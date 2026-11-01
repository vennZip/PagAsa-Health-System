import { Icon } from "./Icons";
export const PageHeader = ({ title, description, actions }) => <div className="page-header"><div><h1>{title}</h1>{description && <p>{description}</p>}</div>{actions && <div className="page-actions">{actions}</div>}</div>;
export const StatCard = ({ icon = "dashboard", label, value, tone = "blue", detail }) => <article className={`stat-card stat-card--${tone}`}><div className="stat-icon"><Icon name={icon} /></div><div><span>{label}</span><strong>{value}</strong>{detail && <small>{detail}</small>}</div></article>;
export const StatusBadge = ({ status = "unknown" }) => <span className={`status-badge status-${String(status).toLowerCase().replaceAll(" ", "-")}`}>{status.replaceAll("-", " ")}</span>;
export const Alert = ({ type = "error", children }) => <p className={`alert alert--${type}`}>{children}</p>;
