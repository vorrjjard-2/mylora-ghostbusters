import { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiFetch from "../../utils/apiFetch";
import logo from "../../assets/mylora-logo.png";
import "./ActivateAccount.css";

export default function SetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const auth = JSON.parse(localStorage.getItem("auth") || "{}");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setSubmitting(true);

    try {
      const res = await apiFetch("/api/customer/force-set-password/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_password: password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to set password");
      }

      const data = await res.json();

      // Update the stored token with the new one
      if (data.token) {
        localStorage.setItem("authToken", data.token);
      }

      // Clear the flag and navigate to dashboard
      const updatedAuth = { ...auth, must_change_password: false };
      localStorage.setItem("auth", JSON.stringify(updatedAuth));
      navigate("/customer/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="activate-page-wrapper">
      <header className="logo-container">
        <img src={logo} alt="Mylora Logo" className="logo-img" />
        <span className="system-title">Web Credit System</span>
      </header>

      <div className="header-section">
        <h1 className="main-header">Set your password.</h1>
        <p className="welcome-text">
          Welcome, <strong>{auth.username}</strong>! <br />
          Please create a new password to secure your account.
        </p>
      </div>

      <div className="form-section">
        <form onSubmit={handleSubmit} className="activate-form">
          <div className="form-group">
            <label className="form-label">New Password</label>
            <p className="input-hint">Minimum of 8 characters</p>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              type="password"
              className="form-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="btn-submit" disabled={submitting}>
            {submitting ? "Processing..." : "Set Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
