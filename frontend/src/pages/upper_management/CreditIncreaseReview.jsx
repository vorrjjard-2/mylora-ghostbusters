import { API_BASE_URL } from "../../utils/api";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCookie } from "../../utils/csrf";
import Sidebar from "../../components/internal/Sidebar";
import { handleLogout } from "../../utils/logout";
import logo from "../../assets/mylora-logo.png";
import "./Dashboard.css";

export default function CreditIncreaseReview() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  const [processing, setProcessing] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/um/credit-increase/${requestId}/`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load request");
        return res.json();
      })
      .then(setRequest)
      .catch((err) => {
        console.error(err);
        alert("Failed to load credit increase request");
        navigate("/upper-management/credit-changes");
      })
      .finally(() => setLoading(false));
  }, [requestId, navigate]);

  const initiateAction = (action) => {
    setPendingAction(action);
    setPassword("");
    setPasswordError("");
    setShowPasswordModal(true);
  };

  const handleCancelModal = () => {
    setShowPasswordModal(false);
    setPassword("");
    setPasswordError("");
    setPendingAction(null);
  };

  const handleConfirmAction = async () => {
    if (!password) {
      setPasswordError("Password is required.");
      return;
    }

    setProcessing(true);
    setPasswordError("");

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/um/credit-increase/${requestId}/${pendingAction}/`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken"),
          },
          body: JSON.stringify({ password }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.error || "An error occurred.");
        return;
      }

      setShowPasswordModal(false);
      setShowSuccessModal(true);
    } catch (err) {
      console.error(err);
      setPasswordError("An error occurred. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const fmt = (val) =>
    `₱ ${parseFloat(val).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (loading) {
    return (
      <div className="um-dashboard-wrapper">
        <div className="um-dashboard-body" style={{ display: "flex", flex: 1 }}>
          <Sidebar />
          <main className="um-dashboard-content">Loading...</main>
        </div>
      </div>
    );
  }

  if (!request) return null;

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
          <button
            onClick={() => navigate("/upper-management/credit-changes")}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: "15px", color: "#183112", fontWeight: "600",
              padding: "0", marginTop: "20px", marginBottom: "20px",
              display: "flex", alignItems: "center", gap: "6px",
            }}
          >
            ← Back
          </button>

          <h1 className="um-welcome-text">Credit Increase Request</h1>
          <p style={{ fontSize: "14px", color: "#888", marginBottom: "30px" }}>
            Submitted: {request.created_at}
          </p>

          {/* Details */}
          <div style={{
            backgroundColor: "white", border: "1px solid #262626",
            borderRadius: "15px", padding: "30px", marginBottom: "24px",
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
              <div>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#888", marginBottom: "4px" }}>CUSTOMER</div>
                <div style={{ fontSize: "17px", fontWeight: "600" }}>{request.customer_name}</div>
              </div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#888", marginBottom: "4px" }}>STATUS</div>
                <span style={{
                  backgroundColor: request.status === "PENDING" ? "#FFF3CD" : request.status === "APPROVED" ? "#D1E7DD" : "#F8D7DA",
                  color: request.status === "PENDING" ? "#856404" : request.status === "APPROVED" ? "#0F5132" : "#842029",
                  padding: "4px 12px", borderRadius: "6px", fontSize: "14px", fontWeight: "600",
                }}>
                  {request.status.charAt(0) + request.status.slice(1).toLowerCase()}
                </span>
              </div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#888", marginBottom: "4px" }}>CURRENT LIMIT</div>
                <div style={{ fontSize: "17px", fontWeight: "600" }}>{fmt(request.current_limit)}</div>
              </div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#888", marginBottom: "4px" }}>REQUESTED LIMIT</div>
                <div style={{ fontSize: "17px", fontWeight: "600", color: "#183112" }}>{fmt(request.requested_limit)}</div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: "13px", fontWeight: "600", color: "#888", marginBottom: "8px" }}>JUSTIFICATION</div>
              <div style={{
                backgroundColor: "#F9F9F9", border: "1px solid #E0E0E0",
                borderRadius: "8px", padding: "16px",
                fontSize: "15px", lineHeight: "1.6", color: "#333",
              }}>
                {request.justification}
              </div>
            </div>
          </div>

          {/* Action buttons — only show if pending */}
          {request.status === "PENDING" && (
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                onClick={() => initiateAction("reject")}
                disabled={processing}
                style={{
                  padding: "12px 40px", fontSize: "16px", fontWeight: "700",
                  backgroundColor: "white", color: "#842029",
                  border: "1.5px solid #842029", borderRadius: "10px", cursor: "pointer",
                }}
              >
                Reject
              </button>
              <button
                onClick={() => initiateAction("approve")}
                disabled={processing}
                style={{
                  padding: "12px 40px", fontSize: "16px", fontWeight: "700",
                  backgroundColor: "#183112", color: "white",
                  border: "none", borderRadius: "10px", cursor: "pointer",
                }}
              >
                Approve
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div style={modal.overlay}>
          <div style={modal.box}>
            <button style={modal.closeBtn} onClick={handleCancelModal}>&times;</button>
            <h3 style={modal.title}>
              {pendingAction === "approve" ? "Approve Credit Increase" : "Reject Credit Increase"}
            </h3>
            <p style={{ fontSize: "14px", color: "#555", marginBottom: "16px" }}>
              Please enter your password to confirm.
            </p>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setPasswordError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleConfirmAction(); }}
              placeholder="••••••••"
              style={modal.passwordInput}
            />
            {passwordError && (
              <div style={{
                backgroundColor: "#F8D7DA", color: "#842029",
                padding: "8px 12px", borderRadius: "6px",
                fontSize: "13px", marginBottom: "16px",
              }}>
                {passwordError}
              </div>
            )}
            <div style={modal.btnRow}>
              <button style={modal.cancelBtn} onClick={handleCancelModal} disabled={processing}>
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={processing}
                style={pendingAction === "reject" ? modal.rejectBtn : modal.approveBtn}
              >
                {processing ? "Processing..." : pendingAction === "reject" ? "Reject" : "Approve"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div style={modal.overlay}>
          <div style={{ ...modal.box, textAlign: "center" }}>
            <h3 style={{ fontSize: "22px", fontWeight: "700", marginBottom: "12px", color: "#183112" }}>
              {pendingAction === "approve" ? "Request Approved" : "Request Rejected"}
            </h3>
            <p style={{ fontSize: "15px", color: "#555", marginBottom: "28px", lineHeight: "1.6" }}>
              {pendingAction === "approve"
                ? "The credit limit has been updated and the customer has been notified."
                : "The request has been rejected and the customer has been notified."}
            </p>
            <button
              onClick={() => navigate("/upper-management/credit-changes")}
              style={{
                padding: "12px 32px", fontSize: "16px", fontWeight: "700",
                backgroundColor: "#183112", color: "white",
                border: "none", borderRadius: "10px", cursor: "pointer", width: "100%",
              }}
            >
              Return to Credit Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const modal = {
  overlay: {
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 2000,
  },
  box: {
    backgroundColor: "white", borderRadius: "12px",
    padding: "36px", width: "460px", maxWidth: "90vw",
    fontFamily: "'Arimo', sans-serif", position: "relative",
  },
  closeBtn: {
    position: "absolute", top: "12px", right: "14px",
    background: "none", border: "none", fontSize: "22px",
    cursor: "pointer", color: "#666", lineHeight: 1,
  },
  title: {
    fontSize: "18px", fontWeight: "700", marginBottom: "12px", marginTop: 0,
  },
  passwordInput: {
    width: "100%", padding: "10px 12px", fontSize: "15px",
    border: "1px solid #ccc", borderRadius: "6px",
    boxSizing: "border-box", marginBottom: "12px",
  },
  btnRow: {
    display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "8px",
  },
  cancelBtn: {
    padding: "10px 28px", fontSize: "15px", fontWeight: "600",
    border: "1px solid #ccc", borderRadius: "8px",
    backgroundColor: "white", cursor: "pointer",
  },
  approveBtn: {
    padding: "10px 28px", fontSize: "15px", fontWeight: "700",
    border: "none", borderRadius: "8px",
    backgroundColor: "#183112", color: "white", cursor: "pointer",
  },
  rejectBtn: {
    padding: "10px 28px", fontSize: "15px", fontWeight: "700",
    border: "none", borderRadius: "8px",
    backgroundColor: "#842029", color: "white", cursor: "pointer",
  },
};
