import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCookie } from "../../utils/csrf";
import Sidebar from "../../components/internal/Sidebar";
import logo from "../../assets/mylora-logo.png";
import ConfirmPasswordModal from "../../components/internal/ConfirmPasswordModal";
import "../upper_management/Dashboard.css";

export default function EmployeeProfile() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:8000/api/um/employee/${userId}/`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load employee");
        return res.json();
      })
      .then(setEmployee)
      .catch((err) => {
        console.error(err);
        alert("Failed to load employee details");
        navigate("/upper-management/employees");
      })
      .finally(() => setLoading(false));
  }, [userId, navigate]);

  const handleDeleteConfirm = (password) => {
    fetch(`http://localhost:8000/api/um/employee/${userId}/delete/`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", "X-CSRFToken": getCookie("csrftoken") },
      body: JSON.stringify({ password }),
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then(data => {
            throw new Error(data.error || "Failed to delete employee");
          });
        }
        return res.json();
      })
      .then(() => {
        alert("Employee account deleted successfully");
        navigate("/upper-management/employees");
      })
      .catch((err) => {
        alert(err.message);
      });
  };

  const getRoleDisplay = (role) => {
    const roleMap = {
      "credit_manager": "Credit Manager",
      "order_processor": "Order Processor",
      "upper_management": "Upper Management",
    };
    return roleMap[role] || role;
  };

  if (loading) {
    return (
      <div className="um-dashboard-wrapper">
        <header className="um-header-section">
          <div className="um-brand-group">
            <img src={logo} alt="Mylora Logo" className="mylora-logo" />
            <span className="um-system-title">Web Credit System</span>
          </div>
        </header>
        <div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="um-dashboard-wrapper">
      <header className="um-header-section">
        <div className="um-brand-group">
          <img src={logo} alt="Mylora Logo" className="mylora-logo" />
          <span className="um-system-title">Web Credit System</span>
        </div>
        <div className="um-header-actions">
          <button className="um-logout-btn" onClick={() => navigate("/login")}>
            Logout
          </button>
        </div>
      </header>

      <div className="um-dashboard-body" style={{ display: "flex", flex: 1 }}>
        <Sidebar />

        <main className="um-dashboard-content">
          <h1 className="um-welcome-text">{employee.name}</h1>

          <div style={{ maxWidth: "600px" }}>
            {/* First Name and Last Name */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "8px" }}>
                  First Name
                </label>
                <input
                  type="text"
                  value={employee.first_name || "N/A"}
                  readOnly
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #262626",
                    borderRadius: "8px",
                    backgroundColor: "#f5f5f5"
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "8px" }}>
                  Last Name
                </label>
                <input
                  type="text"
                  value={employee.last_name || "N/A"}
                  readOnly
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #262626",
                    borderRadius: "8px",
                    backgroundColor: "#f5f5f5"
                  }}
                />
              </div>
            </div>

            {/* Phone Number and Email */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "8px" }}>
                  Phone Number
                </label>
                <input
                  type="text"
                  value={employee.phone || "N/A"}
                  readOnly
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #262626",
                    borderRadius: "8px",
                    backgroundColor: "#f5f5f5"
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "8px" }}>
                  Email
                </label>
                <input
                  type="text"
                  value={employee.email || "N/A"}
                  readOnly
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #262626",
                    borderRadius: "8px",
                    backgroundColor: "#f5f5f5"
                  }}
                />
              </div>
            </div>

            {/* Role */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "8px" }}>
                Role
              </label>
              <input
                type="text"
                value={getRoleDisplay(employee.role)}
                readOnly
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #262626",
                  borderRadius: "8px",
                  backgroundColor: "#f5f5f5"
                }}
              />
            </div>

            {/* Password (masked) */}
            <div style={{ marginBottom: "30px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "8px" }}>
                Password
              </label>
              <input
                type="password"
                value="••••••••••"
                readOnly
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #262626",
                  borderRadius: "8px",
                  backgroundColor: "#f5f5f5"
                }}
              />
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: "15px" }}>
              <button
                onClick={() => setShowDeleteModal(true)}
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
                Delete Account
              </button>
              <button
                onClick={() => navigate("/upper-management/employees")}
                style={{
                  padding: "12px 24px",
                  fontSize: "16px",
                  fontWeight: "600",
                  border: "1px solid #262626",
                  borderRadius: "8px",
                  backgroundColor: "white",
                  cursor: "pointer"
                }}
              >
                Back
              </button>
              <button
                onClick={() => navigate(`/upper-management/employee/${userId}/edit`)}
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
                Edit
              </button>
            </div>
          </div>
        </main>
      </div>

      {showDeleteModal && (
        <ConfirmPasswordModal
          title="Delete Account"
          message={`Are you sure you want to delete ${employee.name}'s account?`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}