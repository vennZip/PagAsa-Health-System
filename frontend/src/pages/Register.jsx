import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

const S = {
  page: {
    minHeight: "100vh",
    display: "flex",
    background: "#f3f8fa",
  },
  panel: {
    flex: "0 0 380px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 36px",
    background: "#082f49",
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
    boxShadow: "0 18px 50px rgba(8,47,73,0.10)",
    padding: "36px 36px 28px",
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
    margin: "0 0 24px",
    fontSize: "14px",
    color: "#526b78",
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
  const fullNameInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
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

    try {
      setLoading(true);
      await register(
        formData.fullName,
        formData.email,
        formData.password
      );
      navigate("/dashboard", { replace: true });
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
                <label>Password</label>
                <input
                  ref={passwordInputRef}
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  minLength="6"
                  required
                />
              </div>

              <div>
                <label>Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  minLength="6"
                  required
                />
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

      <style>{`
        @media (max-width: 820px) {
          .auth-brand-panel { display: none !important; }
        }
      `}</style>
    </div>
  );
}

export default Register;
