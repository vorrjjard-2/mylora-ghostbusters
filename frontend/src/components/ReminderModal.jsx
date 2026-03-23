import { useState, useEffect } from "react";
import apiFetch from "../utils/apiFetch";

export default function ReminderModal({ customerId, customerName, onClose }) {
  const [messages, setMessages] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(true);

  useEffect(() => {
    apiFetch("/api/um/reminder-messages/")
      .then((res) => res.json())
      .then((data) => setMessages(data))
      .catch(() => setError("Failed to load reminder messages"))
      .finally(() => setLoadingMessages(false));
  }, []);

  const handleSend = async () => {
    const selected = messages.find((m) => m.slot === selectedSlot);
    if (!selected) {
      setError("Please select a message.");
      return;
    }

    setSending(true);
    setError("");

    try {
      const res = await apiFetch(`/api/customer/${customerId}/send-reminder/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: selected.message }),
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

        {loadingMessages ? (
          <div style={{ padding: "20px", textAlign: "center", color: "#888" }}>Loading messages...</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
            {messages.map((m) => (
              <div
                key={m.slot}
                onClick={() => { setSelectedSlot(m.slot); setError(""); }}
                style={{
                  padding: "12px 16px",
                  border: selectedSlot === m.slot ? "2px solid #1E2D1A" : "1px solid #ccc",
                  borderRadius: "10px",
                  cursor: "pointer",
                  backgroundColor: selectedSlot === m.slot ? "#f0f4ef" : "white",
                  fontSize: "14px",
                  lineHeight: "1.5",
                  transition: "border-color 0.2s",
                }}
              >
                {m.message}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <button onClick={onClose} style={cancelBtn} disabled={sending}>Cancel</button>
          <button onClick={handleSend} style={primaryBtn} disabled={sending || loadingMessages}>
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
