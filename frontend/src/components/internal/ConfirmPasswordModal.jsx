import { useState } from "react";

export default function ConfirmPasswordModal({
  onConfirm,
  onCancel,
  loading,
  error,
}) {
  const [password, setPassword] = useState("");

  return (
    <div style={overlay}>
      <div style={modal}>
        <h3>Please enter your password to proceed.</h3>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", marginTop: "1rem" }}
        />

        {error && <p style={{ color: "red" }}>{error}</p>}

        <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem" }}>
          <button onClick={onCancel}>Cancel</button>
          <button
            onClick={() => onConfirm(password)}
            disabled={loading || !password}
          >
            {loading ? "Verifying..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modal = {
  background: "#fff",
  padding: "2rem",
  borderRadius: 8,
  width: 400,
};

