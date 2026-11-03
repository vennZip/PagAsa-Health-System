import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { auth } from "../firebase";
import AuthBrandPanel from "../components/AuthBrandPanel";
import ThemeSelector from "../components/ThemeSelector";
import { Icon } from "../components/Icons";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const actionCode = searchParams.get("oobCode") || "";
  const mode = searchParams.get("mode") || "";
  const [status, setStatus] = useState("checking");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const validateLink = async () => {
      if (mode !== "resetPassword" || !actionCode) {
        if (active) setStatus("invalid");
        return;
      }

      try {
        const accountEmail = await verifyPasswordResetCode(auth, actionCode);
        if (active) {
          setEmail(accountEmail);
          setStatus("ready");
        }
      } catch {
        if (active) setStatus("invalid");
      }
    };

    validateLink();
    return () => { active = false; };
  }, [actionCode, mode]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Use a password with at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setStatus("submitting");
      await confirmPasswordReset(auth, actionCode, password);
      setPassword("");
      setConfirmPassword("");
      setStatus("success");
    } catch (resetError) {
      if (["auth/expired-action-code", "auth/invalid-action-code"].includes(resetError.code)) {
        setStatus("invalid");
        return;
      }

      setError(resetError.code === "auth/weak-password"
        ? "Choose a stronger password."
        : "We could not update your password. Please try again.");
      setStatus("ready");
    }
  };

  return (
    <main className="auth-page-shell reset-password-page">
      <AuthBrandPanel />
      <div className="auth-form-side">
        <div className="auth-theme-control"><ThemeSelector compact /></div>
        <section className="auth-form-card reset-password-card" aria-live="polite">
          {status === "checking" && (
            <div role="status">
              <span className="reset-password-kicker">Account security</span>
              <h1>Checking your reset link</h1>
              <p>Please wait while we verify that this password reset request is valid.</p>
            </div>
          )}

          {status === "invalid" && (
            <div>
              <span className="reset-password-kicker">Link unavailable</span>
              <h1>Request a new reset link</h1>
              <p>This link has expired, has already been used, or is incomplete. Return to login and request a new password reset email.</p>
              <Link className="reset-password-action" to="/login">Return to login</Link>
            </div>
          )}

          {(status === "ready" || status === "submitting") && (
            <>
              <span className="reset-password-kicker">Account security</span>
              <h1>Create a new password</h1>
              <p>Set a new password for <strong>{email}</strong>.</p>
              <form className="reset-password-form" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="new-password">New password</label>
                  <div className="password-input-wrap">
                    <input id="new-password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={6} required />
                    <button type="button" className="password-toggle" aria-label={showPassword ? "Hide passwords" : "Show passwords"} aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)}>
                      <Icon name={showPassword ? "eyeOff" : "eye"} size={20} />
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="confirm-new-password">Confirm new password</label>
                  <input id="confirm-new-password" type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" minLength={6} required />
                </div>
                {error && <p className="alert alert--error">{error}</p>}
                <button type="submit" disabled={status === "submitting"}>{status === "submitting" ? "Updating password..." : "Update password"}</button>
              </form>
            </>
          )}

          {status === "success" && (
            <div>
              <span className="reset-password-kicker">Password updated</span>
              <h1>Your password has been changed</h1>
              <p>You can now sign in using your new password.</p>
              <Link className="reset-password-action" to="/login">Continue to login</Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default ResetPassword;
