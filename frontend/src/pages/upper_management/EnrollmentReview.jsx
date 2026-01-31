import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Sidebar from "../../components/internal/Sidebar";
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
        setShowModal(false);
        navigate("/upper-management/dashboard");
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
    <div style={{ display: "flex" }}>
      <Sidebar />

      <main style={{ padding: "2rem", width: "100%" }}>
        <h1>{data.first_name} {data.last_name}</h1>

        <h3>01 Personal Information</h3>
        <p>Email: {data.email}</p>
        <p>Phone: {data.phone_number}</p>

        <h3>02 Delivery Address</h3>
        <p>{data.address1}</p>
        <p>{data.address2}</p>
        <p>{data.barangay}, {data.city}, {data.zipcode}</p>

        <h3>03 Credit Line Application</h3>
        <p>Amount: {data.credit_amt_request}</p>
        <p>Term: {data.credit_term_request} days</p>

    <h3>04 Supporting Documents</h3>
    {data.doc1_file && (
      <a
        href={`${MEDIA_BASE_URL}${data.doc1_file}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        Document 1
      </a>
    )}
    <br />
    {data.doc2_file && (
      <a
        href={`${MEDIA_BASE_URL}${data.doc2_file}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        Document 2
      </a>
    )}

    <h3>05 Government-issued ID</h3>
    {data.gov_id && (
      <a
        href={`${MEDIA_BASE_URL}${data.gov_id}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        View ID
      </a>
    )}

        <div style={{ marginTop: "2rem" }}>
          <button
            style={{ background: "#b03a2e", marginRight: 10 }}
            onClick={() => handleActionClick("reject")}
          >
            Reject
          </button>

          <button
            style={{ background: "#1f3d1a", color: "white" }}
            onClick={() => handleActionClick("approve")}
          >
            Accept
          </button>
        </div>

        {actionResult && (
          <div style={{
            marginTop: "2rem",
            padding: "2rem",
            border: "1px solid #ccc",
            borderRadius: 8
          }}>
            <h2>
              {actionResult === "approve"
                ? "Account Approved"
                : "Account Rejected"}
            </h2>
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
      </main>
    </div>
  );
}