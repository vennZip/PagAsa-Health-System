export default function ConfirmDialog({ open, title, children, confirmLabel = "Confirm", cancelLabel = "Cancel", busy = false, danger = false, onConfirm, onCancel }) {
  if (!open) return null;
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onCancel(); }}>
    <section className="decision-panel confirmation-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirmation-title">
      <h2 id="confirmation-title">{title}</h2>
      <div className="confirmation-message">{children}</div>
      <div className="modal-actions">
        <button type="button" onClick={onCancel} disabled={busy}>{cancelLabel}</button>
        <button type="button" className={danger ? "danger-button" : ""} onClick={onConfirm} disabled={busy}>{busy ? "Please wait..." : confirmLabel}</button>
      </div>
    </section>
  </div>;
}
