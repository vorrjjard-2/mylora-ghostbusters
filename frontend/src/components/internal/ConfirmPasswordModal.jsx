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
        <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "8px", color: "#1E2D1A" }}>
          Confirm Action
        </h3>
        <p style={{ fontSize: "14px", color: "#666", marginBottom: "20px" }}>
          Please enter your password to proceed.
        </p>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••••"
          aria-label="Enter password"
          autoComplete="current-password"
          onKeyDown={(e) => { if (e.key === "Enter" && password) onConfirm(password); }}
          style={{
            width: "100%",
            padding: "10px 14px",
            fontSize: "15px",
            border: "1px solid #262626",
            borderRadius: "8px",
            fontFamily: "'Arimo', sans-serif",
            boxSizing: "border-box",
            outline: "2px solid transparent",
          }}
        />

        {error && (
          <p style={{ color: "#b03a2e", fontSize: "13px", marginTop: "8px" }}>{error}</p>
        )}

        <div style={{ marginTop: "24px", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: "10px 24px",
              fontSize: "15px",
              fontWeight: "600",
              fontFamily: "'Arimo', sans-serif",
              border: "1.5px solid #262626",
              borderRadius: "8px",
              backgroundColor: "white",
              color: "#262626",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(password)}
            disabled={loading || password.length < 8}
            style={{
              padding: "10px 24px",
              fontSize: "15px",
              fontWeight: "600",
              fontFamily: "'Arimo', sans-serif",
              border: "none",
              borderRadius: "8px",
              backgroundColor: loading || password.length < 8 ? "#888" : "#1E2D1A",
              color: "white",
              cursor: loading || password.length < 8 ? "not-allowed" : "pointer",
            }}
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
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modal = {
  background: "#fff",
  padding: "32px",
  borderRadius: "15px",
  border: "1px solid #262626",
  width: "420px",
  fontFamily: "'Arimo', sans-serif",
  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
};
