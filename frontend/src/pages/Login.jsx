import { useRef, useState } from "react";
import { useAuth } from "../context/useAuth";
import { useNavigate, Link } from "react-router-dom";

function Login() {
  const { login, resetPassword } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const emailInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    try {
      setLoading(true);

      await login(email, password);

      navigate("/dashboard");

    } catch (err) {
      const errorMessage = err.message?.toLowerCase() || "";

      if (
        errorMessage.includes("inactive") ||
        errorMessage.includes("deactivated")
      ) {
        setError(
          "Your account has been deactivated. Please contact the administrator."
        );
      } else {
        setError("Invalid email or password.");
      }

      setEmail("");
      setPassword("");
      emailInputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError("");
    setMessage("");

    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setError("Enter your email address to reset your password.");
      emailInputRef.current?.focus();
      return;
    }

    try {
      setResetLoading(true);
      await resetPassword(normalizedEmail);
      setMessage(
        "If an account uses this email, a password reset link has been sent."
      );
      setPassword("");
    } catch (err) {
      const errorCode = err.code || "";

      if (errorCode === "auth/invalid-email") {
        setError("Enter a valid email address.");
      } else if (errorCode === "auth/too-many-requests") {
        setError("Too many requests. Please wait before trying again.");
      } else if (errorCode === "auth/user-not-found") {
        setMessage(
          "If an account uses this email, a password reset link has been sent."
        );
      } else {
        setError("Unable to send a reset link. Please try again.");
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="auth-page"><div className="auth-card">
      <h1>Barangay Pag-Asa Health Center</h1>
      <p>Sign in to access your health center account.</p>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Email Address</label>
          <input
            ref={emailInputRef}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            className="auth-link-button"
            type="button"
            onClick={handleForgotPassword}
            disabled={loading || resetLoading}
          >
            {resetLoading ? "Sending reset link..." : "Forgot password?"}
          </button>
        </div>

        {error && <p style={{ color: "red" }}>{error}</p>}
        {message && <p className="alert alert--success">{message}</p>}

        <button type="submit" disabled={loading || resetLoading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <p>
  Don't have an account? <Link to="/register">Register here</Link>
</p>
      </form>
    </div></div>
  );
}

export default Login;
