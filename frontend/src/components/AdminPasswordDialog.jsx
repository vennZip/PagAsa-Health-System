import { useState } from "react";
import { apiUrl } from "../config/api";
import { useAuth } from "../context/useAuth";
import ConfirmDialog from "./ConfirmDialog";
import { Alert } from "./UI";
import { Icon } from "./Icons";

export default function AdminPasswordDialog({ user, onCancel, onSuccess }) {
  const { currentUser } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    if (busy) return;
    setError("");
    if (password.length < 6 || password.length > 128 || !password.trim()) {
      setError("Use a password of 6 to 128 characters, with at least one non-space character.");
      return;
    }
    if (password !== confirmation) {
      setError("The passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(apiUrl(`/api/users/${user._id}/password`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to update the password.");
      setPassword("");
      setConfirmation("");
      onSuccess(`Password updated for ${user.fullName}. They can now sign in using the new password.`);
    } catch (requestError) {
      setError(requestError.message || "Unable to update the password. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return <ConfirmDialog open title="Set New Password" confirmLabel="Set Password" confirmForm="admin-password-form" busy={busy} onCancel={onCancel}>
    <div className="review-list"><p><strong>Account:</strong> {user.fullName}</p><p><strong>Email:</strong> {user.email}</p></div>
    <p>Set a new password for this account. The account owner will need to sign in again.</p>
    <form id="admin-password-form" className="admin-password-form" onSubmit={submit}>
      {[["admin-new-password", "New Password", password, setPassword], ["admin-confirm-password", "Confirm New Password", confirmation, setConfirmation]].map(([id, label, value, update]) => <div key={id}>
        <label htmlFor={id}>{label}</label>
        <div className="password-input-wrap">
          <input id={id} type={showPassword ? "text" : "password"} value={value} onChange={(event) => update(event.target.value)} autoComplete="new-password" minLength={6} maxLength={128} required disabled={busy} aria-describedby="admin-password-help" autoFocus={id === "admin-new-password"} />
          <button type="button" className="password-toggle" disabled={busy} aria-pressed={showPassword} aria-label={showPassword ? "Hide passwords" : "Show passwords"} onClick={() => setShowPassword((value) => !value)}><Icon name={showPassword ? "eyeOff" : "eye"} size={20} /></button>
        </div>
      </div>)}
      <small id="admin-password-help">Use 6 to 128 characters.</small>
      {error && <div role="alert"><Alert>{error}</Alert></div>}
    </form>
  </ConfirmDialog>;
}
