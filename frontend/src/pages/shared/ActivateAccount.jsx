import apiFetch from "../../utils/apiFetch";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import logo from "../../assets/mylora-logo.png";
import "./ActivateAccount.css";

export default function ActivateAccount() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [validToken, setValidToken] = useState(false);
  const [userData, setUserData] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    // Verify token on page load
    apiFetch(`/api/activate/verify/${token}/`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Invalid or expired activation link");
        }
        return res.json();
      })
      .then((data) => {
        setValidToken(true);
        setUserData(data);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // Validate passwords
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
      const res = await apiFetch(`/api/activate/${token}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Account activation failed");
      }

      // Success
      setShowSuccessModal(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 500, margin: "4rem auto", textAlign: "center" }}>
        <p>Verifying activation link...</p>
      </div>
    );
  }

  if (!validToken) {
    return (
      <div style={{ maxWidth: 500, margin: "4rem auto", textAlign: "center" }}>
        <h2>Invalid Activation Link</h2>
        <p style={{ color: "red" }}>{error}</p>
        <p>This link may have expired or is invalid.</p>
      </div>
    );
  }

  /*return (
    <div style={{ maxWidth: 500, margin: "4rem auto" }}>
      <h1>Set Up Your Password</h1>
      <p>
        Welcome, <strong>{userData?.name}</strong>!
      </p>
      <p>Your credit account has been approved. Please create a password to complete your account setup.</p>

      <form onSubmit={handleSubmit} style={{ marginTop: "2rem" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem" }}>
            Email Address
          </label>
          <input
            type="email"
            value={userData?.email || ""}
            disabled
            style={{
              width: "100%",
              padding: "0.75rem",
              background: "#f5f5f5",
              border: "1px solid #ccc",
            }}
          />
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem" }}>
            Password *
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password (min 8 characters)"
            required
            style={{ width: "100%", padding: "0.75rem" }}
          />
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem" }}>
            Confirm Password *
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
            required
            style={{ width: "100%", padding: "0.75rem" }}
          />
        </div>

        {error && (
          <p style={{ color: "red", marginBottom: "1rem" }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{
            width: "100%",
            padding: "0.75rem",
            background: "#1f3d1a",
            color: "white",
            border: "none",
            cursor: submitting ? "not-allowed" : "pointer",
            fontSize: "1rem",
          }}
        >
          {submitting ? "Creating Account..." : "Create Account"}
        </button>
      </form>
    </div>
  );
}*/

return (
  <div className="activate-page-wrapper">
    <header className="logo-container">
      <img src={logo} alt="Mylora Logo" className="logo-img" />
      <span className="system-title">Web Credit System</span>
    </header>

    <div className="header-section">
      <h1 className="main-header">Secure your account.</h1>
      <p className="welcome-text">
        Welcome, <strong>{userData?.name}</strong>! <br />
          Your credit account has been approved. Please set up your password below
      </p>
    </div>
<div className="form-section">
    <form onSubmit={handleSubmit} className="activate-form">
      <div className="form-group">
        <label className="form-label">Email Address</label>
        <input type="email" className="form-input" value={userData?.email || ""} disabled />
      </div>

      <div className="form-group">
        <label className="form-label">Password</label>
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

      {error && (
        <p className="error-message">{error}</p>
      )}

      <button type="submit" className="btn-submit" disabled={submitting}>
        {submitting ? "Processing..." : "Set Password"}
      </button>
    </form>
  </div>

  {showSuccessModal && (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ backgroundColor: "white", border: "1px solid #262626", borderRadius: "15px", padding: "40px", maxWidth: "500px", width: "90%", textAlign: "center", fontFamily: "'Arimo', sans-serif" }}>
        <h2 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "15px" }}>Account Created</h2>
        <p style={{ fontSize: "16px", marginBottom: "30px", color: "#666" }}>
          Your account has been created successfully. You can now log in.
        </p>
        <button
          onClick={() => navigate("/login")}
          style={{ padding: "12px 40px", fontSize: "16px", fontWeight: "600", border: "none", borderRadius: "8px", backgroundColor: "#1E2D1A", color: "white", cursor: "pointer", fontFamily: "'Arimo', sans-serif" }}
        >
          Go to Login
        </button>
      </div>
    </div>
  )}
</div>
);
}