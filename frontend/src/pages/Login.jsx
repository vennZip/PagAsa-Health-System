import { useState } from "react";
import { useAuth } from "../context/useAuth";
import { useNavigate, Link } from "react-router-dom";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

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
        </div>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button type="submit" disabled={loading}>
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
