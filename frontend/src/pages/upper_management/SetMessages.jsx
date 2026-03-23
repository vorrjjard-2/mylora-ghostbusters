import apiFetch from "../../utils/apiFetch";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { handleLogout } from "../../utils/logout";
import Sidebar from "../../components/internal/Sidebar";
import logo from "../../assets/mylora-logo.png";
import "../upper_management/Dashboard.css";

export default function SetMessages() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    { slot: 1, message: "" },
    { slot: 2, message: "" },
    { slot: 3, message: "" },
    { slot: 4, message: "" },
  ]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/api/um/reminder-messages/")
      .then((res) => res.json())
      .then((data) => setMessages(data))
      .catch(() => setError("Failed to load messages"))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (slot, value) => {
    setMessages((prev) =>
      prev.map((m) => (m.slot === slot ? { ...m, message: value } : m))
    );
    setSuccess("");
    setError("");
  };

  const handleSave = async () => {
    for (const m of messages) {
      if (!m.message.trim()) {
        setError(`Message ${m.slot} cannot be empty.`);
        return;
      }
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await apiFetch("/api/um/reminder-messages/update/", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      setSuccess("Reminder messages updated successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="um-dashboard-wrapper">
      <header className="um-header-section">
        <div className="um-brand-group">
          <img src={logo} alt="Mylora Logo" className="mylora-logo" />
          <span className="um-system-title">Web Credit System</span>
        </div>
        <div className="um-header-actions">
          <button className="um-logout-btn" onClick={() => handleLogout(navigate)}>
            Logout
          </button>
        </div>
      </header>

      <div className="um-dashboard-body" style={{ display: "flex", flex: 1 }}>
        <Sidebar />

        <main className="um-dashboard-content">
          <h1 className="um-welcome-text">Set Reminder Messages</h1>
          <p style={{ fontSize: "16px", color: "#666", marginBottom: "30px", marginTop: "-5px" }}>
            Configure the 4 default reminder messages that can be sent to customers.
          </p>

          {error && (
            <div style={{
              backgroundColor: "#F8D7DA", color: "#842029",
              padding: "12px 18px", borderRadius: "10px",
              marginBottom: "20px", fontSize: "14px",
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              backgroundColor: "#D1E7DD", color: "#0F5132",
              padding: "12px 18px", borderRadius: "10px",
              marginBottom: "20px", fontSize: "14px",
            }}>
              {success}
            </div>
          )}

          {loading ? (
            <div style={{ padding: "30px", textAlign: "center", color: "#888" }}>Loading...</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {messages.map((m) => (
                <div
                  key={m.slot}
                  style={{
                    backgroundColor: "white",
                    border: "1px solid #262626",
                    borderRadius: "15px",
                    padding: "20px 25px",
                  }}
                >
                  <label style={{
                    display: "block",
                    fontSize: "16px",
                    fontWeight: "700",
                    marginBottom: "10px",
                    color: "#262626",
                  }}>
                    Message {m.slot}
                  </label>
                  <textarea
                    value={m.message}
                    onChange={(e) => handleChange(m.slot, e.target.value)}
                    rows={1}
                    style={{
                      width: "100%",
                      padding: "12px",
                      fontSize: "14px",
                      border: "1px solid #ccc",
                      borderRadius: "8px",
                      resize: "vertical",
                      boxSizing: "border-box",
                      fontFamily: "'Arimo', sans-serif",
                      lineHeight: "1.5",
                      fieldSizing: "content",
                    }}
                  />
                </div>
              ))}

              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "30px" }}>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    padding: "10px 40px",
                    fontSize: "16px",
                    fontWeight: "600",
                    border: "none",
                    borderRadius: "10px",
                    backgroundColor: "#1E2D1A",
                    color: "white",
                    cursor: saving ? "not-allowed" : "pointer",
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? "Saving..." : "Save Messages"}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
