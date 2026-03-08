import { useState } from "react";
import { API_BASE_URL } from "../utils/api";
import { getCookie } from "../utils/csrf";

const DEFAULT_MESSAGES = [
  "This is a reminder that your credit balance is overdue. Please settle your outstanding balance at your earliest convenience.",
  "Your credit term is approaching its due date. Please make a payment to avoid service interruption.",
  "Your account has an outstanding balance that requires immediate attention. Please contact us or make a payment.",
  "Friendly reminder: Your payment is past due. Please update your credit balance to continue using our services.",
];

export default function ReminderModal({ customerId, customerName, onClose }) {
  const [selectedDefault, setSelectedDefault] = useState(null);
  const [customMessage, setCustomMessage] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSend = async () => {
    const message = useCustom ? customMessage.trim() : (selectedDefault !== null ? DEFAULT_MESSAGES[selectedDefault] : "");
    if (!message) {
      setError("Please select or write a message.");
      return;
    }

    setSending(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/customer/${customerId}/send-reminder/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify({ message }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send reminder");
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  if (success) {
    return (
      <div onClick={onClose} style={overlay}>
        <div onClick={(e) => e.stopPropagation()} style={modalBox}>
          <h2 style={{ fontSize: "24px", fontWeight: "700", marginTop: 0, marginBottom: "15px", color: "#262626", textAlign: "center" }}>
            Reminder Sent
          </h2>
          <p style={{ fontSize: "16px", color: "#666", textAlign: "center", marginBottom: "25px" }}>
            A reminder has been sent to <strong>{customerName}</strong>. They will see it upon their next login.
          </p>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <button onClick={onClose} style={primaryBtn}>Done</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div onClick={onClose} style={overlay}>
      <div onClick={(e) => e.stopPropagation()} style={{ ...modalBox, maxHeight: "85vh", overflowY: "auto" }}>
        <h2 style={{ fontSize: "24px", fontWeight: "700", marginTop: 0, marginBottom: "5px", color: "#262626" }}>
          Send Reminder
        </h2>
        <p style={{ fontSize: "14px", color: "#888", marginBottom: "20px" }}>
          To: <strong>{customerName}</strong>
        </p>

        {error && (
          <div style={{ backgroundColor: "#F8D7DA", color: "#842029", padding: "10px 15px", borderRadius: "8px", marginBottom: "15px", fontSize: "14px" }}>
            {error}
          </div>
        )}

        {/* Toggle between default and custom */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <button
            onClick={() => { setUseCustom(false); setError(""); }}
            style={{
              flex: 1, padding: "10px", fontSize: "14px", fontWeight: "600",
              border: !useCustom ? "2px solid #1E2D1A" : "1px solid #ccc",
              borderRadius: "8px", backgroundColor: !useCustom ? "#f0f4ef" : "white",
              cursor: "pointer", color: "#262626"
            }}
          >
            Default Messages
          </button>
          <button
            onClick={() => { setUseCustom(true); setSelectedDefault(null); setError(""); }}
            style={{
              flex: 1, padding: "10px", fontSize: "14px", fontWeight: "600",
              border: useCustom ? "2px solid #1E2D1A" : "1px solid #ccc",
              borderRadius: "8px", backgroundColor: useCustom ? "#f0f4ef" : "white",
              cursor: "pointer", color: "#262626"
            }}
          >
            Custom Message
          </button>
        </div>

        {!useCustom ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
            {DEFAULT_MESSAGES.map((msg, i) => (
              <div
                key={i}
                onClick={() => { setSelectedDefault(i); setError(""); }}
                style={{
                  padding: "12px 16px",
                  border: selectedDefault === i ? "2px solid #1E2D1A" : "1px solid #ccc",
                  borderRadius: "10px",
                  cursor: "pointer",
                  backgroundColor: selectedDefault === i ? "#f0f4ef" : "white",
                  fontSize: "14px",
                  lineHeight: "1.5",
                  transition: "border-color 0.2s",
                }}
              >
                {msg}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ marginBottom: "20px" }}>
            <textarea
              value={customMessage}
              onChange={(e) => { setCustomMessage(e.target.value); setError(""); }}
              placeholder="Type your custom reminder message..."
              rows={5}
              style={{
                width: "100%", padding: "12px", fontSize: "14px",
                border: "1px solid #262626", borderRadius: "8px",
                resize: "vertical", boxSizing: "border-box",
                fontFamily: "'Arimo', sans-serif", lineHeight: "1.5",
              }}
            />
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <button onClick={onClose} style={cancelBtn} disabled={sending}>Cancel</button>
          <button onClick={handleSend} style={primaryBtn} disabled={sending}>
            {sending ? "Sending..." : "Send Reminder"}
          </button>
        </div>
      </div>
    </div>
  );
}

const overlay = {
  position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: "rgba(0,0,0,0.5)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 1000,
};

const modalBox = {
  backgroundColor: "white", borderRadius: "15px",
  padding: "35px", width: "550px", maxWidth: "90vw",
  fontFamily: "'Arimo', sans-serif",
};

const primaryBtn = {
  padding: "10px 24px", fontSize: "16px", fontWeight: "600",
  border: "none", borderRadius: "8px",
  backgroundColor: "#1E2D1A", color: "white", cursor: "pointer",
};

const cancelBtn = {
  padding: "10px 24px", fontSize: "16px", fontWeight: "600",
  border: "1px solid #262626", borderRadius: "8px",
  backgroundColor: "white", cursor: "pointer",
};
