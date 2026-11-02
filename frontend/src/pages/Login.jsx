import { useRef, useState } from "react";
import { useAuth } from "../context/useAuth";
import { useNavigate, Link } from "react-router-dom";

const S = {
  page: {
    minHeight: "100vh",
    display: "flex",
    background: "#f3f8fa",
  },
  panel: {
    flex: "0 0 420px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 40px",
    background: "#082f49",
    color: "#fff",
    gap: "24px",
  },
  cross: {
    fontSize: "72px",
    lineHeight: 1,
    color: "rgba(255,255,255,0.9)",
    textShadow: "none",
    marginBottom: "8px",
  },
  panelTitle: {
    margin: "0 0 6px",
    fontSize: "26px",
    fontWeight: 800,
    letterSpacing: "-0.5px",
    textAlign: "center",
    color: "#fff",
  },
  panelSub: {
    margin: 0,
    fontSize: "15px",
    color: "rgba(255,255,255,0.82)",
    textAlign: "center",
    lineHeight: 1.6,
    fontStyle: "italic",
  },
  panelBadge: {
    marginTop: "28px",
    padding: "8px 20px",
    background: "rgba(255,255,255,0.15)",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: 700,
    color: "rgba(255,255,255,0.9)",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
  },
  formSide: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 24px",
  },
  card: {
    width: "min(420px, 100%)",
    background: "#fff",
    borderRadius: "10px",
    boxShadow: "0 18px 50px rgba(8,47,73,0.10)",
    padding: "40px 36px 32px",
    border: "1px solid #cfdee4",
  },
  cardTitle: {
    margin: "0 0 4px",
    fontSize: "22px",
    fontWeight: 800,
    color: "#082f49",
    letterSpacing: "-0.4px",
  },
  cardSub: {
    margin: "0 0 28px",
    fontSize: "14px",
    color: "#526b78",
  },
};

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
    <div style={S.page}>
      {/* Branding panel */}
      <div style={S.panel} className="auth-brand-panel">
        <div style={S.cross}>P+</div>
        <h1 style={S.panelTitle}>Barangay Pag-Asa<br />Health Center</h1>
        <p style={S.panelSub}>"Caring for you, beyond cure."</p>
        <span style={S.panelBadge}>Community Health &amp; Wellness</span>
      </div>

      {/* Form side */}
      <div style={S.formSide}>
        <div style={S.card}>
          <h2 style={S.cardTitle}>Welcome back</h2>
          <p style={S.cardSub}>Sign in to access your health center account.</p>

          <div className="auth-card" style={{ width: "auto", padding: 0, border: 0, boxShadow: "none", borderRadius: 0, background: "transparent" }}>
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

              {error && <p className="alert alert--error" style={{ margin: "10px 0" }}>{error}</p>}
              {message && <p className="alert alert--success">{message}</p>}

              <button type="submit" disabled={loading || resetLoading}>
                {loading ? "Logging in..." : "Login"}
              </button>

              <p style={{ textAlign: "center", marginTop: "16px" }}>
                Don&apos;t have an account?{" "}
                <Link to="/register">Register here</Link>
              </p>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 820px) {
          .auth-brand-panel { display: none !important; }
        }
      `}</style>
    </div>
  );
}

export default Login;
