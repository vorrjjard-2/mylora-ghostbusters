import { API_BASE_URL } from "../../utils/api";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/mylora-logo.png";
import deliveryWhite from "../../assets/deliver_white.png";
import deliveryGreen from "../../assets/deliver_green.png";
import pickupWhite from "../../assets/pickup_white.png";
import pickupGreen from "../../assets/pickup_green.png";
import "./DeliveryDetails.css";

export default function DeliveryDetails() {
  const navigate = useNavigate();
  const [deliveryMode, setDeliveryMode] = useState("DELIVERY");

  // Address fields (always from registered profile)
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [provinceName, setProvinceName] = useState("");
  const [city, setCity] = useState("");
  const [barangay, setBarangay] = useState("");
  const [zipCode, setZipCode] = useState("");

  useEffect(() => {
    const items = localStorage.getItem("order_items");
    if (!items) {
      navigate("/orders/create");
      return;
    }

    fetch(`${API_BASE_URL}/api/customer/profile/`, { credentials: "include" })
      .then(r => r.json())
      .then(data => {
        setAddress1(data.address1 || "");
        setAddress2(data.address2 || "");
        setProvinceName(data.province || "");
        setCity(data.city || "");
        setBarangay(data.barangay || "");
        setZipCode(data.zipcode || "");
      })
      .catch(console.error);

    const savedDelivery = localStorage.getItem("delivery_details");
    if (savedDelivery) {
      const details = JSON.parse(savedDelivery);
      setDeliveryMode(details.deliveryMode || "DELIVERY");
    }
  }, [navigate]);

  const handleNext = () => {
    if (deliveryMode === "DELIVERY") {
      if (!address1 || !barangay || !city || !zipCode) {
        alert("Please fill in all required delivery fields");
        return;
      }
    }

    const deliveryDetails = {
      deliveryMode,
      address1: deliveryMode === "DELIVERY" ? address1 : "",
      address2: deliveryMode === "DELIVERY" ? address2 : "",
      province: deliveryMode === "DELIVERY" ? provinceName : "",
      barangay: deliveryMode === "DELIVERY" ? barangay : "",
      city: deliveryMode === "DELIVERY" ? city : "",
      zipCode: deliveryMode === "DELIVERY" ? zipCode : "",
    };

    localStorage.setItem("delivery_details", JSON.stringify(deliveryDetails));
    navigate("/orders/review");
  };

return (
  <div className="delivery-container">
    <header className="um-header-section">
      <div className="um-brand-group">
        <img src={logo} alt="Mylora Logo" className="mylora-logo" />
        <span className="um-system-title">Web Credit System</span>
      </div>
      <div className="um-header-actions">
        <button className="um-cancel-btn" onClick={() => navigate("/customer/dashboard")}>
          Cancel
        </button>
      </div>
    </header>
      <div className="order-header">
        <h1>Create a purchase request</h1>
        <div className="order-subheader">
          <h2>Delivery Details</h2>
        </div>
      </div>
    <div className="delivery-content">
      <div className="delivery-section">
        {/* Delivery Mode Buttons */}
        <div className="delivery-mode-buttons">
          <button
            onClick={() => setDeliveryMode("DELIVERY")}
            className={`delivery-mode-button ${deliveryMode === "DELIVERY" ? "active" : ""}`}
          >
            <img
              src={deliveryMode === "DELIVERY" ? deliveryWhite : deliveryGreen}
              alt="Delivery"
              className="delivery-mode-img"
            />
            Delivery
          </button>
          <button
            onClick={() => setDeliveryMode("PICKUP")}
            className={`delivery-mode-button ${deliveryMode === "PICKUP" ? "active" : ""}`}
          >
            <img
              src={deliveryMode === "PICKUP" ? pickupWhite : pickupGreen}
              alt="Pickup"
              className="delivery-mode-img"
            />
            Pick up in-store
          </button>
        </div>

        {/* Delivery Address Fields */}
        {deliveryMode === "DELIVERY" && (
          <div className="delivery-form">
            <div className="delivery-form-group">
              <label className="delivery-label">
                Address 1<span className="delivery-required">*</span>
              </label>
              <input
                type="text"
                value={address1}
                readOnly
                className="delivery-input delivery-input-readonly"
              />
            </div>

            <div className="delivery-form-group">
              <label className="delivery-label">Address 2</label>
              <input
                type="text"
                value={address2}
                readOnly
                className="delivery-input delivery-input-readonly"
              />
            </div>

            <div className="delivery-form-row">
              <div className="delivery-form-group">
                <label className="delivery-label">
                  Province<span className="delivery-required">*</span>
                </label>
                <input
                  type="text"
                  value={provinceName}
                  readOnly
                  className="delivery-input delivery-input-readonly"
                />
              </div>

              <div className="delivery-form-group">
                <label className="delivery-label">
                  City / Municipality<span className="delivery-required">*</span>
                </label>
                <input
                  type="text"
                  value={city}
                  readOnly
                  className="delivery-input delivery-input-readonly"
                />
              </div>

              <div className="delivery-form-group">
                <label className="delivery-label">
                  Barangay<span className="delivery-required">*</span>
                </label>
                <input
                  type="text"
                  value={barangay}
                  readOnly
                  className="delivery-input delivery-input-readonly"
                />
              </div>
            </div>

            <div className="delivery-form-group delivery-zip-group">
              <label className="delivery-label">
                Zip Code<span className="delivery-required">*</span>
              </label>
              <input
                type="text"
                value={zipCode}
                readOnly
                className="delivery-input delivery-input-readonly"
              />
            </div>
          </div>
        )}

        {deliveryMode === "PICKUP" && (
          <p className="delivery-pickup-message">
            Your order will be ready for pickup at your designated branch.
          </p>
        )}
      </div>

      <button onClick={handleNext} className="delivery-next-btn">
        Next
      </button>
    </div>
  </div>
);
}
