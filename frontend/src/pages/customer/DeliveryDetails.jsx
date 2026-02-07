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
                onChange={(e) => setAddress1(e.target.value)}
                placeholder="UNIT 123, ABC STREET"
                className="delivery-input"
              />
            </div>

            <div className="delivery-form-group">
              <label className="delivery-label">Address 2</label>
              <input
                type="text"
                value={address2}
                onChange={(e) => setAddress2(e.target.value)}
                placeholder="LANDMARK STATUE"
                className="delivery-input"
              />
            </div>

            <div className="delivery-form-row">
              <div className="delivery-form-group">
                <label className="delivery-label">
                  Barangay<span className="delivery-required">*</span>
                </label>
                <input
                  type="text"
                  value={barangay}
                  onChange={(e) => setBarangay(e.target.value)}
                  placeholder="BRGY SAN JOSE"
                  className="delivery-input"
                />
              </div>

              <div className="delivery-form-group">
                <label className="delivery-label">
                  City<span className="delivery-required">*</span>
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="CEBU CITY"
                  className="delivery-input"
                />
              </div>

              <div className="delivery-form-group">
                <label className="delivery-label">
                  Zip Code<span className="delivery-required">*</span>
                </label>
                <input
                  type="text"
                  placeholder="9876"
                  value={zipCode}
                  onChange={e => {
                    // Remove anything that isn't a number
                    const value = e.target.value.replace(/\D/g, "");
                        
                    // Only update state if it's 4 digits or less
                    if (value.length <= 4) {
                      setZipCode(value);
                    }
                  }} 
                  className="delivery-input"
                />
              </div>
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