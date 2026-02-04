import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const getCookie = (name) => {
  const v = `; ${document.cookie}`;
  const parts = v.split(`; ${name}=`);
  return parts.length === 2 ? parts.pop().split(";").shift() : "";
};

export default function CreditApproval() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  
  // Override modal state
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [showOverrideSuccess, setShowOverrideSuccess] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:8000/api/cm/order/${orderId}/`, { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(setOrder)
      .catch(() => navigate("/credit-manager/dashboard"))
      .finally(() => setLoading(false));
  }, [orderId, navigate]);

  const needsOverride = () => {
    if (!order) return false;
    const totalAmount = parseFloat(order.total_amount);
    const availableCredit = parseFloat(order.available_credit);
    return totalAmount > availableCredit;
  };

  const postAction = async (action) => {
    // action = "approve" | "reject"
    setActing(true);
    try {
      const res = await fetch(
        `http://localhost:8000/api/cm/order/${orderId}/${action}/`,
        {
          method: "POST",
          credentials: "include",
          headers: { "X-CSRFToken": getCookie("csrftoken") },
        }
      );
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Something went wrong");
        return;
      }
      const data = await res.json();

      if (action === "approve") {
        navigate(`/credit-manager/approve/${orderId}/success`, {
          state: { order, ...data },
        });
      } else {
        navigate("/credit-manager/dashboard");
      }
    } catch (e) {
      alert("Request failed. Please try again.");
    } finally {
      setActing(false);
    }
  };

  const handleRequestOverride = () => {
    setShowOverrideModal(true);
    setOverrideReason("");
  };

  const submitOverrideRequest = async () => {
    if (!overrideReason.trim()) {
      alert("Please enter a reason for the override request");
      return;
    }

    setActing(true);
    try {
      const res = await fetch(
        `http://localhost:8000/api/cm/order/${orderId}/request-override/`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken"),
          },
          body: JSON.stringify({ reason: overrideReason }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to submit override request");
        return;
      }

      setShowOverrideModal(false);
      setShowOverrideSuccess(true);
    } catch (e) {
      alert("Request failed. Please try again.");
    } finally {
      setActing(false);
    }
  };

  if (loading) return <div style={styles.container}>Loading...</div>;
  if (!order) return null;

  const fmt = (n) =>
    parseFloat(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const requiresOverride = needsOverride();
  const exceedsBy = requiresOverride 
    ? parseFloat(order.total_amount) - parseFloat(order.available_credit)
    : 0;

  return (
    <div style={styles.container}>
      {/* header */}
      <div style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>🌾</span>
          <span style={styles.logoText}>Web Credit System</span>
        </div>
        <button style={styles.cancelBtn} onClick={() => navigate("/credit-manager/dashboard")}>
          Cancel
        </button>
      </div>

      <h1 style={styles.title}>ORDER ID XX{order.order_id}</h1>

      {/* ── Customer Information ── */}
      <h2 style={styles.subTitle}>Customer Information</h2>
      <div style={styles.infoGrid}>
        <div style={styles.infoGroup}>
          <label style={styles.infoLabel}>Name</label>
          <input style={styles.infoInput} readOnly value={order.customer_name} />
        </div>
        <div style={styles.infoRow}>
          <div style={styles.infoGroup}>
            <label style={styles.infoLabel}>Phone Number</label>
            <input style={styles.infoInput} readOnly value={order.phone || "—"} />
          </div>
          <div style={styles.infoGroup}>
            <label style={styles.infoLabel}>Email</label>
            <input style={styles.infoInput} readOnly value={order.email || "—"} />
          </div>
        </div>
      </div>

      {/* Warning if override needed */}
      {requiresOverride && (
        <div style={styles.warningBox}>
          <strong>WARNING!</strong>
          <br />
          ORDER XX{order.order_id} amounting to ₱ {fmt(order.total_amount)} is over the available
          credit limit. {order.customer_name} has insufficient credit balance.
        </div>
      )}

      {/* ── Order Form ── */}
      <h2 style={styles.subTitle}>Order Form</h2>
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
              <td colSpan={2} style={styles.totalLabel}>TOTAL</td>
              <td style={styles.totalValue}>₱ {fmt(order.total_amount)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p style={styles.submittedOn}>Order submitted on {order.date_submitted}</p>

      {/* ── Credit Details ── */}
      <h2 style={styles.subTitle}>Credit Details</h2>
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
              <td style={styles.td}>₱ {fmt(order.available_credit)}</td>
              <td style={styles.td}>₱ {fmt(order.credit_limit)}</td>
              <td style={{ ...styles.td, color: "#b03a2e", fontWeight: 700 }}>
                ₱ {fmt(order.outstanding_balance)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Action Buttons ── */}
      <div style={styles.actions}>
        <button
          style={styles.rejectBtn}
          disabled={acting}
          onClick={() => postAction("reject")}
        >
          Reject Order
        </button>
        {requiresOverride ? (
          <button
            style={styles.overrideBtn}
            disabled={acting}
            onClick={handleRequestOverride}
          >
            Request Override
          </button>
        ) : (
          <button
            style={styles.approveBtn}
            disabled={acting}
            onClick={() => postAction("approve")}
          >
            Approve Order
          </button>
        )}
      </div>

      {/* Override Request Modal */}
      {showOverrideModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>WARNING!</h3>
            <p style={styles.modalWarning}>
              ORDER XX{order.order_id} amounting to ₱ {fmt(order.total_amount)} is over the available
              credit limit. {order.customer_name} has insufficient credit balance.
            </p>
            <div style={styles.modalFormGroup}>
              <label style={styles.modalLabel}>Please enter reason for override:</label>
              <textarea
                style={styles.modalTextarea}
                placeholder="Enter reason here..."
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                rows={4}
              />
            </div>
            <div style={styles.modalActions}>
              <button
                style={styles.modalCancelBtn}
                onClick={() => setShowOverrideModal(false)}
                disabled={acting}
              >
                Cancel
              </button>
              <button
                style={styles.modalSubmitBtn}
                onClick={submitOverrideRequest}
                disabled={acting}
              >
                {acting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Override Success Modal */}
      {showOverrideSuccess && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.successTitle}>Override request submitted for review.</h3>
            <p style={styles.successMessage}>
              Reason for override:
              <br />
              {overrideReason}
            </p>
            <button
              style={styles.returnBtn}
              onClick={() => navigate("/credit-manager/dashboard")}
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: "2rem", maxWidth: "720px", margin: "0 auto" },

  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.75rem" },
  logo: { display: "flex", alignItems: "center", gap: "0.5rem" },
  logoIcon: { fontSize: "1.5rem" },
  logoText: { fontSize: "1.25rem", fontWeight: 500 },
  cancelBtn: {
    padding: "0.6rem 1.75rem", background: "#1f3d1a", color: "#fff",
    border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.9rem", fontWeight: 600,
  },

  title: { fontSize: "2rem", fontWeight: 700, marginBottom: "1.25rem" },
  subTitle: { fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.6rem", marginTop: "1.5rem" },

  warningBox: {
    background: "#fff3cd",
    border: "2px solid #ffc107",
    borderRadius: "6px",
    padding: "1rem",
    marginTop: "1rem",
    marginBottom: "1rem",
    color: "#856404",
    fontSize: "0.95rem",
    lineHeight: "1.5",
  },

  /* customer info */
  infoGrid: { display: "flex", flexDirection: "column", gap: "0.75rem" },
  infoRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" },
  infoGroup: { display: "flex", flexDirection: "column", gap: "0.3rem" },
  infoLabel: { fontSize: "0.82rem", fontWeight: 600, color: "#555" },
  infoInput: {
    padding: "0.65rem 0.75rem", border: "1px solid #ddd", borderRadius: "6px",
    fontSize: "0.95rem", background: "#fafafa", color: "#333",
  },

  /* tables */
  tableWrapper: { border: "1px solid #ccc", borderRadius: "8px", overflow: "hidden", marginBottom: "0.5rem" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    background: "#f5f5f5", padding: "0.7rem 1rem", textAlign: "left",
    borderBottom: "1px solid #ccc", fontWeight: 600, fontSize: "0.82rem", color: "#555",
  },
  td: { padding: "0.7rem 1rem", borderBottom: "1px solid #eee", fontSize: "0.95rem" },
  totalLabel: {
    padding: "0.7rem 1rem", fontWeight: 700, textAlign: "right",
    borderTop: "2px solid #333", color: "#333",
  },
  totalValue: { padding: "0.7rem 1rem", fontWeight: 700, borderTop: "2px solid #333" },

  submittedOn: { fontSize: "0.85rem", color: "#666", marginTop: "0.25rem" },

  /* action buttons */
  actions: { display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "2rem" },
  rejectBtn: {
    padding: "0.75rem 1.75rem", background: "#fff", color: "#333",
    border: "1px solid #ccc", borderRadius: "6px", cursor: "pointer",
    fontSize: "0.95rem", fontWeight: 600,
  },
  approveBtn: {
    padding: "0.75rem 1.75rem", background: "#1f3d1a", color: "#fff",
    border: "none", borderRadius: "6px", cursor: "pointer",
    fontSize: "0.95rem", fontWeight: 600,
  },
  overrideBtn: {
    padding: "0.75rem 1.75rem", background: "#1f3d1a", color: "#fff",
    border: "none", borderRadius: "6px", cursor: "pointer",
    fontSize: "0.95rem", fontWeight: 600,
  },

  /* Modal styles */
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
    maxWidth: "600px",
    width: "90%",
    padding: "2rem",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  },
  modalTitle: {
    fontSize: "1.5rem",
    fontWeight: 700,
    marginBottom: "1rem",
    color: "#d32f2f",
  },
  modalWarning: {
    fontSize: "1rem",
    lineHeight: "1.6",
    marginBottom: "1.5rem",
    color: "#555",
  },
  modalFormGroup: {
    marginBottom: "1.5rem",
  },
  modalLabel: {
    display: "block",
    fontWeight: 600,
    marginBottom: "0.5rem",
    fontSize: "0.95rem",
  },
  modalTextarea: {
    width: "100%",
    padding: "0.75rem",
    border: "1px solid #ccc",
    borderRadius: "6px",
    fontSize: "1rem",
    boxSizing: "border-box",
    resize: "vertical",
  },
  modalActions: {
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
  modalSubmitBtn: {
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