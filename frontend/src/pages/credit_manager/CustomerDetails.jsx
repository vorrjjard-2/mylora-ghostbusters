import { API_BASE_URL } from "../../utils/api";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import paperIcon from "../../assets/paper.png";
import clockIcon from "../../assets/clock.png";
import logo from "../../assets/mylora-logo.png";
import "./CustomerDetails.css";

export default function CustomerDetails() {
  const navigate = useNavigate();
  const { customerId } = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/cm/customers/`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load customers");
        return res.json();
      })
      .then((customers) => {
        const found = customers.find((c) => c.customer_id === parseInt(customerId));
        if (!found) throw new Error("Customer not found");
        setCustomer(found);
      })
      .catch((err) => {
        console.error(err);
        alert("Failed to load customer details");
        navigate("/credit-manager/dashboard");
      })
      .finally(() => setLoading(false));
  }, [customerId, navigate]);

  if (loading) {
    return <div className="cd-container">Loading...</div>;
  }

  if (!customer) {
    return <div className="cd-container">Customer not found</div>;
  }
// ADD A BACK BUTTON !!
return ( 
    <div className="cd-container">
      {/* HEADER */}
      <header className="ub-header-section">
        <div className="ub-brand-group">
          <img src={logo} alt="Mylora Logo" className="mylora-logo" />
          <span className="ub-system-title">Web Credit System</span>
        </div>
        <button className="ub-logout-btn" onClick={() => navigate("/login")}>
          Logout
        </button>
      </header>
 
      <div className="cd-content">
        <h1 className="cd-customer-title">{customer.name}</h1>

        {/* Action Buttons */}
        <div className="cd-button-row">
          <button
            className="cd-adjust-btn"
            onClick={() => navigate(`/credit-manager/customer/${customerId}/history`)}
          >
            <img src={paperIcon} alt="History" className="cd-paper-icon" />    
            View Credit History      
          </button>
          <button
            className="cd-adjust-btn"
            onClick={() => navigate(`/credit-manager/customer/${customerId}/update-balance`)}
          >
            <img src={clockIcon} alt="Credit" className="cd-clock-icon" />    
             Update Credit Balance
          </button>
        </div>

        {/* Credit Balance Section */}
        <div className="cd-section">
          <h3 className="cd-section-title">Credit Balance</h3>
          <div className="cd-balance-row">
            <span>Available Credit:</span>
            <span className="cd-balance-value">
              ₱{" "}
              {parseFloat(customer.available_credit).toLocaleString("en-PH", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className="cd-balance-row">
            <span>Credit Limit:</span>
            <span>
              ₱{" "}
              {parseFloat(customer.credit_limit).toLocaleString("en-PH", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>

        {/* Outstanding Balance */}
        <div className="cd-outstanding-section">
          <div className="cd-outstanding-row">
            <span className="cd-outstanding-label">Outstanding Balance</span>
            <span className="cd-outstanding-amount">
              ₱{" "}
              {parseFloat(customer.outstanding_balance).toLocaleString("en-PH", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>

        {/* Contact Information */}
        <div className="cd-section">
          <h3 className="cd-section-title">Contact Information</h3>
          <div className="cd-form-row">
            <div className="cd-form-group">
              <label className="cd-label">Phone Number</label>
              <input
                type="text"
                value={customer.phone || "N/A"}
                readOnly
                className="cd-input-read-only"
              />
            </div>
            <div className="cd-form-group">
              <label className="cd-label">Email</label>
              <input
                type="text"
                value={customer.email || "N/A"}
                readOnly
                className="cd-input-read-only"
              />
            </div>
          </div>
        </div>

        {/* Address Details Section - Read Only */}
        <div className="cd-section">
          <h2 className="cd-section-title">Address Details</h2>
          
          <div className="cd-form-group">
            <label className="cd-label">Address 1</label>
            <input
              type="text"
              value={customer.address1 || "N/A"}
              readOnly
              className="cd-input-read-only"
            />
          </div>

          <div className="cd-form-group">
            <label className="cd-label">Address 2</label>
            <input
              type="text"
              value={customer.address2 || "N/A"}
              readOnly
              className="cd-input-read-only"
            />
          </div>

          <div className="cd-form-row-triple">
            <div className="cd-form-group">
              <label className="cd-label">Barangay</label>
              <input
                type="text"
                value={customer.barangay || "N/A"}
                readOnly
                className="cd-input-read-only"
              />
            </div>
            <div className="cd-form-group">
              <label className="cd-label">City</label>
              <input
                type="text"
                value={customer.city || "N/A"}
                readOnly
                className="cd-input-read-only"
              />
            </div>
            <div className="cd-form-group">
              <label className="cd-label">Zip Code</label>
              <input
                type="text"
                value={customer.zipcode || "N/A"}
                readOnly
                className="cd-input-read-only"
              />
            </div>
          </div>

          {/* Added Back Button here for a cleaner look */}
          <div className="cd-button-row-footer">
            <button
              className="cd-back-btn"
              onClick={() => navigate("/credit-manager/dashboard")}
            >
              Back 
            </button>
          </div>
</div>
      </div>
    </div>
  );
}