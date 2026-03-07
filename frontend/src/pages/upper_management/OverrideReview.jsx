import { API_BASE_URL } from "../../utils/api";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCookie } from "../../utils/csrf";

export default function OverrideReview() {
  const { overrideId } = useParams();
  const navigate = useNavigate();
  const [override, setOverride] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [password, setPassword] = useState("");
  const [pendingAction, setPendingAction] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/um/override/${overrideId}/`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load override request");
        return res.json();
      })
      .then(setOverride)
      .catch((err) => {
        console.error(err);
        alert("Failed to load override request details");
        navigate("/upper-management/dashboard");
      })
      .finally(() => setLoading(false));
  }, [overrideId, navigate]);

  const initiateAction = (action) => {
    setPendingAction(action);
    setShowPasswordModal(true);
    setPassword("");
  };

  const handleConfirmAction = async () => {
    if (!password) {
      alert("Please enter your password");
      return;
    }

    setProcessing(true);
    const csrfToken = getCookie("csrftoken");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/um/override/${overrideId}/${pendingAction}/`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
          },
          body: JSON.stringify({
            password,
            ...(pendingAction === "reject" && { rejection_reason: rejectionReason }),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${pendingAction} override`);
      }

      setShowPasswordModal(false);
      setShowSuccessModal(true);
    } catch (err) {
      console.error(err);
      alert(err.message || `Failed to ${pendingAction} override request`);
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelPasswordModal = () => {
    setShowPasswordModal(false);
    setPassword("");
    setRejectionReason("");
    setPendingAction(null);
  };

  if (loading) {
    return <div style={styles.container}>Loading...</div>;
  }

  if (!override) {
    return <div style={styles.container}>Override request not found</div>;
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

      {/* Title */}
      <h1 style={styles.title}>ORDER ID {override.order_id}</h1>
      <p style={styles.dateSubmitted}>DATE SUBMITTED: {override.date_submitted}</p>

      {/* Customer Info */}
      <div style={styles.section}>
        <div style={styles.infoRow}>
          <div style={styles.infoGroup}>
            <label style={styles.label}>Customer:</label>
            <span>{override.customer_name}</span>
          </div>
          <div style={styles.infoGroup}>
            <label style={styles.label}>Phone:</label>
            <span>{override.phone || "N/A"}</span>
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
            {override.items.map((item, i) => (
              <tr key={i}>
                <td style={styles.td}>{item.name}</td>
                <td style={styles.td}>{item.quantity}</td>
                <td style={styles.td}>₱ {fmt(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2} style={styles.totalLabel}>TOTAL</td>
              <td style={styles.totalValue}>₱ {fmt(override.total_amount)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p style={styles.orderSubmitted}>Order submitted on {override.order_date_submitted}</p>

      {/* Credit Details */}
      <h3 style={styles.sectionTitle}>Credit Details</h3>
      <p style={styles.asOf}>As of {override.date_submitted}</p>
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>AVAILABLE CREDIT</th>
              <th style={styles.th}>CREDIT LIMIT</th>
              <th style={styles.th}>OUTSTANDING BALANCE</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={styles.td}>₱ {fmt(override.available_credit)}</td>
              <td style={styles.td}>₱ {fmt(override.credit_limit)}</td>
              <td style={{ ...styles.td, color: "#b03a2e", fontWeight: 700 }}>
                ₱ {fmt(override.outstanding_balance)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Reason for Override */}
      <h3 style={styles.sectionTitle}>Reason for Credit Override</h3>
      <div style={styles.reasonBox}>
        {override.reason}
      </div>

      {/* Action Buttons */}
      <div style={styles.actions}>
        <button
          style={styles.rejectBtn}
          onClick={() => initiateAction("reject")}
          disabled={processing}
        >
          Reject
        </button>
        <button
          style={styles.approveBtn}
          onClick={() => initiateAction("approve")}
          disabled={processing}
        >
          Approve
        </button>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <button
              style={styles.modalCloseBtn}
              onClick={handleCancelPasswordModal}
            >
              &times;
            </button>
            <h3 style={styles.modalTitle}>Please enter user password to proceed.</h3>
            {pendingAction === "reject" && (
              <>
                <label style={styles.reasonLabel}>Reason for Rejection</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejecting this override request (at least 5 words)..."
                  style={styles.reasonTextarea}
                  rows={4}
                />
              </>
            )}
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••"
              style={styles.passwordInput}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConfirmAction();
              }}
            />
            <div style={styles.modalButtonRow}>
              <button
                style={styles.modalCancelBtn}
                onClick={handleCancelPasswordModal}
                disabled={processing}
              >
                Cancel
              </button>
              <button
                style={pendingAction === "reject" ? styles.modalRejectBtn : styles.modalConfirmBtn}
                onClick={handleConfirmAction}
                disabled={processing}
              >
                {processing ? "Processing..." : pendingAction === "reject" ? "Reject" : "Approve"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.successTitle}>
              {pendingAction === "approve" ? "Override approved!" : "Override rejected"}
            </h3>
            <p style={styles.successMessage}>
              {pendingAction === "approve"
                ? "Credit override request has been approved and order has been approved."
                : "Credit override request has been rejected."}
            </p>
            <button
              style={styles.returnBtn}
              onClick={() => navigate("/upper-management/dashboard")}
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
  orderSubmitted: {
    fontSize: "0.85rem",
    color: "#666",
    marginTop: "0.25rem",
  },
  asOf: {
    fontSize: "0.85rem",
    color: "#666",
    marginBottom: "0.5rem",
  },
  reasonBox: {
    padding: "1rem",
    border: "1px solid #ccc",
    borderRadius: "6px",
    background: "#f9f9f9",
    marginBottom: "2rem",
    lineHeight: "1.6",
  },
  actions: {
    display: "flex",
    gap: "1rem",
    justifyContent: "flex-end",
  },
  rejectBtn: {
    padding: "0.75rem 2rem",
    background: "#fff",
    border: "1px solid #ccc",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem",
  },
  approveBtn: {
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
    position: "relative",
  },
  modalCloseBtn: {
    position: "absolute",
    top: "0.75rem",
    right: "0.75rem",
    background: "none",
    border: "none",
    fontSize: "1.5rem",
    cursor: "pointer",
    color: "#666",
    lineHeight: 1,
    padding: "0.25rem",
  },
  modalTitle: {
    fontSize: "1.25rem",
    fontWeight: 600,
    marginBottom: "1.5rem",
    textAlign: "center",
  },
  reasonLabel: {
    fontSize: "0.9rem",
    fontWeight: 600,
    marginBottom: "0.5rem",
    display: "block",
    color: "#333",
  },
  reasonTextarea: {
    width: "100%",
    padding: "0.75rem",
    border: "1px solid #ccc",
    borderRadius: "6px",
    fontSize: "1rem",
    boxSizing: "border-box",
    marginBottom: "1rem",
    resize: "vertical",
    fontFamily: "inherit",
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
  modalRejectBtn: {
    padding: "0.75rem 2rem",
    background: "#b03a2e",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: 600,
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

