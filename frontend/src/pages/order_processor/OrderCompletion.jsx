import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCookie } from "../../utils/csrf";

export default function OrderCompletion() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [password, setPassword] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:8000/api/op/order/${orderId}/`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load order");
        return res.json();
      })
      .then(setOrder)
      .catch((err) => {
        console.error(err);
        alert("Failed to load order details");
        navigate("/order-processor/dashboard");
      })
      .finally(() => setLoading(false));
  }, [orderId, navigate]);

  const handleMarkComplete = () => {
    setShowPasswordModal(true);
  };

  const handleConfirmComplete = async () => {
    if (!password) {
      alert("Please enter your password");
      return;
    }

    setProcessing(true);
    const csrfToken = getCookie("csrftoken");

    try {
      const response = await fetch(
        `http://localhost:8000/api/op/order/${orderId}/complete/`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
          },
          body: JSON.stringify({ password }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to complete order");
      }

      setShowPasswordModal(false);
      setShowSuccessModal(true);
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to complete order");
    } finally {
      setProcessing(false);
      setPassword("");
    }
  };

  if (loading) {
    return <div style={styles.container}>Loading...</div>;
  }

  if (!order) {
    return <div style={styles.container}>Order not found</div>;
  }

  const fmt = (n) =>
    parseFloat(n).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>🌾</span>
          <span style={styles.logoText}>Web Credit System</span>
        </div>
      </div>

      <h1 style={styles.title}>ORDER ID XX{order.order_id}</h1>
      <p style={styles.dateSubmitted}>DATE SUBMITTED: {order.date_submitted}</p>

      {/* Customer Info */}
      <div style={styles.section}>
        <div style={styles.infoRow}>
          <div style={styles.infoGroup}>
            <label style={styles.label}>Customer:</label>
            <span>{order.customer_name}</span>
          </div>
          <div style={styles.infoGroup}>
            <label style={styles.label}>Phone:</label>
            <span>{order.phone || "N/A"}</span>
          </div>
        </div>
      </div>

      {/* Order Form */}
      <h3 style={styles.sectionTitle}>Order Form</h3>
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ITEM</th>
              <th style={styles.th}>QUANTITY</th>
              <th style={styles.th}>AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => (
              <tr key={i}>
                <td style={styles.td}>{item.name}</td>
                <td style={styles.td}>{item.quantity}</td>
                <td style={styles.td}>₱ {fmt(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2} style={styles.totalLabel}>
                TOTAL
              </td>
              <td style={styles.totalValue}>₱ {fmt(order.total_amount)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Delivery Details */}
      <h3 style={styles.sectionTitle}>Delivery Details</h3>
      <div style={styles.addressBox}>
        {order.shipping_address && (
          <>
            <div>{order.shipping_address}</div>
            {order.delivery_mode && <div>Delivery Mode: {order.delivery_mode}</div>}
          </>
        )}
      </div>

      <p style={styles.approvalNote}>
        Order approved {order.approval_date}.
        <br />
        Approved by: {order.approved_by}
      </p>

      {/* Action Buttons */}
      <div style={styles.actions}>
        <button
          style={styles.backBtn}
          onClick={() => navigate("/order-processor/dashboard")}
        >
          Back
        </button>
        <button style={styles.completeBtn} onClick={handleMarkComplete}>
          ⊙ Mark as Completed
        </button>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>Please enter user password to proceed.</h3>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••"
              style={styles.passwordInput}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConfirmComplete();
              }}
            />
            <div style={styles.modalButtonRow}>
              <button
                style={styles.modalCancelBtn}
                onClick={() => {
                  setShowPasswordModal(false);
                  setPassword("");
                }}
                disabled={processing}
              >
                Cancel
              </button>
              <button
                style={styles.modalConfirmBtn}
                onClick={handleConfirmComplete}
                disabled={processing}
              >
                {processing ? "Processing..." : "Mark as Completed"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.successIcon}>✓</div>
            <h3 style={styles.successTitle}>Completed</h3>
            <p style={styles.successMessage}>
              Order has been marked as completed.
            </p>
            <button
              style={styles.returnBtn}
              onClick={() => navigate("/order-processor/dashboard")}
            >
              Return to dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "2rem",
    maxWidth: "800px",
    margin: "0 auto",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2rem",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  logoIcon: {
    fontSize: "1.5rem",
  },
  logoText: {
    fontSize: "1.25rem",
    fontWeight: 500,
  },
  title: {
    fontSize: "2rem",
    fontWeight: 700,
    marginBottom: "0.5rem",
  },
  dateSubmitted: {
    fontSize: "0.9rem",
    color: "#666",
    marginBottom: "1.5rem",
  },
  section: {
    marginBottom: "1.5rem",
  },
  infoRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1rem",
  },
  infoGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  label: {
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#555",
  },
  sectionTitle: {
    fontSize: "1.1rem",
    fontWeight: 600,
    marginBottom: "0.75rem",
    marginTop: "1.5rem",
  },
  tableWrapper: {
    border: "1px solid #ccc",
    borderRadius: "8px",
    overflow: "hidden",
    marginBottom: "0.5rem",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    background: "#f5f5f5",
    padding: "0.7rem 1rem",
    textAlign: "left",
    borderBottom: "1px solid #ccc",
    fontWeight: 600,
    fontSize: "0.82rem",
    color: "#555",
  },
  td: {
    padding: "0.7rem 1rem",
    borderBottom: "1px solid #eee",
    fontSize: "0.95rem",
  },
  totalLabel: {
    padding: "0.7rem 1rem",
    fontWeight: 700,
    textAlign: "right",
    borderTop: "2px solid #333",
    color: "#333",
  },
  totalValue: {
    padding: "0.7rem 1rem",
    fontWeight: 700,
    borderTop: "2px solid #333",
  },
  addressBox: {
    padding: "1rem",
    border: "1px solid #ccc",
    borderRadius: "6px",
    background: "#f9f9f9",
    marginBottom: "1rem",
    lineHeight: "1.6",
  },
  approvalNote: {
    fontSize: "0.85rem",
    color: "#666",
    marginBottom: "2rem",
  },
  actions: {
    display: "flex",
    gap: "1rem",
    justifyContent: "flex-end",
  },
  backBtn: {
    padding: "0.75rem 2rem",
    background: "#fff",
    border: "1px solid #ccc",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem",
  },
  completeBtn: {
    padding: "0.75rem 2rem",
    background: "#1f3d1a",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: 600,
  },
  modalOverlay: {
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
  modalTitle: {
    fontSize: "1.25rem",
    fontWeight: 600,
    marginBottom: "1.5rem",
    textAlign: "center",
  },
  passwordInput: {
    width: "100%",
    padding: "0.75rem",
    border: "1px solid #ccc",
    borderRadius: "6px",
    fontSize: "1rem",
    boxSizing: "border-box",
    marginBottom: "1.5rem",
  },
  modalButtonRow: {
    display: "flex",
    gap: "1rem",
    justifyContent: "flex-end",
  },
  modalCancelBtn: {
    padding: "0.75rem 2rem",
    background: "#fff",
    border: "1px solid #ccc",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem",
  },
  modalConfirmBtn: {
    padding: "0.75rem 2rem",
    background: "#1f3d1a",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: 600,
  },
  successIcon: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    background: "#1f3d1a",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "3rem",
    margin: "0 auto 1.5rem",
  },
  successTitle: {
    fontSize: "1.5rem",
    fontWeight: 700,
    marginBottom: "1rem",
    textAlign: "center",
  },
  successMessage: {
    fontSize: "1rem",
    color: "#555",
    lineHeight: "1.6",
    marginBottom: "2rem",
    textAlign: "center",
  },
  returnBtn: {
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