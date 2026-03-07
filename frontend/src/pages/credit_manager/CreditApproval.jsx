import { API_BASE_URL } from "../../utils/api";
import { getCookie } from "../../utils/csrf";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import logo from "../../assets/mylora-logo.png";
import "./CreditApproval.css";

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

  // Password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [approvalPassword, setApprovalPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Reject password modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectPassword, setRejectPassword] = useState("");
  const [rejectPasswordError, setRejectPasswordError] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [rejectReasonError, setRejectReasonError] = useState("");

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/cm/order/${orderId}/`, { credentials: "include" })
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

  const postAction = async (action, password = null, rejectionReason = null) => {
    // action = "approve" | "reject"
    setActing(true);
    try {
      const payload = {};
      if (password) payload.password = password;
      if (rejectionReason) payload.rejection_reason = rejectionReason;
      const body = Object.keys(payload).length > 0 ? JSON.stringify(payload) : undefined;
      const res = await fetch(
        `${API_BASE_URL}/api/cm/order/${orderId}/${action}/`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "X-CSRFToken": getCookie("csrftoken"),
            ...(body ? { "Content-Type": "application/json" } : {}),
          },
          body,
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

  const handleApproveClick = () => {
    setApprovalPassword("");
    setPasswordError("");
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = async () => {
    if (!approvalPassword.trim()) {
      setPasswordError("Password is required.");
      return;
    }
    setShowPasswordModal(false);
    await postAction("approve", approvalPassword);
  };

  const handleRejectClick = () => {
    setRejectPassword("");
    setRejectPasswordError("");
    setRejectReason("");
    setRejectReasonError("");
    setShowRejectModal(true);
  };

  const handleRejectPasswordSubmit = async () => {
    let hasError = false;
    if (rejectReason.trim().split(/\s+/).length < 5) {
      setRejectReasonError("Please provide at least 5 words for the rejection reason.");
      hasError = true;
    }
    if (!rejectPassword.trim()) {
      setRejectPasswordError("Password is required.");
      hasError = true;
    }
    if (hasError) return;
    setShowRejectModal(false);
    await postAction("reject", rejectPassword, rejectReason.trim());
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
        `${API_BASE_URL}/api/cm/order/${orderId}/request-override/`,
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

  if (loading) return <div className="approval-container">Loading...</div>;
  if (!order) return null;

  const fmt = (n) =>
    parseFloat(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const requiresOverride = needsOverride();
  const exceedsBy = requiresOverride 
    ? parseFloat(order.total_amount) - parseFloat(order.available_credit)
    : 0;

  return (
    <div className="approval-container">
      {/* HEADER */}
      <header className="approval-header-section">
        <div className="approval-brand-group">
          <img src={logo} alt="Mylora Logo" className="mylora-logo" />
          <span className="approval-system-title">Web Credit System</span>
        </div>
        <button className="cancel-btn" onClick={() => navigate("/credit-manager/dashboard")}>
          Cancel
        </button>
      </header>

      <main className="approval-content">

      <h1 className="approval-title">ORDER ID {order.order_id}</h1>

      {/* Customer Information */}
      <h2 className="approval-subtitle">Customer Information</h2>
      <div className="info-grid">
        <div className="info-group">
          <label className="info-label">Name</label>
          <input className="info-input-name" readOnly value={order.customer_name} />
        </div>
        <div className="info-row">
          <div className="info-group">
            <label className="info-label">Phone Number</label>
            <input className="info-input" readOnly value={order.phone || "—"} />
          </div>
          <div className="info-group">
            <label className="info-label">Email</label>
            <input className="info-input" readOnly value={order.email || "—"} />
          </div>
        </div>
      </div>

      {/* Warning if override needed */}
      {requiresOverride && (
        <div className="credit-warning-box">
          <strong>WARNING!</strong>
          <br />
          ORDER {order.order_id} amounting to ₱ {fmt(order.total_amount)} is over the available
          credit limit. {order.customer_name} has insufficient credit balance.
        </div>
      )}

      {/* Order Form */}
      <h2 className="approval-subtitle">Order Form</h2>
      <div className="table-wrapper">
        <table className="approval-table">
          <thead>
            <tr>
              <th className="approval-th">ITEM</th>
              <th className="approval-th">QUANTITY</th>
              <th className="approval-th">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => (
              <tr key={i}>
                <td className="approval-td">{item.name}</td>
                <td className="approval-td">{item.quantity}</td>
                <td className="approval-td">₱ {fmt(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2} className="total-label">TOTAL</td>
              <td className="total-value">₱ {fmt(order.total_amount)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="submitted-date">Order submitted on {order.date_submitted}</p>

      {/* Credit Details */}
      <h2 className="approval-subtitle">Credit Details</h2>
      <div className="table-wrapper">
        <table className="approval-table">
          <thead>
            <tr>
              <th className="approval-th">AVAILABLE CREDIT</th>
              <th className="approval-th">CREDIT LIMIT</th>
              <th className="approval-th">OUTSTANDING BALANCE</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="approval-td">₱ {fmt(order.available_credit)}</td>
              <td className="approval-td">₱ {fmt(order.credit_limit)}</td>
              <td className="approval-td" style={{ color: "#b03a2e", fontWeight: 700 }}>
                ₱ {fmt(order.outstanding_balance)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Rejection Reason (for already-rejected orders) */}
      {order.order_status === "REJECTED" && order.rejection_reason && (
        <>
          <h2 className="approval-subtitle">Reason for Rejection</h2>
          <div style={{ padding: "1rem", border: "1px solid #e0e0e0", borderRadius: "6px", background: "#fdf2f2", lineHeight: "1.6", color: "#842029", marginBottom: "1.5rem" }}>
            {order.rejection_reason}
          </div>
          {order.rejected_by && (
            <p style={{ fontSize: "0.85rem", color: "#666", marginBottom: "1.5rem" }}>
              Rejected by: {order.rejected_by} {order.rejection_date ? `on ${order.rejection_date}` : ""}
            </p>
          )}
        </>
      )}

      {/* Action Buttons */}
      <div className="approval-actions">
        <button
          className="reject-btn"
          disabled={acting}
          onClick={handleRejectClick}
        >
          Reject Order
        </button>
        {requiresOverride ? (
          <button
            className="override-trigger-btn"
            disabled={acting}
            onClick={handleRequestOverride}
          >
            Request Override
          </button>
        ) : (
          <button
            className="approve-btn"
            disabled={acting}
            onClick={handleApproveClick}
          >
            Approve Order
          </button>
        )}
      </div>

      {/* Password Approval Modal */}
      {showPasswordModal && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000,
        }}>
          <div style={{
            background: "#fff",
            borderRadius: "8px",
            maxWidth: "500px",
            width: "90%",
            padding: "2rem",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            fontFamily: "'Arimo', sans-serif",
            position: "relative",
          }}>
            <button
              onClick={() => setShowPasswordModal(false)}
              style={{
                position: "absolute", top: "0.75rem", right: "0.75rem",
                background: "none", border: "none", fontSize: "1.5rem",
                cursor: "pointer", color: "#666", lineHeight: 1, padding: "0.25rem",
              }}
            >
              &times;
            </button>
            <h3 style={{
              fontSize: "1.25rem",
              fontWeight: 600,
              marginBottom: "1.5rem",
              textAlign: "center",
              color: "#1E2D1A",
            }}>
              Please enter your password to approve ORDER {order.order_id}.
            </h3>
            <input
              type="password"
              value={approvalPassword}
              onChange={(e) => { setApprovalPassword(e.target.value); setPasswordError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handlePasswordSubmit()}
              placeholder="••••••••••"
              autoFocus
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #ccc",
                borderRadius: "6px",
                fontSize: "1rem",
                boxSizing: "border-box",
                marginBottom: passwordError ? "0.5rem" : "1.5rem",
              }}
            />
            {passwordError && (
              <p style={{ color: "#b03a2e", fontSize: "13px", marginBottom: "1rem" }}>{passwordError}</p>
            )}
            <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowPasswordModal(false)}
                disabled={acting}
                style={{
                  padding: "0.75rem 2rem",
                  background: "#fff",
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "1rem",
                  fontFamily: "'Arimo', sans-serif",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordSubmit}
                disabled={acting}
                style={{
                  padding: "0.75rem 2rem",
                  background: "#1f3d1a",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: acting ? "not-allowed" : "pointer",
                  fontSize: "1rem",
                  fontWeight: 600,
                  fontFamily: "'Arimo', sans-serif",
                }}
              >
                {acting ? "Approving..." : "Approve"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Reject Modal */}
      {showRejectModal && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000,
        }}>
          <div style={{
            background: "#fff",
            borderRadius: "8px",
            maxWidth: "500px",
            width: "90%",
            padding: "2rem",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            fontFamily: "'Arimo', sans-serif",
            position: "relative",
          }}>
            <button
              onClick={() => setShowRejectModal(false)}
              style={{
                position: "absolute", top: "0.75rem", right: "0.75rem",
                background: "none", border: "none", fontSize: "1.5rem",
                cursor: "pointer", color: "#666", lineHeight: 1, padding: "0.25rem",
              }}
            >
              &times;
            </button>
            <h3 style={{
              fontSize: "1.25rem",
              fontWeight: 600,
              marginBottom: "1.5rem",
              textAlign: "center",
              color: "#1E2D1A",
            }}>
              Please enter your password to reject ORDER {order.order_id}.
            </h3>
            <label style={{ fontSize: "0.9rem", fontWeight: 600, color: "#333", marginBottom: "0.25rem", display: "block" }}>
              Reason for Rejection
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => { setRejectReason(e.target.value); setRejectReasonError(""); }}
              placeholder="Enter reason for rejection..."
              autoFocus
              rows={3}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #ccc",
                borderRadius: "6px",
                fontSize: "1rem",
                boxSizing: "border-box",
                fontFamily: "'Arimo', sans-serif",
                resize: "vertical",
                marginBottom: rejectReasonError ? "0.5rem" : "1rem",
              }}
            />
            {rejectReasonError && (
              <p style={{ color: "#b03a2e", fontSize: "13px", marginBottom: "1rem" }}>{rejectReasonError}</p>
            )}
            <label style={{ fontSize: "0.9rem", fontWeight: 600, color: "#333", marginBottom: "0.25rem", display: "block" }}>
              Password
            </label>
            <input
              type="password"
              value={rejectPassword}
              onChange={(e) => { setRejectPassword(e.target.value); setRejectPasswordError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleRejectPasswordSubmit()}
              placeholder="••••••••••"
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #ccc",
                borderRadius: "6px",
                fontSize: "1rem",
                boxSizing: "border-box",
                marginBottom: rejectPasswordError ? "0.5rem" : "1.5rem",
              }}
            />
            {rejectPasswordError && (
              <p style={{ color: "#b03a2e", fontSize: "13px", marginBottom: "1rem" }}>{rejectPasswordError}</p>
            )}
            <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowRejectModal(false)}
                disabled={acting}
                style={{
                  padding: "0.75rem 2rem",
                  background: "#fff",
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "1rem",
                  fontFamily: "'Arimo', sans-serif",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleRejectPasswordSubmit}
                disabled={acting}
                style={{
                  padding: "0.75rem 2rem",
                  background: "#b03a2e",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: acting ? "not-allowed" : "pointer",
                  fontSize: "1rem",
                  fontWeight: 600,
                  fontFamily: "'Arimo', sans-serif",
                }}
              >
                {acting ? "Rejecting..." : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Override Request Modal */}
      {showOverrideModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ position: "relative" }}>
            <button
              onClick={() => setShowOverrideModal(false)}
              style={{
                position: "absolute", top: "0.75rem", right: "0.75rem",
                background: "none", border: "none", fontSize: "1.5rem",
                cursor: "pointer", color: "#666", lineHeight: 1, padding: "0.25rem",
              }}
            >
              &times;
            </button>
            <h3 className="modal-title-warning">WARNING!</h3>
              <p className="modal-text-body">
                <span className="text-bold">ORDER {order.order_id}</span> amounting to{" "}
                <span className="text-bold">₱ {fmt(order.total_amount)}</span> is over the available 
                credit limit. {order.customer_name} has{" "}
                <span className="text-warning-bold">insufficient credit balance</span>.
              </p>
            <div className="info-group">
              <label className="info-label">Please enter reason for override:</label>
              <textarea
                className="modal-textarea"
                placeholder="Enter reason here..."
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                rows={4}
              />
            </div>
            <div className="modal-button-row">
              <button
                className="reject-btn"
                onClick={() => setShowOverrideModal(false)}
                disabled={acting}
              >
                Cancel
              </button>
              <button
                className="modal-submit-btn"
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
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 className="modal-success-title" style={{textAlign: 'center'}}>Override request submitted.</h3>
            <p className="modal-text-body-success">
              Reason for override:
              <br />
              <strong>{overrideReason}</strong>
            </p>
            <button
              className="success-return-btn"
              onClick={() => navigate("/credit-manager/dashboard")}
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      )}
      </main>
    </div>
  );
};