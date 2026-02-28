import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/mylora-logo.png";
import "./ReviewOrder.css";

export default function ReviewOrder() {
  const navigate = useNavigate();
  const [orderItems, setOrderItems] = useState([]);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [deliveryDetails, setDeliveryDetails] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);

  useEffect(() => {
    // Load order items from localStorage
    const items = localStorage.getItem("order_items");   
    if (!items) {
      navigate("/orders/create");
      return;
    }
    setOrderItems(JSON.parse(items));

    // Load delivery details from localStorage
    const delivery = localStorage.getItem("delivery_details");
    if (!delivery) {
      navigate("/orders/delivery");
      return;
    }
    setDeliveryDetails(JSON.parse(delivery));

    // Fetch customer info
    fetch("http://localhost:8000/api/customer/dashboard/", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setCustomerInfo(data);
        const items = JSON.parse(localStorage.getItem("order_items") || "[]");
        const total = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
        const available = parseFloat(data.credit.available_credit);
        if (total > available) setShowCreditModal(true);
      })
      .catch((err) => console.error(err));
  }, [navigate]);

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    // Get CSRF token from cookie
    const getCookie = (name) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
    };

    // Build shipping address from delivery details
    let shippingAddress = "For Pickup";
    if (deliveryDetails.deliveryMode === "DELIVERY") {
      const parts = [
        deliveryDetails.address1,
        deliveryDetails.address2,
        deliveryDetails.barangay,
        deliveryDetails.city,
        deliveryDetails.zipCode
      ].filter(Boolean);
      shippingAddress = parts.join(", ");
    }

    try {
      const res = await fetch("http://localhost:8000/api/orders/create/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        credentials: "include",
        body: JSON.stringify({
          delivery_mode: deliveryDetails.deliveryMode,
          shipping_address: shippingAddress,
          items: orderItems,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create order");
      }

      const data = await res.json();
      
      // Clear localStorage
      localStorage.removeItem("order_items");
      localStorage.removeItem("delivery_details");
      
      // Navigate to success page
      navigate("/orders/success", { 
        state: { 
          orderId: data.order_id,
          exceedsCredit: data.exceeds_credit 
        } 
      });
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (orderItems.length === 0 || !deliveryDetails || !customerInfo) {
    return <div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>; 
  }

return (
  <div className="review-container">
    {/* Header Section */}
    <header className="review-main-header">
      <div className="review-brand-group">
        <img src={logo} alt="Mylora Logo" className="review-logo-img" />
        <span className="review-system-title">Web Credit System</span>
      </div>
      <div className="review-header-actions">
        <button className="review-cancel-btn" onClick={() => navigate("/customer/dashboard")}>
          Cancel
        </button> 
      </div>
    </header>

    {/* Page Title Section */}
    <div className="review-page-title-section">
      <h1>Review purchase request</h1>
    </div>

    <div className="review-content">
      {/* Credit Warning Modal */}
      {showCreditModal && (
        <div className="review-modal-overlay">
          <div className="review-modal">
            <h2 className="review-modal-title">Credit Limit Exceeded</h2>
            <p className="review-modal-body">
              This order exceeds your available credit limit. Your order will need to be reviewed by management for approval.
            </p>
            <button
              className="review-modal-accept-btn"
              onClick={() => setShowCreditModal(false)}
            >
              I understand, continue
            </button>
          </div>
        </div>
      )}

      {/* Customer Information */}
      <div className="review-section">
        <h3 className="review-section-title">Customer Information</h3>
        
        <div className="review-field-group">
          <label className="review-field-label">Name</label>
          <div className="review-readonly-box">
            {customerInfo.user.name}
          </div>
        </div>

        <div className="review-field-group">
          <label className="review-field-label">Available Credit</label>
          <div className="review-readonly-box">
            ₱{parseFloat(customerInfo.credit.available_credit).toLocaleString()}
            </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="review-section">
        <h3 className="review-section-title">Your order</h3>
        
        <div className="review-table-wrapper">
          <table className="review-table">
            <thead>
              <tr>
                <th className="review-th">ITEM</th>
                <th className="review-th review-text-center">QUANTITY</th>
                <th className="review-th review-text-right">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {orderItems.map((item, index) => (
                <tr key={index} className="review-tr">
                  <td className="review-td">
                    <div className="review-item-name">{item.name}</div>
                    <div className="review-item-unit">
                     {/* ₱{item.unit_price.toFixed(2)} / {item.unit} */}
                    </div>
                  </td>
                  <td className="review-td review-text-center">{item.quantity}</td>
                  <td className="review-td review-text-right">
                    ₱{(item.unit_price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
              
              {/* Total Row with emphasis */}
              <tr className="review-total-row">
                <td colSpan="2" className="review-total-label">TOTAL</td>
                <td className="review-total-amount">
                  ₱{calculateTotal().toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Delivery Details */}
      <div className="review-section">
        <div className="review-section-header">
          <h3 className="review-section-title">Delivery Details</h3>
          <button
            onClick={() => navigate("/orders/delivery")}
            className="review-edit-link"
          >
            Edit Details
          </button>
        </div>

        <div className="review-field-group">
          <label className="review-field-label">Mode</label>
          <div className="review-readonly-box">
            {deliveryDetails.deliveryMode === "DELIVERY" ? "Delivery" : "Pick up in-store"}
          </div>
        </div>

        {deliveryDetails.deliveryMode === "PICKUP" && customerInfo?.credit?.branch && (
          <div className="review-field-group">
            <label className="review-field-label">Branch Address</label>
            <div className="review-readonly-box review-address-multi-line">
              <p><strong>{customerInfo.credit.branch.name}</strong></p>
              <p>{customerInfo.credit.branch.address}</p>
            </div>
          </div>
        )}

        {deliveryDetails.deliveryMode === "DELIVERY" && (
          <>
            <div className="review-field-group">
              <label className="review-field-label">Shipping Address</label>
              <div className="review-readonly-box review-address-multi-line">
                <p>{deliveryDetails.address1}</p>
                {deliveryDetails.address2 && <p>{deliveryDetails.address2}</p>}
                <p>{deliveryDetails.barangay}, {deliveryDetails.city} {deliveryDetails.zipCode}</p>
              </div>
            </div>

            {customerInfo?.credit?.branch && (
              <div className="review-field-group">
                <label className="review-field-label">Branch Address</label>
                <div className="review-readonly-box review-address-multi-line">
                  <p><strong>{customerInfo.credit.branch.name}</strong></p>
                  <p>{customerInfo.credit.branch.address}</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div className="review-actions">
        <button
          onClick={() => navigate("/orders/create")}
          className="review-back-link"
        >
          Back to Edit Order
        </button>
        
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className={`review-submit-btn ${submitting ? "disabled" : ""}`}
        >
          {submitting ? "Submitting..." : "Submit Purchase Request"}
        </button>
      </div>
    </div>
  </div>
);
}