import apiFetch from "../../utils/apiFetch";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../../components/internal/Sidebar";
import logo from "../../assets/mylora-logo.png";
import { handleLogout } from "../../utils/logout";
import ConfirmPasswordModal from "../../components/internal/ConfirmPasswordModal";
import { MEDIA_BASE_URL } from "../../utils/media";
import "../upper_management/Dashboard.css";

export default function EnrollmentReview() {
  const { applicationId } = useParams();
  const [data, setData] = useState(null);
  const [actionResult, setActionResult] = useState(null);
  const navigate = useNavigate();
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // "approve" or "reject"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Reject modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectReasonError, setRejectReasonError] = useState("");
  const [rejectPassword, setRejectPassword] = useState("");
  const [rejectPasswordError, setRejectPasswordError] = useState("");

  // File preview modal
  const [filePreview, setFilePreview] = useState(null); // { url, label, type }

  async function openFilePreview(rawUrl, label) {
    try {
      const res = await fetch(rawUrl, { credentials: "include" });
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      setFilePreview({ url: blobUrl, label, type: blob.type });
    } catch (err) {
      console.error("Failed to load file", err);
    }
  }

  function closeFilePreview() {
    if (filePreview?.url) URL.revokeObjectURL(filePreview.url);
    setFilePreview(null);
  }

  useEffect(() => {
    apiFetch(`/api/enrollments/${applicationId}/`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to load enrollment: ${res.status}`);
        }
        return res.json();
      })
      .then(setData)
      .catch(err => {
        console.error("Error loading enrollment:", err);
        alert(err.message);
      });
  }, [applicationId]);

  function handleActionClick(action) {
    if (action === "reject") {
      setRejectReason("");
      setRejectReasonError("");
      setRejectPassword("");
      setRejectPasswordError("");
      setShowRejectModal(true);
      return;
    }
    setPendingAction(action);
    setShowModal(true);
    setError("");
  }

  function handleConfirm(password) {
    setLoading(true);
    setError("");

    apiFetch(`/api/enrollments/${applicationId}/${pendingAction}/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password }),
    })
      .then(res => {
        if (!res.ok) {
          return res.json().then(data => {
            throw new Error(data.error || "Action failed");
          });
        }
        return res.json();
      })
      .then((responseData) => {
        setActionResult({ action: pendingAction, ...responseData });
        setShowModal(false);
        setShowSuccessModal(true);
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  function handleRejectSubmit() {
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

    setLoading(true);
    setRejectPasswordError("");

    apiFetch(`/api/enrollments/${applicationId}/reject/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password: rejectPassword, rejection_reason: rejectReason.trim() }),
    })
      .then(res => {
        if (!res.ok) {
          return res.json().then(d => { throw new Error(d.error || "Action failed"); });
        }
        return res.json();
      })
      .then((responseData) => {
        setActionResult({ action: "reject", ...responseData });
        setShowRejectModal(false);
        setShowSuccessModal(true);
      })
      .catch(err => {
        setRejectPasswordError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  function handleCancel() {
    setShowModal(false);
    setShowRejectModal(false);
    setPendingAction(null);
    setError("");
  }

  if (!data) return <p>Loading…</p>;

  return (
    <div className="um-dashboard-wrapper">
      <header className="um-header-section">
        <div className="um-brand-group">
          <img src={logo} alt="Mylora Logo" className="mylora-logo" />
          <span className="um-system-title">Web Credit System</span>
        </div>
        <div className="um-header-actions">
          <button className="um-logout-btn" onClick={() => handleLogout(navigate)}>Logout</button>
        </div>
      </header>

      <div className="um-dashboard-body" style={{ display: "flex", flex: 1 }}>
        <Sidebar />

        <main className="um-dashboard-content">
          <h1 className="um-welcome-text">Enrollment Request</h1>

          <div style={{
            backgroundColor: "white",
            border: "1px solid #262626",
            borderRadius: "15px",
            padding: "30px",
            marginBottom: "20px"
          }}>
            <h2 style={{ fontSize: "28px", fontWeight: "700", marginBottom: "24px" }}>
              {data.first_name} {data.last_name}
            </h2>

            {/* 01 Personal Information */}
            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#555", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              01 Personal Information
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px", paddingBottom: "24px", borderBottom: "1px solid #e0e0e0" }}>
              <div>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#888", marginBottom: "4px" }}>Email</div>
                <div style={{ fontSize: "16px" }}>{data.email}</div>
              </div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#888", marginBottom: "4px" }}>Phone</div>
                <div style={{ fontSize: "16px" }}>{data.phone_number}</div>
              </div>
            </div>

            {/* 02 Delivery Address */}
            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#555", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              02 Delivery Address
            </h3>
            <div style={{ marginBottom: "24px", paddingBottom: "24px", borderBottom: "1px solid #e0e0e0" }}>
              <div style={{ fontSize: "16px", marginBottom: "4px" }}>{data.address1}</div>
              {data.address2 && <div style={{ fontSize: "16px", marginBottom: "4px" }}>{data.address2}</div>}
              <div style={{ fontSize: "16px" }}>{data.barangay}, {data.city}, {data.zipcode}</div>
            </div>

            {/* 03 Credit Line Application */}
            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#555", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              03 Credit Line Application
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px", paddingBottom: "24px", borderBottom: "1px solid #e0e0e0" }}>
              <div>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#888", marginBottom: "4px" }}>Requested Amount</div>
                <div style={{ fontSize: "16px" }}>₱ {parseFloat(data.credit_amt_request).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</div>
              </div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#888", marginBottom: "4px" }}>Credit Term</div>
                <div style={{ fontSize: "16px" }}>{data.credit_term_request} days</div>
              </div>
            </div>

            {/* 04 Supporting Documents */}
            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#555", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              04 Supporting Documents
            </h3>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "24px", paddingBottom: "24px", borderBottom: "1px solid #e0e0e0" }}>
              {data.doc1_file && (
                <button
                  onClick={() => openFilePreview(`${MEDIA_BASE_URL}${data.doc1_file}`, "Document 1")}
                  style={{ padding: "8px 20px", border: "1px solid #262626", borderRadius: "8px", color: "#1f3d1a", fontWeight: "600", fontSize: "14px", background: "white", cursor: "pointer" }}
                >
                  Document 1 ↗
                </button>
              )}
              {data.doc2_file && (
                <button
                  onClick={() => openFilePreview(`${MEDIA_BASE_URL}${data.doc2_file}`, "Document 2")}
                  style={{ padding: "8px 20px", border: "1px solid #262626", borderRadius: "8px", color: "#1f3d1a", fontWeight: "600", fontSize: "14px", background: "white", cursor: "pointer" }}
                >
                  Document 2 ↗
                </button>
              )}
            </div>

            {/* 05 Government-issued ID */}
            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#555", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              05 Government-Issued ID
            </h3>
            <div style={{ marginBottom: "32px" }}>
              {data.gov_id ? (
                <button
                  onClick={() => openFilePreview(`${MEDIA_BASE_URL}${data.gov_id}`, "Government-Issued ID")}
                  style={{ padding: "8px 20px", border: "1px solid #262626", borderRadius: "8px", color: "#1f3d1a", fontWeight: "600", fontSize: "14px", background: "white", cursor: "pointer" }}
                >
                  View ID ↗
                </button>
              ) : (
                <span style={{ color: "#888", fontSize: "14px" }}>No ID uploaded</span>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => handleActionClick("reject")}
                style={{ padding: "12px 32px", fontSize: "16px", fontWeight: "600", border: "1.5px solid #b03a2e", borderRadius: "8px", backgroundColor: "white", color: "#b03a2e", cursor: "pointer" }}
              >
                Reject
              </button>
              <button
                onClick={() => handleActionClick("approve")}
                style={{ padding: "12px 32px", fontSize: "16px", fontWeight: "600", border: "none", borderRadius: "8px", backgroundColor: "#1E2D1A", color: "white", cursor: "pointer" }}
              >
                Accept
              </button>
            </div>
          </div>
        </main>
      </div>

      {filePreview && (
        <div
          onClick={closeFilePreview}
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ backgroundColor: "white", borderRadius: "15px", width: "80vw", maxWidth: "900px", height: "85vh", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "'Arimo', sans-serif" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", borderBottom: "1px solid #e0e0e0" }}>
              <span style={{ fontWeight: "700", fontSize: "16px" }}>{filePreview.label}</span>
              <button
                onClick={closeFilePreview}
                style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#555", lineHeight: 1 }}
              >
                ×
              </button>
            </div>
            {filePreview.type.startsWith("image/") ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", overflow: "auto" }}>
                <img src={filePreview.url} alt={filePreview.label} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
              </div>
            ) : (
              <embed src={filePreview.url} type="application/pdf" style={{ flex: 1, width: "100%" }} />
            )}
          </div>
        </div>
      )}

      {showModal && (
        <ConfirmPasswordModal
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          loading={loading}
          error={error}
        />
      )}

      {showRejectModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0, 0, 0, 0.5)",
          display: "flex", justifyContent: "center", alignItems: "center",
          zIndex: 1000,
        }}>
          <div style={{
            background: "#fff", borderRadius: "15px", border: "1px solid #262626",
            maxWidth: "500px", width: "90%", padding: "2rem",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)", fontFamily: "'Arimo', sans-serif",
          }}>
            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px", color: "#1E2D1A" }}>
              Reject Enrollment
            </h3>
            <p style={{ fontSize: "14px", color: "#666", marginBottom: "20px" }}>
              Please provide a reason and enter your password to proceed.
            </p>

            <label style={{ fontSize: "14px", fontWeight: 600, color: "#333", marginBottom: "4px", display: "block" }}>
              Reason for Rejection
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => { setRejectReason(e.target.value); setRejectReasonError(""); }}
              placeholder="Enter reason for rejection..."
              autoFocus
              rows={3}
              style={{
                width: "100%", padding: "10px 14px", fontSize: "15px",
                border: "1px solid #262626", borderRadius: "8px",
                fontFamily: "'Arimo', sans-serif", boxSizing: "border-box",
                resize: "vertical", marginBottom: rejectReasonError ? "0.5rem" : "1rem",
                outline: "none",
              }}
            />
            {rejectReasonError && (
              <p style={{ color: "#b03a2e", fontSize: "13px", marginBottom: "1rem" }}>{rejectReasonError}</p>
            )}

            <label style={{ fontSize: "14px", fontWeight: 600, color: "#333", marginBottom: "4px", display: "block" }}>
              Password
            </label>
            <input
              type="password"
              value={rejectPassword}
              onChange={(e) => { setRejectPassword(e.target.value); setRejectPasswordError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleRejectSubmit()}
              placeholder="••••••••••"
              style={{
                width: "100%", padding: "10px 14px", fontSize: "15px",
                border: "1px solid #262626", borderRadius: "8px",
                fontFamily: "'Arimo', sans-serif", boxSizing: "border-box",
                outline: "none", marginBottom: rejectPasswordError ? "0.5rem" : "1.5rem",
              }}
            />
            {rejectPasswordError && (
              <p style={{ color: "#b03a2e", fontSize: "13px", marginBottom: "1rem" }}>{rejectPasswordError}</p>
            )}

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={handleCancel}
                disabled={loading}
                style={{
                  padding: "10px 24px", fontSize: "15px", fontWeight: 600,
                  fontFamily: "'Arimo', sans-serif", border: "1.5px solid #262626",
                  borderRadius: "8px", backgroundColor: "white", color: "#262626", cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={loading}
                style={{
                  padding: "10px 24px", fontSize: "15px", fontWeight: 600,
                  fontFamily: "'Arimo', sans-serif", border: "none", borderRadius: "8px",
                  backgroundColor: loading ? "#888" : "#b03a2e", color: "white",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Rejecting..." : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "white", border: "1px solid #262626", borderRadius: "15px", padding: "40px", maxWidth: "500px", width: "90%", textAlign: "center", fontFamily: "'Arimo', sans-serif" }}>
            <h2 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "15px", fontFamily: "'Arimo', sans-serif" }}>
              {actionResult?.action === "approve" ? "Account Approved" : "Account Rejected"}
            </h2>
            <p style={{ fontSize: "16px", marginBottom: actionResult?.activation_link ? "16px" : "30px", color: "#666", fontFamily: "'Arimo', sans-serif" }}>
              Customer account for {data.first_name} {data.last_name} has been {actionResult?.action === "approve" ? "approved" : "rejected"}.
            </p>
            {actionResult?.action === "approve" && (
              <p style={{ fontSize: "14px", marginBottom: "16px", color: actionResult?.email_sent ? "#2e7d32" : "#b03a2e", fontWeight: 600 }}>
                {actionResult?.email_sent
                  ? `Activation email sent to ${data.email}`
                  : `Failed to send email: ${actionResult?.email_error || "Unknown error"}`}
              </p>
            )}
            {actionResult?.activation_link && (
              <div style={{ marginBottom: "24px", textAlign: "left", background: "#f5f5f5", borderRadius: "8px", padding: "16px" }}>
                <p style={{ fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: "#333" }}>Activation Link:</p>
                <input
                  type="text"
                  readOnly
                  value={actionResult.activation_link}
                  onClick={(e) => e.target.select()}
                  style={{ width: "100%", padding: "8px", fontSize: "13px", border: "1px solid #ccc", borderRadius: "4px", boxSizing: "border-box", fontFamily: "monospace" }}
                />
                <p style={{ fontSize: "12px", color: "#888", marginTop: "8px" }}>Click to select, then copy. This link expires in 24 hours.</p>
              </div>
            )}
            <button
              onClick={() => navigate("/upper-management/dashboard")}
              style={{ padding: "12px 40px", fontSize: "16px", fontWeight: "600", fontFamily: "'Arimo', sans-serif", border: "none", borderRadius: "8px", backgroundColor: "#1E2D1A", color: "white", cursor: "pointer" }}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}