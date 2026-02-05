import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCookie } from "../../utils/csrf";

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
  
  // Address form
  const [addressForm, setAddressForm] = useState({
    address1: "",
    address2: "",
    barangay: "",
    city: "",
    zipcode: "",
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
        // Pre-fill address form
        setAddressForm({
          address1: data.address1 || "",
          address2: data.address2 || "",
          barangay: data.barangay || "",
          city: data.city || "",
          zipcode: data.zipcode || "",
        });
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

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddressForm((prev) => ({ ...prev, [name]: value }));
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

  const handleSaveAddress = async () => {
    setSaving(true);
    const csrfToken = getCookie("csrftoken");

    try {
      const response = await fetch("http://localhost:8000/api/customer/update-address/", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        body: JSON.stringify(addressForm),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update address");
      }

      alert("Address updated successfully");
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to update address");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={styles.container}>Loading...</div>;
  }

  if (!customerData) {
    return <div style={styles.container}>Unable to load profile</div>;
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>🌾</span>
          <span style={styles.logoText}>Web Credit System</span>
        </div>
        <button style={styles.backBtn} onClick={() => navigate("/customer/dashboard")}>
          Back
        </button>
      </div>

      <h1 style={styles.title}>Your profile</h1>

      {/* Password Section */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Password</h2>
        
        <div style={styles.formGroup}>
          <label style={styles.label}>Current Password</label>
          <input
            type="password"
            name="current_password"
            value={passwordForm.current_password}
            onChange={handlePasswordChange}
            style={styles.input}
            placeholder="••••••••"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>New Password</label>
          <input
            type="password"
            name="new_password"
            value={passwordForm.new_password}
            onChange={handlePasswordChange}
            style={styles.input}
            placeholder="Enter new password"
          />
        </div>

        <div style={styles.buttonRow}>
          <button
            style={styles.saveBtn}
            onClick={handleSavePassword}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save New Password"}
          </button>
        </div>
      </div>

      {/* Customer Information Section - Read Only */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Customer Information</h2>
        
        <div style={styles.formGroup}>
          <label style={styles.label}>Name</label>
          <input
            type="text"
            value={customerData.name}
            readOnly
            style={styles.inputReadOnly}
          />
        </div>

        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Phone Number</label>
            <input
              type="text"
              value={customerData.phone}
              readOnly
              style={styles.inputReadOnly}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={customerData.email}
              readOnly
              style={styles.inputReadOnly}
            />
          </div>
        </div>
      </div>

      {/* Address Details Section - Editable */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Address Details</h2>
        
        <div style={styles.formGroup}>
          <label style={styles.label}>Address 1*</label>
          <input
            type="text"
            name="address1"
            value={addressForm.address1}
            onChange={handleAddressChange}
            style={styles.input}
            placeholder="UNIT 123, ABC STREET"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Address 2</label>
          <input
            type="text"
            name="address2"
            value={addressForm.address2}
            onChange={handleAddressChange}
            style={styles.input}
            placeholder="LANDMARK STATUE"
          />
        </div>

        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Barangay*</label>
            <input
              type="text"
              name="barangay"
              value={addressForm.barangay}
              onChange={handleAddressChange}
              style={styles.input}
              placeholder="BRGY SAN JOSE"
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>City*</label>
            <input
              type="text"
              name="city"
              value={addressForm.city}
              onChange={handleAddressChange}
              style={styles.input}
              placeholder="CEBU CITY"
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Zip Code*</label>
            <input
              type="text"
              name="zipcode"
              value={addressForm.zipcode}
              onChange={handleAddressChange}
              style={styles.input}
              placeholder="9876"
            />
          </div>
        </div>

        <div style={styles.buttonRow}>
          <button
            style={styles.saveBtn}
            onClick={handleSaveAddress}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "2rem",
    maxWidth: "900px",
    margin: "0 auto",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2rem",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  logoIcon: {
    fontSize: "1.5rem",
  },
  logoText: {
    fontSize: "1.25rem",
    fontWeight: 500,
  },
  backBtn: {
    padding: "0.5rem 1.5rem",
    background: "#1f3d1a",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: 600,
  },
  title: {
    fontSize: "2.5rem",
    fontWeight: 700,
    marginBottom: "2rem",
  },
  section: {
    marginBottom: "2.5rem",
    paddingBottom: "2rem",
    borderBottom: "1px solid #e0e0e0",
  },
  sectionTitle: {
    fontSize: "1.5rem",
    fontWeight: 700,
    marginBottom: "1.5rem",
  },
  formGroup: {
    marginBottom: "1.5rem",
    flex: 1,
  },
  formRow: {
    display: "flex",
    gap: "1rem",
    alignItems: "flex-start",
  },
  label: {
    display: "block",
    fontWeight: 600,
    marginBottom: "0.5rem",
    fontSize: "0.9rem",
  },
  input: {
    width: "100%",
    padding: "0.75rem",
    border: "1px solid #ccc",
    borderRadius: "6px",
    fontSize: "1rem",
    boxSizing: "border-box",
  },
  inputReadOnly: {
    width: "100%",
    padding: "0.75rem",
    border: "1px solid #e0e0e0",
    borderRadius: "6px",
    fontSize: "1rem",
    boxSizing: "border-box",
    background: "#f5f5f5",
    color: "#666",
  },
  buttonRow: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "1.5rem",
  },
  saveBtn: {
    padding: "0.75rem 2rem",
    background: "#1f3d1a",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: 600,
  },
};