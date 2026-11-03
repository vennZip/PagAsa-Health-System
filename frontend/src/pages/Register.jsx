import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { Icon } from "../components/Icons";
import AuthBrandPanel from "../components/AuthBrandPanel";
import ThemeSelector from "../components/ThemeSelector";

const S = {
  page: {
    minHeight: "100vh",
    display: "flex",
    background: "#faf7f7",
  },
  panel: {
    flex: "0 0 380px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 36px",
    background: "#3a1a20",
    color: "#fff",
    gap: "20px",
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
    fontSize: "24px",
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
    marginTop: "24px",
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
    width: "min(440px, 100%)",
    background: "#fff",
    borderRadius: "10px",
    boxShadow: "0 18px 50px rgba(38,20,23,0.14)",
    padding: "36px 36px 28px",
    border: "1px solid #ddcfd2",
  },
  cardTitle: {
    margin: "0 0 4px",
    fontSize: "22px",
    fontWeight: 800,
    color: "#3a1a20",
    letterSpacing: "-0.4px",
  },
  cardSub: {
    margin: "0 0 24px",
    fontSize: "14px",
    color: "#66585b",
  },
};

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const fullNameInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      setFormData((current) => ({
        ...current,
        password: "",
        confirmPassword: ""
      }));
      passwordInputRef.current?.focus();
      return;
    }

    setShowConsent(true);
  };

  const handleConsent = async () => {
    try {
      setLoading(true);
      await register(
        formData.fullName,
        formData.email,
        formData.password,
        true
      );
      navigate("/profile", { replace: true });
    } catch (err) {
      const errorCode = err.code || "";
      const errorMessage = err.message?.toLowerCase() || "";

      if (
        errorCode === "auth/email-already-in-use" ||
        errorMessage.includes("email is already") ||
        errorMessage.includes("email already")
      ) {
        setError(
          "An account already uses this email. Please log in or reset your password."
        );
      } else if (errorCode === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (errorCode === "auth/weak-password") {
        setError("Please use a stronger password with at least 6 characters.");
      } else {
        setError("Unable to create your account. Please try again.");
      }
      setShowConsent(false);
      setFormData({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: ""
      });
      fullNameInputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page} className="auth-page-shell">
      {/* Branding panel */}
      <AuthBrandPanel />

      {/* Form side */}
      <div style={S.formSide} className="auth-form-side">
        <div className="auth-theme-control"><ThemeSelector compact /></div>
        <div style={S.card} className="auth-form-card">
          <h2 style={S.cardTitle}>Create an account</h2>
          <p style={S.cardSub}>Join the health center patient portal today.</p>

          <div className="auth-card" style={{ width: "auto", padding: 0, border: 0, boxShadow: "none", borderRadius: 0, background: "transparent" }}>
            <form onSubmit={handleSubmit}>
              <div>
                <label>Full Name</label>
                <input
                  ref={fullNameInputRef}
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label htmlFor="register-password">Password</label>
                <div className="password-input-wrap">
                  <input
                    id="register-password"
                    ref={passwordInputRef}
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                    minLength="6"
                    required
                  />
                  <button type="button" className="password-toggle" aria-pressed={showPassword} aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((visible) => !visible)}>
                    <Icon name={showPassword ? "eyeOff" : "eye"} size={20} />
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="register-confirm-password">Confirm Password</label>
                <div className="password-input-wrap">
                  <input
                    id="register-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    autoComplete="new-password"
                    minLength="6"
                    required
                  />
                  <button type="button" className="password-toggle" aria-pressed={showConfirmPassword} aria-label={showConfirmPassword ? "Hide confirmation password" : "Show confirmation password"} onClick={() => setShowConfirmPassword((visible) => !visible)}>
                    <Icon name={showConfirmPassword ? "eyeOff" : "eye"} size={20} />
                  </button>
                </div>
              </div>

              {error && <p className="alert alert--error" style={{ margin: "10px 0" }}>{error}</p>}
              {success && <p className="alert alert--success">{success}</p>}

              <button type="submit" disabled={loading}>
                {loading ? "Registering..." : "Register"}
              </button>

              <p style={{ textAlign: "center", marginTop: "16px" }}>
                Already have an account?{" "}
                <Link to="/login">Return to login</Link>
              </p>
            </form>
          </div>
        </div>
      </div>

      {showConsent && (
        <div className="modal-backdrop" role="presentation">
          <section
            className="decision-panel privacy-consent-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="privacy-consent-title"
            aria-describedby="privacy-consent-description"
          >
            <span className="privacy-consent-kicker">Before you continue</span>
            <h2 id="privacy-consent-title">Your privacy matters</h2>
            <p id="privacy-consent-description">
              Do you agree to share your personal and health-related information with
              Barangay Pag-Asa Health Center so we can create your patient profile,
              manage appointments, provide queue updates, and maintain your health records?
            </p>
            <div className="privacy-consent-summary">
              <h3>Information we will request</h3>
              <ul>
                <li>Birth date, sex, address, and contact number</li>
                <li>Emergency contact information</li>
                <li>Appointment, queue, and health-service records</li>
              </ul>
            </div>
            <p className="privacy-consent-note">
              Your information is used only for health-center services and authorized
              clinic operations. You can cancel now if you do not agree.
            </p>
            <div className="modal-actions">
              <button type="button" onClick={() => setShowConsent(false)} disabled={loading}>
                Cancel
              </button>
              <button type="button" onClick={handleConsent} disabled={loading} autoFocus>
                {loading ? "Creating Account..." : "I Agree & Create Account"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default Register;
