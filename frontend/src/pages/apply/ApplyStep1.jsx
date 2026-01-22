import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ApplyStep1() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);

  function handleNext(e) {
    e.preventDefault();
    setError(null);

    if (!email || !password || !confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // Save step 1 data
    localStorage.setItem(
      "application_step_1",
      JSON.stringify({
        email,
        password, // ⚠️ acceptable temporarily; later we hash on backend
      })
    );

    navigate("/apply/step-2");
  }

  return (
    <div style={{ maxWidth: 720, margin: "4rem auto" }}>
      <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>
        New user? Create an account.
      </h1>

      <p style={{ fontSize: "1.2rem", marginBottom: "2rem" }}>
        Set up your account
      </p>

      <form onSubmit={handleNext}>
        <div style={{ marginBottom: "1.5rem" }}>
          <label>Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: "0.75rem" }}
            required
          />
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label>Password</label>
          <small style={{ display: "block", marginBottom: "0.25rem" }}>
            Minimum of 8 characters
          </small>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: "0.75rem" }}
            required
          />
        </div>

        <div style={{ marginBottom: "2rem" }}>
          <label>Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={{ width: "100%", padding: "0.75rem" }}
            required
          />
        </div>

        {error && (
          <p style={{ color: "red", marginBottom: "1rem" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "0.9rem",
            background: "#1f3d1b",
            color: "white",
            border: "none",
            fontSize: "1rem",
            cursor: "pointer",
          }}
        >
          Create Account
        </button>
      </form>
    </div>
  );
}
