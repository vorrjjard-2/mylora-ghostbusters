import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../../components/internal/Sidebar";

export default function Dashboard() {
  const user = { username: "UM1234" };

  const [enrollments, setEnrollments] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/api/enrollments/pending/")
      .then(res => res.json())
      .then(data => setEnrollments(data))
      .catch(err => console.error("Failed to load enrollments", err));
  }, []);

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
                    to={`/upper_m/enrollments/${e.application_id}`}
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