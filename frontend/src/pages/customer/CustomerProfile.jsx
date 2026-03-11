import { API_BASE_URL } from "../../utils/api";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCookie } from "../../utils/csrf";
import logo from "../../assets/mylora-logo.png";
import "./CustomerProfile.css";


export default function CustomerProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Customer data
  const [customerData, setCustomerData] = useState(null);

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);


  useEffect(() => {
    // Fetch customer profile data
    fetch(`${API_BASE_URL}/api/customer/profile/`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load profile");
        return res.json();
      })
      .then((data) => {
        setCustomerData(data);
      })
      .catch((err) => {
        console.error(err);
        alert("Failed to load profile data");
      })
      .finally(() => setLoading(false));
  }, []);

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSavePassword = async () => {
    setPasswordError("");

    if (!passwordForm.current_password || !passwordForm.new_password) {
      setPasswordError("Please fill in all password fields.");
      return;
    }

    if (passwordForm.new_password.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }

    if (passwordForm.new_password !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setSaving(true);
    const csrfToken = getCookie("csrftoken");

    try {
      const response = await fetch(`${API_BASE_URL}/api/customer/change-password/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        body: JSON.stringify(passwordForm),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to change password");
      }

      setPasswordForm({ current_password: "", new_password: "" });
      setConfirmPassword("");
      setShowSuccessModal(true);
    } catch (err) {
      console.error(err);
      setPasswordError(err.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="profile-container">Loading...</div>;
  }

  if (!customerData) {
    return <div className="profile-container">Unable to load profile</div>;
  }

return (
    <div className="profile-container">
      {/* HEADER */}
      <header className="profile-header-section">
        <div className="profile-brand-group">
          <img src={logo} alt="Mylora Logo" className="mylora-logo" />
          <span className="profile-system-title">Web Credit System</span>
        </div>
        <div className="profile-header-actions">
          <button className="profile-back-btn" onClick={() => navigate("/customer/dashboard")}>
            Back
          </button>
        </div>
      </header>

      <main className="profile-content">

      <h1 className="profile-title">Your profile</h1>

      {/* Password Section */}
      <div className="profile-section">
        <h2 className="profile-section-title">Password</h2>

        <div className="profile-form-group">
          <label className="profile-label">Current Password</label>
          <input
            type="password"
            name="current_password"
            value={passwordForm.current_password}
            onChange={handlePasswordChange}
            className="profile-input"
            placeholder="••••••••"
          />
        </div>

        <div className="profile-form-group">
          <label className="profile-label">New Password</label>
          <input
            type="password"
            name="new_password"
            value={passwordForm.new_password}
            onChange={handlePasswordChange}
            className="profile-input"
            placeholder="Enter new password"
          />
        </div>

        <div className="profile-form-group">
          <label className="profile-label">Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="profile-input"
            placeholder="Re-enter new password"
          />
        </div>

        {passwordError && (
          <p className="profile-error">{passwordError}</p>
        )}

        <div className="profile-button-row">
          <button
            className="profile-save-password-btn"
            onClick={handleSavePassword}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save New Password"}
          </button>
        </div>
      </div>

      {/* Customer Information Section - Read Only */}
      <div className="profile-section">
        <h2 className="profile-section-title">Customer Information</h2>

        <div className="profile-form-group">
          <label className="profile-label">Name</label>
          <input
            type="text"
            value={customerData.name}
            readOnly
            className="profile-input-readonly"
          />
        </div>

        <div className="profile-form-row">
          <div className="profile-form-group">
            <label className="profile-label">Phone Number</label>
            <input
              type="text"
              value={customerData.phone}
              readOnly
              className="profile-input-readonly"
            />
          </div>
          <div className="profile-form-group">
            <label className="profile-label">Email</label>
            <input
              type="email"
              value={customerData.email}
              readOnly
              className="profile-input-readonly"
            />
          </div>
        </div>
      </div>

      {/* Delivery Address Section - Read Only */}
      <div className="profile-section">
        <h2 className="profile-section-title">Delivery Address</h2>

        <div className="profile-form-group">
          <label className="profile-label">Address 1</label>
          <input
            type="text"
            value={customerData.address1 || ""}
            readOnly
            className="profile-input-readonly"
          />
        </div>

        <div className="profile-form-group">
          <label className="profile-label">Address 2</label>
          <input
            type="text"
            value={customerData.address2 || ""}
            readOnly
            className="profile-input-readonly"
          />
        </div>

        <div className="profile-form-row">
          <div className="profile-form-group">
            <label className="profile-label">Province</label>
            <input
              type="text"
              value={customerData.province || ""}
              readOnly
              className="profile-input-readonly"
            />
          </div>
          <div className="profile-form-group">
            <label className="profile-label">City / Municipality</label>
            <input
              type="text"
              value={customerData.city || ""}
              readOnly
              className="profile-input-readonly"
            />
          </div>
          <div className="profile-form-group">
            <label className="profile-label">Barangay</label>
            <input
              type="text"
              value={customerData.barangay || ""}
              readOnly
              className="profile-input-readonly"
            />
          </div>
        </div>
        <div className="profile-form-group">
          <label className="profile-label">Zip Code</label>
          <input
            type="text"
            value={customerData.zipcode || ""}
            readOnly
            className="profile-input-readonly"
          />
        </div>
      </div>

      {/* Billing Address Section - Read Only */}
      <div className="profile-section">
        <h2 className="profile-section-title">Billing Address</h2>

        <div className="profile-form-group">
          <label className="profile-label">Address 1</label>
          <input
            type="text"
            value={customerData.billing_address1 || ""}
            readOnly
            className="profile-input-readonly"
          />
        </div>

        <div className="profile-form-group">
          <label className="profile-label">Address 2</label>
          <input
            type="text"
            value={customerData.billing_address2 || ""}
            readOnly
            className="profile-input-readonly"
          />
        </div>

        <div className="profile-form-row">
          <div className="profile-form-group">
            <label className="profile-label">Province</label>
            <input
              type="text"
              value={customerData.billing_province || ""}
              readOnly
              className="profile-input-readonly"
            />
          </div>
          <div className="profile-form-group">
            <label className="profile-label">City / Municipality</label>
            <input
              type="text"
              value={customerData.billing_city || ""}
              readOnly
              className="profile-input-readonly"
            />
          </div>
          <div className="profile-form-group">
            <label className="profile-label">Barangay</label>
            <input
              type="text"
              value={customerData.billing_barangay || ""}
              readOnly
              className="profile-input-readonly"
            />
          </div>
        </div>
        <div className="profile-form-group">
          <label className="profile-label">Zip Code</label>
          <input
            type="text"
            value={customerData.billing_zipcode || ""}
            readOnly
            className="profile-input-readonly"
          />
        </div>
      </div>
      </main>

      {showSuccessModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "white", border: "1px solid #262626", borderRadius: "15px", padding: "40px", maxWidth: "500px", width: "90%", textAlign: "center", fontFamily: "'Arimo', sans-serif" }}>
            <h2 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "15px" }}>Password Updated</h2>
            <p style={{ fontSize: "16px", marginBottom: "30px", color: "#666" }}>
              Your password has been changed successfully.
            </p>
            <button
              onClick={() => setShowSuccessModal(false)}
              style={{ padding: "12px 40px", fontSize: "16px", fontWeight: "600", border: "none", borderRadius: "8px", backgroundColor: "#1E2D1A", color: "white", cursor: "pointer", fontFamily: "'Arimo', sans-serif" }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
