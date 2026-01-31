import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getCookie } from "../../../utils/csrf";
import "./Login.css";
import logo from "../../../assets/mylora-logo.png";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1️⃣ Login
      const res = await fetch("http://localhost:8000/api/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        credentials: "include",
        body: JSON.stringify({
          username,
          password,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Login failed");
      }

      // 2️⃣ Get logged-in user + roles
      const meRes = await fetch("http://localhost:8000/api/me/", {
        credentials: "include",
      });

      if (!meRes.ok) {
        throw new Error("Failed to fetch user info");
      }

      const me = await meRes.json();

      if (me.roles.includes("upper_management")) {
        navigate("/internal/dashboard");
      } else if (me.roles.includes("credit")) {
        navigate("/credit_manager/dashboard");
      } else if (me.roles.includes("order")) {
        navigate("/order_processor/dashboard");
      } else {
        navigate("/customer/dashboard");
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page-container">
      <div className="login-card">
        <div className="logo-section">
          <img src={logo} alt="Mylora Logo" className="mylora-logo" />
        </div>

        <h1 className="system-title">Web Credit System</h1>

        <form onSubmit={handleSubmit} className="mylora-form">
          <div className="input-group">
            <label>Email</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>

          <Link to="/apply/step-1" className="enrol-link-btn">
            Enrol for a credit account
          </Link>
        </form>
      </div>
    </div>
  );
}