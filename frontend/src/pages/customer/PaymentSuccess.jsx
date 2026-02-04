import { useNavigate } from "react-router-dom";

export default function PaymentSuccess() {
  const navigate = useNavigate();

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.modalContent}>
          <h2 style={styles.title}>Balance payment has been sent!</h2>
          <p style={styles.message}>
            Your payment has been sent and will be reviewed for verification. 
            Your credit balance will automatically update once payment has been verified.
          </p>
          <button
            style={styles.button}
            onClick={() => navigate("/customer/dashboard")}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modal: {
    background: "#fff",
    borderRadius: "8px",
    maxWidth: "500px",
    width: "90%",
    padding: "2rem",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  },
  modalContent: {
    textAlign: "center",
  },
  title: {
    fontSize: "1.5rem",
    fontWeight: 700,
    marginBottom: "1rem",
  },
  message: {
    fontSize: "1rem",
    color: "#555",
    lineHeight: "1.6",
    marginBottom: "2rem",
  },
  button: {
    padding: "0.75rem 2rem",
    background: "#1f3d1a",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: 600,
    width: "100%",
  },
};