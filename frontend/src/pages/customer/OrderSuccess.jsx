import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function OrderSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const orderId = location.state?.orderId;
  const exceedsCredit = location.state?.exceedsCredit || false;

  useEffect(() => {
    if (!orderId) {
      navigate("/customer/dashboard");
    }
  }, [orderId, navigate]);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.iconWrapper}>
          <div style={styles.checkIcon}>✓</div>
        </div>

        <h1 style={styles.title}>Your purchase request has been sent!</h1>

        <p style={styles.message}>
          <strong>ORDER ID: XX{orderId}</strong>
        </p>

        {exceedsCredit ? (
          <>
            <p style={styles.warningText}>
              ⚠️ This order exceeds your available credit limit and requires override approval.
            </p>
            <p style={styles.description}>
              Your purchase request will be reviewed by management for credit limit override approval.
              You will be notified once a decision has been made.
            </p>
          </>
        ) : (
          <p style={styles.description}>
            Your purchase request has been sent to the office and will be reviewed shortly.
          </p>
        )}

        <p style={styles.description}>
          You may check the status of your order through your order history.
        </p>

        <div style={styles.actions}>
          <button
            onClick={() => navigate("/customer/dashboard")}
            style={styles.dashboardBtn}
          >
            Back to Dashboard
          </button>
          <button
            onClick={() => navigate("/orders")}
            style={styles.ordersBtn}
          >
            View Order History
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "70vh",
    padding: "2rem",
  },
  card: {
    background: "white",
    padding: "3rem",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    maxWidth: "600px",
    width: "100%",
    textAlign: "center",
  },
  iconWrapper: {
    marginBottom: "1.5rem",
  },
  checkIcon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "80px",
    height: "80px",
    background: "#1f3d1a",
    color: "white",
    fontSize: "3rem",
    borderRadius: "50%",
    fontWeight: "bold",
  },
  title: {
    fontSize: "1.75rem",
    fontWeight: "600",
    marginBottom: "1rem",
    color: "#333",
  },
  message: {
    fontSize: "1.125rem",
    marginBottom: "1rem",
    color: "#1f3d1a",
  },
  warningText: {
    fontSize: "1rem",
    marginBottom: "1rem",
    color: "#856404",
    background: "#fff3cd",
    padding: "0.75rem",
    borderRadius: "6px",
    border: "1px solid #ffc107",
  },
  description: {
    color: "#666",
    lineHeight: "1.6",
    marginBottom: "0.75rem",
  },
  actions: {
    display: "flex",
    gap: "1rem",
    justifyContent: "center",
    marginTop: "2rem",
  },
  dashboardBtn: {
    padding: "0.75rem 1.5rem",
    background: "#fff",
    border: "2px solid #1f3d1a",
    color: "#1f3d1a",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "500",
  },
  ordersBtn: {
    padding: "0.75rem 1.5rem",
    background: "#1f3d1a",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "500",
  },
};