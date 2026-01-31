import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

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

  useEffect(() => {
    // Verify token on page load
    fetch(`http://localhost:8000/api/activate/verify/${token}/`)
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
      const res = await fetch(`http://localhost:8000/api/activate/${token}/`, {
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

      // Success - redirect to login
      alert("Account created successfully! You can now log in.");
      navigate("/login");
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

  return (
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
}