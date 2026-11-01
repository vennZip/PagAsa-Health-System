import { useState } from "react";
import { useAuth } from "../context/useAuth";

function AccountSettings() {
  const {
    currentUser,
    userProfile,
    changeEmail,
    changePassword
  } = useAuth();
  const [newEmail, setNewEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const normalizedEmail = newEmail.trim().toLowerCase();

    if (normalizedEmail !== confirmEmail.trim().toLowerCase()) {
      setError("The new email addresses do not match.");
      return;
    }

    if (normalizedEmail === currentUser?.email?.toLowerCase()) {
      setError("Enter an email different from your current email.");
      return;
    }

    try {
      setSaving(true);
      await changeEmail(normalizedEmail, emailPassword);
      setSuccess(
        "A verification link was sent to your new email. Your sign-in email will change after you open that link."
      );
      setNewEmail("");
      setConfirmEmail("");
      setEmailPassword("");
    } catch (err) {
      const code = err.code || "";

      if (
        code === "auth/invalid-credential" ||
        code === "auth/wrong-password"
      ) {
        setError("Your current password is incorrect.");
      } else if (code === "auth/email-already-in-use") {
        setError("That email address is already in use.");
      } else if (code === "auth/invalid-email") {
        setError("Enter a valid email address.");
      } else if (code === "auth/requires-recent-login") {
        setError("Please log out, log in again, and retry the email change.");
      } else {
        setError(err.message || "Unable to update your email address.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword.length < 6) {
      setPasswordError("The new password must contain at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("The new passwords do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError("Choose a new password different from your current password.");
      return;
    }

    try {
      setPasswordSaving(true);
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess("Your password has been updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      const code = err.code || "";

      if (
        code === "auth/invalid-credential" ||
        code === "auth/wrong-password"
      ) {
        setPasswordError("Your current password is incorrect.");
      } else if (code === "auth/weak-password") {
        setPasswordError("Choose a stronger password with at least 6 characters.");
      } else if (code === "auth/requires-recent-login") {
        setPasswordError("Please log out, log in again, and retry the password change.");
      } else if (code === "auth/too-many-requests") {
        setPasswordError("Too many attempts. Please wait before trying again.");
      } else {
        setPasswordError(err.message || "Unable to update your password.");
      }
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Account Settings</h1>
          <p>Manage the email address used to sign in to your account.</p>
        </div>
      </div>

      <section>
        <h2>Change Email Address</h2>
        <p>
          Current email: <strong>{userProfile?.email || currentUser?.email}</strong>
        </p>

        {error && <p className="alert alert--error">{error}</p>}
        {success && <p className="alert alert--success">{success}</p>}

        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="new-email">New Email Address</label>
            <input
              id="new-email"
              type="email"
              value={newEmail}
              onChange={(event) => setNewEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label htmlFor="confirm-email">Confirm New Email</label>
            <input
              id="confirm-email"
              type="email"
              value={confirmEmail}
              onChange={(event) => setConfirmEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label htmlFor="current-password">Current Password</label>
            <input
              id="current-password"
              type="password"
              value={emailPassword}
              onChange={(event) => setEmailPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <button type="submit" disabled={saving}>
            {saving ? "Updating Email..." : "Update Email"}
          </button>
        </form>
      </section>

      <section>
        <h2>Change Password</h2>
        <p>Confirm your current password before choosing a new one.</p>

        {passwordError && (
          <p className="alert alert--error">{passwordError}</p>
        )}
        {passwordSuccess && (
          <p className="alert alert--success">{passwordSuccess}</p>
        )}

        <form onSubmit={handlePasswordSubmit}>
          <div>
            <label htmlFor="password-current">Current Password</label>
            <input
              id="password-current"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <div>
            <label htmlFor="password-new">New Password</label>
            <input
              id="password-new"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              minLength="6"
              required
            />
          </div>

          <div>
            <label htmlFor="password-confirm">Confirm New Password</label>
            <input
              id="password-confirm"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              minLength="6"
              required
            />
          </div>

          <button type="submit" disabled={passwordSaving}>
            {passwordSaving ? "Updating Password..." : "Update Password"}
          </button>
        </form>
      </section>
    </div>
  );
}

export default AccountSettings;
