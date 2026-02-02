import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function ReviewOrder() {
  const navigate = useNavigate();
  const [orderItems, setOrderItems] = useState([]);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [deliveryMode, setDeliveryMode] = useState("DELIVERY");
  const [shippingAddress, setShippingAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Load order items from localStorage
    const items = localStorage.getItem("order_items");
    if (!items) {
      navigate("/orders/create");
      return;
    }
    setOrderItems(JSON.parse(items));

    // Fetch customer info for default address
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

  const handleSubmit = async () => {
    if (!shippingAddress && deliveryMode === "DELIVERY") {
      alert("Please enter delivery address");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("http://localhost:8000/api/orders/create/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          delivery_mode: deliveryMode,
          shipping_address: deliveryMode === "DELIVERY" ? shippingAddress : "For Pickup",
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
      
      // Navigate to success page
      navigate("/orders/success", { state: { orderId: data.order_id } });
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (orderItems.length === 0) {
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

        {/* Delivery Details */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Delivery Details</h3>
          
          <div style={styles.radioGroup}>
            <label style={styles.radioLabel}>
              <input
                type="radio"
                value="DELIVERY"
                checked={deliveryMode === "DELIVERY"}
                onChange={(e) => setDeliveryMode(e.target.value)}
              />
              Delivery
            </label>
            <label style={styles.radioLabel}>
              <input
                type="radio"
                value="PICKUP"
                checked={deliveryMode === "PICKUP"}
                onChange={(e) => setDeliveryMode(e.target.value)}
              />
              Pick-up
            </label>
          </div>

          {deliveryMode === "DELIVERY" && (
            <div style={{ marginTop: "1rem" }}>
              <label style={styles.label}>Delivery Address *</label>
              <textarea
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="Enter delivery address..."
                rows="3"
                style={styles.textarea}
              />
            </div>
          )}

          {deliveryMode === "PICKUP" && (
            <p style={{ marginTop: "1rem", color: "#666" }}>
              Your order will be ready for pick-up at your designated branch.
            </p>
          )}
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