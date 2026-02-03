import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function DeliveryDetails() {
  const navigate = useNavigate();
  const [deliveryMode, setDeliveryMode] = useState("DELIVERY");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [barangay, setBarangay] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");

  useEffect(() => {
    // Check if there are items in the cart
    const items = localStorage.getItem("order_items");
    if (!items) {
      navigate("/orders/create");
      return;
    }

    // Load saved delivery details if returning to this page
    const savedDelivery = localStorage.getItem("delivery_details");
    if (savedDelivery) {
      const details = JSON.parse(savedDelivery);
      setDeliveryMode(details.deliveryMode || "DELIVERY");
      setAddress1(details.address1 || "");
      setAddress2(details.address2 || "");
      setBarangay(details.barangay || "");
      setCity(details.city || "");
      setZipCode(details.zipCode || "");
    }
  }, [navigate]);

  const handleNext = () => {
    if (deliveryMode === "DELIVERY") {
      // Validate delivery fields
      if (!address1 || !barangay || !city || !zipCode) {
        alert("Please fill in all required delivery fields");
        return;
      }
    }

    // Save delivery details to localStorage
    const deliveryDetails = {
      deliveryMode,
      address1: deliveryMode === "DELIVERY" ? address1 : "",
      address2: deliveryMode === "DELIVERY" ? address2 : "",
      barangay: deliveryMode === "DELIVERY" ? barangay : "",
      city: deliveryMode === "DELIVERY" ? city : "",
      zipCode: deliveryMode === "DELIVERY" ? zipCode : "",
    };

    localStorage.setItem("delivery_details", JSON.stringify(deliveryDetails));
    navigate("/orders/review");
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>🌾</span>
          <span style={styles.logoText}>Web Credit System</span>
        </div>
        <button onClick={() => navigate("/customer/dashboard")} style={styles.cancelBtn}>
          Cancel
        </button>
      </div>

      <div style={styles.content}>
        <h1 style={styles.title}>Create a purchase request</h1>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Delivery Details</h2>

          {/* Delivery Mode Buttons */}
          <div style={styles.modeButtons}>
            <button
              onClick={() => setDeliveryMode("DELIVERY")}
              style={{
                ...styles.modeButton,
                ...(deliveryMode === "DELIVERY" ? styles.modeButtonActive : {}),
              }}
            >
              <span style={styles.modeIcon}>🚚</span>
              Delivery
            </button>
            <button
              onClick={() => setDeliveryMode("PICKUP")}
              style={{
                ...styles.modeButton,
                ...(deliveryMode === "PICKUP" ? styles.modeButtonActive : {}),
              }}
            >
              <span style={styles.modeIcon}>🏪</span>
              Pick up in-store
            </button>
          </div>

          {/* Delivery Address Fields */}
          {deliveryMode === "DELIVERY" && (
            <div style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Address 1<span style={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  value={address1}
                  onChange={(e) => setAddress1(e.target.value)}
                  placeholder="UNIT 123, ABC STREET"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Address 2</label>
                <input
                  type="text"
                  value={address2}
                  onChange={(e) => setAddress2(e.target.value)}
                  placeholder="LANDMARK STATUE"
                  style={styles.input}
                />
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Barangay<span style={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    value={barangay}
                    onChange={(e) => setBarangay(e.target.value)}
                    placeholder="BRGY SAN JOSE"
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    City<span style={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="CEBU CITY"
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Zip Code<span style={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="9876"
                    style={styles.input}
                  />
                </div>
              </div>
            </div>
          )}

          {deliveryMode === "PICKUP" && (
            <p style={styles.pickupMessage}>
              Your order will be ready for pickup at your designated branch.
            </p>
          )}
        </div>

        <button onClick={handleNext} style={styles.nextBtn}>
          Next
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "#f5f5f5",
    padding: "2rem",
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
    fontWeight: "500",
  },
  cancelBtn: {
    padding: "0.75rem 2rem",
    background: "#1f3d1a",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "500",
  },
  content: {
    maxWidth: "800px",
    margin: "0 auto",
    background: "white",
    borderRadius: "12px",
    padding: "3rem",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  title: {
    fontSize: "2rem",
    fontWeight: "600",
    marginBottom: "2rem",
  },
  section: {
    marginBottom: "2rem",
  },
  sectionTitle: {
    fontSize: "1.5rem",
    fontWeight: "600",
    marginBottom: "1.5rem",
  },
  modeButtons: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1rem",
    marginBottom: "2rem",
  },
  modeButton: {
    padding: "1.25rem",
    background: "white",
    border: "2px solid #ccc",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    transition: "all 0.2s",
  },
  modeButtonActive: {
    background: "#1f3d1a",
    color: "white",
    borderColor: "#1f3d1a",
  },
  modeIcon: {
    fontSize: "1.5rem",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    flex: 1,
  },
  formRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "1rem",
  },
  label: {
    fontWeight: "500",
    fontSize: "0.95rem",
  },
  required: {
    color: "#e53e3e",
    marginLeft: "0.25rem",
  },
  input: {
    padding: "0.875rem",
    border: "1px solid #ccc",
    borderRadius: "6px",
    fontSize: "1rem",
    fontFamily: "inherit",
  },
  pickupMessage: {
    padding: "1.5rem",
    background: "#f9f9f9",
    borderRadius: "8px",
    color: "#666",
    textAlign: "center",
  },
  nextBtn: {
    width: "100%",
    padding: "1rem",
    background: "#1f3d1a",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "1.125rem",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "2rem",
  },
};