import { API_BASE_URL } from "../../utils/api";
import { MEDIA_BASE_URL } from "../../utils/media";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import paperIcon from "../../assets/paper.png";
import clockIcon from "../../assets/clock.png";
import { handleLogout } from "../../utils/logout";
import logo from "../../assets/mylora-logo.png";
import ReminderModal from "../../components/ReminderModal";
import "./CustomerDetails.css";

export default function CustomerDetails() {
  const navigate = useNavigate();
  const { customerId } = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filePreview, setFilePreview] = useState(null);
  const [showReminderModal, setShowReminderModal] = useState(false);

  async function openFilePreview(rawUrl, label) {
    try {
      const res = await fetch(rawUrl, { credentials: "include" });
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      setFilePreview({ url: blobUrl, label, type: blob.type });
    } catch (err) {
      console.error("Failed to load file", err);
    }
  }

  function closeFilePreview() {
    if (filePreview?.url) URL.revokeObjectURL(filePreview.url);
    setFilePreview(null);
  }

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
        <button className="ub-logout-btn" onClick={() => handleLogout(navigate)}>
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
          <button
            className="cd-adjust-btn"
            onClick={() => setShowReminderModal(true)}
            style={{ backgroundColor: "#dc3545", color: "white", border: "none" }}
          >
            Send Reminder
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

        </div>

        {/* Supporting Documents */}
        {customer.documents && customer.documents.length > 0 && (
          <div className="cd-section">
            <h3 className="cd-section-title">Supporting Documents</h3>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {customer.documents.map((doc, i) => (
                <button
                  key={i}
                  onClick={() => openFilePreview(`${MEDIA_BASE_URL}${doc.url}`, doc.name)}
                  style={{ padding: "8px 20px", border: "1px solid #262626", borderRadius: "8px", color: "#1f3d1a", fontWeight: "600", fontSize: "14px", background: "white", cursor: "pointer" }}
                >
                  {doc.name} ↗
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Government Issued ID */}
        {customer.gov_id && (
          <div className="cd-section">
            <h3 className="cd-section-title">Government Issued ID</h3>
            <button
              onClick={() => openFilePreview(`${MEDIA_BASE_URL}${customer.gov_id}`, "Government-Issued ID")}
              style={{ padding: "8px 20px", border: "1px solid #262626", borderRadius: "8px", color: "#1f3d1a", fontWeight: "600", fontSize: "14px", background: "white", cursor: "pointer" }}
            >
              View ID ↗
            </button>
          </div>
        )}

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

      {filePreview && (
        <div
          onClick={closeFilePreview}
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ backgroundColor: "white", borderRadius: "15px", width: "80vw", maxWidth: "900px", height: "85vh", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "'Arimo', sans-serif" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", borderBottom: "1px solid #e0e0e0" }}>
              <span style={{ fontWeight: "700", fontSize: "16px" }}>{filePreview.label}</span>
              <button
                onClick={closeFilePreview}
                style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#555", lineHeight: 1 }}
              >
                ×
              </button>
            </div>
            {filePreview.type.startsWith("image/") ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", overflow: "auto" }}>
                <img src={filePreview.url} alt={filePreview.label} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
              </div>
            ) : (
              <embed src={filePreview.url} type="application/pdf" style={{ flex: 1, width: "100%" }} />
            )}
          </div>
        </div>
      )}

      {showReminderModal && (
        <ReminderModal
          customerId={customerId}
          customerName={customer.name}
          onClose={() => setShowReminderModal(false)}
        />
      )}
    </div>
  );
}