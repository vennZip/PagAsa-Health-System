import { Icon } from "./Icons";
export const PageHeader = ({ title, description, actions }) => <div className="page-header"><div><h1>{title}</h1>{description && <p>{description}</p>}</div>{actions && <div className="page-actions">{actions}</div>}</div>;
export const StatCard = ({ icon = "dashboard", label, value, tone = "blue", detail }) => <article className={`stat-card stat-card--${tone}`}><div className="stat-icon"><Icon name={icon} /></div><div><span>{label}</span><strong>{value}</strong>{detail && <small>{detail}</small>}</div></article>;
export const StatusBadge = ({ status = "unknown" }) => <span className={`status-badge status-${String(status).toLowerCase().replaceAll(" ", "-")}`}>{status.replaceAll("-", " ")}</span>;
export const Alert = ({ type = "error", children }) => <p className={`alert alert--${type}`}>{children}</p>;
export const Pagination = ({ page, totalItems, pageSize = 10, onPageChange }) => {
  const pages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (pages <= 1) return null;
  return <nav className="pagination" aria-label="List pages">
    <button type="button" disabled={page === 1} onClick={() => onPageChange(page - 1)}>Previous</button>
    {Array.from({ length: pages }, (_, index) => index + 1).map((number) => (
      <button type="button" key={number} className={number === page ? "pagination-active" : ""} aria-current={number === page ? "page" : undefined} onClick={() => onPageChange(number)}>{number}</button>
    ))}
    <button type="button" disabled={page === pages} onClick={() => onPageChange(page + 1)}>Next</button>
  </nav>;
};
