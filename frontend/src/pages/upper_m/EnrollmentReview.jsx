import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Sidebar from "../../components/internal/Sidebar";
import { getCookie } from "../../utils/csrf";

export default function EnrollmentReview() {
  const { applicationId } = useParams();
  const [data, setData] = useState(null);
  const [actionResult, setActionResult] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:8000/api/enrollments/${applicationId}/`)
      .then(res => res.json())
      .then(setData);
  }, [applicationId]);

function handleAction(action) {
    fetch(`http://localhost:8000/api/enrollments/${applicationId}/${action}/`, {
    method: "POST",
    credentials: "include",
    headers: {
    "X-CSRFToken": getCookie("csrftoken"),
    },
    })
    .then(res => {
    if (!res.ok) throw new Error("Action failed");
    return res.json();
    })
    .then(() => setActionResult(action))
    .catch(err => alert(err.message));
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
        <a href={data.doc1_file} target="_blank">Document 1</a><br />
        <a href={data.doc2_file} target="_blank">Document 2</a>

        <h3>05 Government-issued ID</h3>
        <a href={data.gov_id} target="_blank">View ID</a>

        <div style={{ marginTop: "2rem" }}>
          <button
            style={{ background: "#b03a2e", marginRight: 10 }}
            onClick={() => handleAction("reject")}
          >
            Reject
          </button>

          <button
            style={{ background: "#1f3d1a", color: "white" }}
            onClick={() => handleAction("approve")}
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
      </main>
    </div>
  );
}