import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../../components/internal/Sidebar";
import logo from "../../assets/mylora-logo.png";
import "./Dashboard.css";

export default function Dashboard() {
  const user = { username: "UM1234" };

  const [enrollments, setEnrollments] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/api/enrollments/pending/", {
      credentials: "include"
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to load enrollments: ${res.status}`);
        }
        return res.json();
      })
      .then(data => setEnrollments(data))
      .catch(err => {
        console.error("Failed to load enrollments", err);
        alert(err.message);
      });
  }, []);
  
  // ORIGINAL HTML
  /*
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />

      <main style={{ padding: "2rem", width: "100%" }}>
        <header style={{ display: "flex", justifyContent: "space-between" }}>
          <h1>Hello, {user.username}</h1>
          <button>Logout</button>
        </header>

        <h2>Enrolment Requests</h2>

        <div style={{ marginTop: "1rem" }}>
          {enrollments.length === 0 && <p>No pending requests.</p>}

          {enrollments.map((e) => (
            <div
              key={e.application_id}
              style={{
                border: "1px solid #ccc",
                borderRadius: 8,
                padding: "1rem",
                marginBottom: "1rem",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <div>
                <Link
                    to={`/upper-management/enrollments/${e.application_id}`}
                    style={{ fontWeight: "bold", textDecoration: "none", color: "#1f3d1a" }}
                    >
                    {e.application_id.slice(0, 8).toUpperCase()}
                    </Link>
                <div>Submitted by: {e.name}</div>
                <div>{e.email}</div>
              </div>
              <div>Date Submitted: {e.date}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  ); 
} 
*/

 return (
    <div className="um-dashboard-wrapper">
        {/* HEADER */}
        <header className="um-header-section">
          <div className="um-brand-group">
            <img src={logo} alt="Mylora Logo" className="mylora-logo" />
            <span className="um-system-title">Web Credit System</span>
          </div>
          <div className="um-header-actions">
            <button className="um-logout-btn">
              Logout
            </button>
          </div>
        </header>

        <div className="um-dashboard-body" style={{ display: "flex", flex: 1 }}>
            <Sidebar />

          <main className="um-dashboard-content">
            {/* SECTION 2: WELCOME BANNER */}
            <h1 className="um-welcome-text">Hello, {user.username}</h1>

            {/* SECTION 3: STAT CARDS */}
            <div className="um-stats-container">
              <div className="um-stat-card active-card">
                <span className="um-stat-label">Enrolment Requests</span>
                <span className="um-stat-number">3</span>
              </div>
              <div className="um-stat-card">
                <span className="um-stat-label">Credit Approval</span>
                <span className="um-stat-number">3</span>
              </div>
              <div className="um-stat-card">
                <span className="um-stat-label">Order Processing</span>
                <span className="um-stat-number">5</span>
              </div>
            </div>

            {/* SECTION 4: TABS (Placeholder for now) */}
            <div className="um-tabs-row">
              <button className="um-tab active-tab">Enrolment Requests</button>
              <button className="um-tab">Credit Approval</button>
              <button className="um-tab">Order Processing</button>
            </div>

            {/* SECTION 5: LIST */}
            <div className="um-list-container">
              {enrollments.map((e) => (
                <div key={e.application_id} className="um-request-item">
                  <div className="um-request-info">
                    <Link to={`/upper-management/enrollments/${e.application_id}`} className="um-request-id">
                      {e.application_id.slice(0, 8).toUpperCase()}
                    </Link>
                    <div className="um-request-sub">Submitted by: {e.name}</div>
                  </div>
                  <div className="um-request-date">Date Submitted: {e.date}</div>
                </div>
              ))}
            </div>
          </main>
      </div>
    </div>
  ); 
}

