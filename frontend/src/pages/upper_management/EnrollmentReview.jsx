import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Sidebar from "../../components/internal/Sidebar";
import logo from "../../assets/mylora-logo.png";
import { getCookie } from "../../utils/csrf";
import ConfirmPasswordModal from "../../components/internal/ConfirmPasswordModal";

import { MEDIA_BASE_URL } from "../../utils/media";

import { useNavigate } from "react-router-dom";

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

  useEffect(() => {
    fetch(`http://localhost:8000/api/enrollments/${applicationId}/`, {
      credentials: "include"
    })
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
    setPendingAction(action);
    setShowModal(true);
    setError("");
  }

  function handleConfirm(password) {
    setLoading(true);
    setError("");
    
    fetch(`http://localhost:8000/api/enrollments/${applicationId}/${pendingAction}/`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie("csrftoken"),
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
      .then(() => {
        setActionResult(pendingAction);
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

  function handleCancel() {
    setShowModal(false);
    setPendingAction(null);
    setError("");
  }

  if (!data) return <p>Loading…</p>;

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#FCFCFC" }}>
      <Sidebar />

      <main style={{ flex: 1, padding: "2rem" }}>
        {/* Header */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          marginBottom: "2rem"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <img src={logo} alt="Mylora Logo" style={{ height: "50px" }} />
            <span style={{ fontSize: "32px", fontWeight: "700", color: "#395A31" }}>
              Web Credit System
            </span>
          </div>
          <button 
            onClick={() => navigate("/login")}
            style={{
              background: "white",
              border: "1.3px solid #183112",
              color: "#183112",
              padding: "6px 30px",
              borderRadius: "10px",
              fontWeight: "600",
              fontSize: "20px",
              cursor: "pointer"
            }}
          >
            Logout
          </button>
        </div>

        <h1 style={{ fontSize: "48px", fontWeight: "700", marginBottom: "2rem" }}>
          Enrolment Requests
        </h1>

        <div style={{ 
          backgroundColor: "white",
          border: "1px solid #262626",
          borderRadius: "15px",
          padding: "30px",
          marginBottom: "20px"
        }}>
          <h2 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "20px" }}>
            {data.first_name} {data.last_name}
          </h2>

          <h3 style={{ fontSize: "18px", fontWeight: "600", marginTop: "20px", marginBottom: "10px" }}>
            01 Personal Information
          </h3>
          <p>Email: {data.email}</p>
          <p>Phone: {data.phone_number}</p>

          <h3 style={{ fontSize: "18px", fontWeight: "600", marginTop: "20px", marginBottom: "10px" }}>
            02 Delivery Address
          </h3>
          <p>{data.address1}</p>
          <p>{data.address2}</p>
          <p>{data.barangay}, {data.city}, {data.zipcode}</p>

          <h3 style={{ fontSize: "18px", fontWeight: "600", marginTop: "20px", marginBottom: "10px" }}>
            03 Credit Line Application
          </h3>
          <p>Amount: {data.credit_amt_request}</p>
          <p>Term: {data.credit_term_request} days</p>

          <h3 style={{ fontSize: "18px", fontWeight: "600", marginTop: "20px", marginBottom: "10px" }}>
            04 Supporting Documents
          </h3>
          {data.doc1_file && (
            <a
              href={`${MEDIA_BASE_URL}${data.doc1_file}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "block", marginBottom: "10px", color: "#1f3d1a" }}
            >
              Document 1
            </a>
          )}
          {data.doc2_file && (
            <a
              href={`${MEDIA_BASE_URL}${data.doc2_file}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "block", color: "#1f3d1a" }}
            >
              Document 2
            </a>
          )}

          <h3 style={{ fontSize: "18px", fontWeight: "600", marginTop: "20px", marginBottom: "10px" }}>
            05 Government-issued ID
          </h3>
          {data.gov_id && (
            <a
              href={`${MEDIA_BASE_URL}${data.gov_id}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#1f3d1a" }}
            >
              View ID
            </a>
          )}

          <div style={{ marginTop: "2rem", display: "flex", gap: "15px" }}>
            <button
              onClick={() => handleActionClick("reject")}
              style={{
                padding: "12px 24px",
                fontSize: "16px",
                fontWeight: "600",
                border: "none",
                borderRadius: "8px",
                backgroundColor: "#b03a2e",
                color: "white",
                cursor: "pointer"
              }}
            >
              Reject
            </button>

            <button
              onClick={() => handleActionClick("approve")}
              style={{
                padding: "12px 24px",
                fontSize: "16px",
                fontWeight: "600",
                border: "none",
                borderRadius: "8px",
                backgroundColor: "#1E2D1A",
                color: "white",
                cursor: "pointer"
              }}
            >
              Accept
            </button>
          </div>
        </div>
        
        {showModal && (
          <ConfirmPasswordModal
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            loading={loading}
            error={error}
          />
        )}

        {showSuccessModal && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: "white",
              border: "1px solid #262626",
              borderRadius: "15px",
              padding: "40px",
              maxWidth: "500px",
              textAlign: "center"
            }}>
              <h2 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "15px" }}>
                {actionResult === "approve" ? "Account Approved" : "Account Rejected"}
              </h2>
              <p style={{ fontSize: "16px", marginBottom: "30px", color: "#666" }}>
                Customer account for {data.first_name} {data.last_name} has been {actionResult === "approve" ? "approved" : "rejected"}.
              </p>
              <button
                onClick={() => navigate("/upper-management/dashboard")}
                style={{
                  padding: "12px 40px",
                  fontSize: "16px",
                  fontWeight: "600",
                  border: "none",
                  borderRadius: "8px",
                  backgroundColor: "#1E2D1A",
                  color: "white",
                  cursor: "pointer"
                }}
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}