import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

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
    <div className="auth-page"><div className="auth-card">
      <h1>Barangay Pag-Asa Health Center</h1>
      <p>Create a patient account to access health center services.</p>

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

        {error && <p style={{ color: "red" }}>{error}</p>}
        {success && <p style={{ color: "green" }}>{success}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>

        <p>
          Already have an account? <Link to="/login">Return to login</Link>
        </p>
      </form>
    </div></div>
  );
}

export default Register;
