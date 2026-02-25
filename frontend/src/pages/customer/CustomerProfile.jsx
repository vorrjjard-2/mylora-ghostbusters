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


  useEffect(() => {
    // Fetch customer profile data
    fetch("http://localhost:8000/api/customer/profile/", {
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
    if (!passwordForm.current_password || !passwordForm.new_password) {
      alert("Please fill in both password fields");
      return;
    }

    setSaving(true);
    const csrfToken = getCookie("csrftoken");

    try {
      const response = await fetch("http://localhost:8000/api/customer/change-password/", {
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

      alert("Password changed successfully");
      setPasswordForm({ current_password: "", new_password: "" });
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to change password");
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

      {/* Address Details Section - Read Only */}
      <div className="profile-section">
        <h2 className="profile-section-title">Address Details</h2>

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
      </main>
    </div>
  );
};
