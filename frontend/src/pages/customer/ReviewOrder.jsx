import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function ReviewOrder() {
  const navigate = useNavigate();
  const [orderItems, setOrderItems] = useState([]);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [deliveryDetails, setDeliveryDetails] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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
      })
      .catch((err) => console.error(err));
  }, [navigate]);

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  };

  const exceedsCredit = () => {
    if (!customerInfo) return false;
    const total = calculateTotal();
    const available = parseFloat(customerInfo.credit.available_credit);
    return total > available;
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

  if (orderItems.length === 0 || !deliveryDetails) {
    return <div style={styles.container}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>Review your purchase request</h1>
        <button onClick={() => navigate("/customer/dashboard")} style={styles.cancelBtn}>
          Cancel
        </button>
      </div>

      <div style={styles.content}>
        {/* Credit Warning */}
        {exceedsCredit() && (
          <div style={styles.warningBox}>
            <strong>⚠️ Notice:</strong> This order exceeds your available credit limit. 
            Your order will be submitted for override approval by management.
          </div>
        )}

        {/* Customer Information */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Customer Information</h3>
          {customerInfo && (
            <div>
              <p><strong>{customerInfo.user.name}</strong></p>
              <p>Available Credit: ₱{parseFloat(customerInfo.credit.available_credit).toLocaleString()}</p>
            </div>
          )}
        </div>

        {/* Delivery Details */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Delivery Details</h3>
          <p><strong>Mode:</strong> {deliveryDetails.deliveryMode === "DELIVERY" ? "Delivery" : "Pick up in-store"}</p>
          {deliveryDetails.deliveryMode === "DELIVERY" && (
            <div style={{ marginTop: "0.5rem" }}>
              <p>{deliveryDetails.address1}</p>
              {deliveryDetails.address2 && <p>{deliveryDetails.address2}</p>}
              <p>{deliveryDetails.barangay}, {deliveryDetails.city} {deliveryDetails.zipCode}</p>
            </div>
          )}
          <button
            onClick={() => navigate("/orders/delivery")}
            style={styles.editBtn}
          >
            Edit Delivery Details
          </button>
        </div>

        {/* Order Items */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Your order</h3>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ITEM</th>
                <th style={styles.th}>QUANTITY</th>
                <th style={styles.th}>AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {orderItems.map((item, index) => (
                <tr key={index}>
                  <td style={styles.td}>
                    <div>{item.name}</div>
                    <div style={styles.itemUnit}>
                      ₱{item.unit_price.toFixed(2)}/{item.unit}
                    </div>
                  </td>
                  <td style={styles.td}>{item.quantity}</td>
                  <td style={styles.td}>
                    ₱{(item.unit_price * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={styles.totalSection}>
            <div style={styles.totalRow}>
              <span style={styles.totalLabel}>TOTAL</span>
              <span style={styles.totalAmount}>
                ₱{calculateTotal().toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={styles.actions}>
          <button
            onClick={() => navigate("/orders/create")}
            style={styles.backBtn}
          >
            Back to Edit Order
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              ...styles.submitBtn,
              opacity: submitting ? 0.5 : 1,
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "Submitting..." : "Submit Purchase Request"}
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
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2rem",
  },
  cancelBtn: {
    padding: "0.5rem 1.5rem",
    background: "#fff",
    border: "1px solid #ccc",
    borderRadius: "4px",
    cursor: "pointer",
  },
  content: {
    background: "#fff",
  },
  warningBox: {
    background: "#fff3cd",
    border: "2px solid #ffc107",
    borderRadius: "6px",
    padding: "1rem",
    marginBottom: "1.5rem",
    color: "#856404",
    fontSize: "0.95rem",
    lineHeight: "1.5",
  },
  section: {
    marginBottom: "2rem",
    padding: "1.5rem",
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
  },
  sectionTitle: {
    marginBottom: "1rem",
    fontSize: "1.125rem",
    fontWeight: "600",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: "0.75rem",
    borderBottom: "2px solid #e0e0e0",
    fontWeight: "600",
    fontSize: "0.875rem",
    color: "#666",
  },
  td: {
    padding: "1rem 0.75rem",
    borderBottom: "1px solid #f0f0f0",
  },
  itemUnit: {
    fontSize: "0.875rem",
    color: "#666",
    marginTop: "0.25rem",
  },
  totalSection: {
    borderTop: "2px solid #333",
    paddingTop: "1rem",
    marginTop: "1rem",
  },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontWeight: "600",
    fontSize: "1.125rem",
  },
  totalAmount: {
    fontWeight: "700",
    fontSize: "1.5rem",
    color: "#1f3d1a",
  },
  radioGroup: {
    display: "flex",
    gap: "2rem",
  },
  radioLabel: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    cursor: "pointer",
  },
  label: {
    display: "block",
    marginBottom: "0.5rem",
    fontWeight: "500",
  },
  textarea: {
    width: "100%",
    padding: "0.75rem",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontSize: "1rem",
    fontFamily: "inherit",
    resize: "vertical",
  },
  actions: {
    display: "flex",
    gap: "1rem",
    justifyContent: "flex-end",
  },
  backBtn: {
    padding: "0.75rem 1.5rem",
    background: "#fff",
    border: "1px solid #ccc",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "1rem",
  },
  editBtn: {
    marginTop: "1rem",
    padding: "0.5rem 1rem",
    background: "#fff",
    border: "1px solid #1f3d1a",
    color: "#1f3d1a",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.9rem",
  },
  submitBtn: {
    padding: "0.75rem 2rem",
    background: "#1f3d1a",
    color: "white",
    border: "none",
    borderRadius: "4px",
    fontSize: "1rem",
    fontWeight: "500",
  },
};