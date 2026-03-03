import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCookie } from "../../utils/csrf";
import Sidebar from "../../components/internal/Sidebar";
import logo from "../../assets/mylora-logo.png";
import "../upper_management/Dashboard.css";

export default function EmployeeEdit() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [loading, setLoading] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    role: "credit_manager",
    password: ""
  });

  useEffect(() => {
    fetch(`http://localhost:8000/api/um/employee/${userId}/`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load employee");
        return res.json();
      })
      .then((data) => {
        setFormData({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          phone: data.phone || "",
          email: data.email || "",
          role: data.role,
          password: ""
        });
      })
      .catch((err) => {
        console.error(err);
        alert("Failed to load employee details");
        navigate("/upper-management/employees");
      })
      .finally(() => setLoading(false));
  }, [userId, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const updateData = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      role: formData.role,
    };

    // Only include password if it's been changed
    if (formData.password) {
      updateData.password = formData.password;
    }

    fetch(`http://localhost:8000/api/um/employee/${userId}/update/`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", "X-CSRFToken": getCookie("csrftoken") },
      body: JSON.stringify(updateData),
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then(data => {
            throw new Error(data.error || "Failed to update employee");
          });
        }
        return res.json();
      })
      .then(() => {
        setShowSuccessModal(true);
      })
      .catch((err) => {
        alert(err.message);
      });
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
          <h1 className="um-welcome-text">Edit Employee Details</h1>

          <form onSubmit={handleSubmit} style={{ maxWidth: "600px" }}>
            {/* First Name and Last Name */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "8px" }}>
                  First Name
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #262626",
                    borderRadius: "8px"
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "8px" }}>
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #262626",
                    borderRadius: "8px"
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
                  placeholder="+63 9XX XXX XXXX"
                  value={formData.phone}
                  onChange={(e) => {
                    let raw = e.target.value.replace(/\D/g, "");
                    if (raw.startsWith("63")) raw = raw.substring(2);
                    if (raw.startsWith("0")) raw = raw.substring(1);
                    if (raw.length > 10) raw = raw.substring(0, 10);

                    let formatted = "+63";
                    if (raw.length > 0) formatted += " " + raw.substring(0, 3);
                    if (raw.length > 3) formatted += " " + raw.substring(3, 6);
                    if (raw.length > 6) formatted += " " + raw.substring(6, 10);

                    setFormData({ ...formData, phone: raw.length === 0 ? "" : formatted });
                  }}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #262626",
                    borderRadius: "8px"
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "8px" }}>
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #262626",
                    borderRadius: "8px"
                  }}
                />
              </div>
            </div>

            {/* Role */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "8px" }}>
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #262626",
                  borderRadius: "8px",
                  backgroundColor: "white"
                }}
              >
                <option value="credit_manager">Credit Manager</option>
                <option value="order_processor">Order Processor</option>
              </select>
            </div>

            {/* Password */}
            <div style={{ marginBottom: "30px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "8px" }}>
                Password (leave blank to keep current)
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••••"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #262626",
                  borderRadius: "8px"
                }}
              />
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: "15px" }}>
              <button
                type="button"
                onClick={() => navigate(`/upper-management/employee/${userId}`)}
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
                type="submit"
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
                Save
              </button>
            </div>
          </form>
        </main>
      </div>

      {showSuccessModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "white", border: "1px solid #262626", borderRadius: "15px", padding: "40px", maxWidth: "500px", width: "90%", textAlign: "center", fontFamily: "'Arimo', sans-serif" }}>
            <h2 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "15px" }}>Employee Updated</h2>
            <p style={{ fontSize: "16px", marginBottom: "30px", color: "#666" }}>
              Employee details have been updated successfully.
            </p>
            <button
              onClick={() => navigate(`/upper-management/employee/${userId}`)}
              style={{ padding: "12px 40px", fontSize: "16px", fontWeight: "600", border: "none", borderRadius: "8px", backgroundColor: "#1E2D1A", color: "white", cursor: "pointer", fontFamily: "'Arimo', sans-serif" }}
            >
              Back to Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
}