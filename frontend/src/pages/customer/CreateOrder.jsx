import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function CreateOrder() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);

  useEffect(() => {
    // Fetch available products
    fetch("http://localhost:8000/api/products/", {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load products");
        return res.json();
      })
      .then(setProducts)
      .catch((err) => {
        console.error(err);
        alert("Failed to load products");
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddProduct = (product) => {
    const existing = selectedItems.find((item) => item.product_id === product.product_id);
    if (existing) {
      // Increase quantity
      setSelectedItems(
        selectedItems.map((item) =>
          item.product_id === product.product_id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      // Add new item
      setSelectedItems([
        ...selectedItems,
        {
          product_id: product.product_id,
          name: product.name,
          unit_price: parseFloat(product.unit_price),
          unit: product.unit,
          quantity: 1,
        },
      ]);
    }
  };

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      setSelectedItems(selectedItems.filter((item) => item.product_id !== productId));
    } else {
      setSelectedItems(
        selectedItems.map((item) =>
          item.product_id === productId ? { ...item, quantity: parseFloat(newQuantity) } : item
        )
      );
    }
  };

  const handleRemoveItem = (productId) => {
    setSelectedItems(selectedItems.filter((item) => item.product_id !== productId));
  };

  const calculateTotal = () => {
    return selectedItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  };

  const handleContinue = () => {
    if (selectedItems.length === 0) {
      alert("Please add at least one product to your order");
      return;
    }
    // Save to localStorage and navigate to review
    localStorage.setItem("order_items", JSON.stringify(selectedItems));
    navigate("/orders/review");
  };

  if (loading) {
    return <div style={styles.container}>Loading products...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>Create a purchase request</h1>
        <button onClick={() => navigate("/customer/dashboard")} style={styles.cancelBtn}>
          Cancel
        </button>
      </div>

      <div style={styles.content}>
        {/* Product Search & List */}
        <div style={styles.leftPanel}>
          <h2>Your order</h2>
          
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />

          <div style={styles.productList}>
            {filteredProducts.length === 0 ? (
              <p>No products found</p>
            ) : (
              filteredProducts.map((product) => (
                <div key={product.product_id} style={styles.productCard}>
                  <div>
                    <div style={styles.productName}>{product.name}</div>
                    <div style={styles.productPrice}>
                      ₱{parseFloat(product.unit_price).toFixed(2)}/{product.unit}
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddProduct(product)}
                    style={styles.addBtn}
                  >
                    + Add Product
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Selected Items */}
        <div style={styles.rightPanel}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ITEM</th>
                <th style={styles.th}>QUANTITY</th>
                <th style={styles.th}>AMOUNT</th>
                <th style={styles.th}></th>
              </tr>
            </thead>
            <tbody>
              {selectedItems.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ ...styles.td, textAlign: "center", color: "#999" }}>
                    No items added yet
                  </td>
                </tr>
              ) : (
                selectedItems.map((item) => (
                  <tr key={item.product_id}>
                    <td style={styles.td}>
                      <div>{item.name}</div>
                      <div style={styles.itemUnit}>
                        ₱{item.unit_price.toFixed(2)}/{item.unit}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          handleQuantityChange(item.product_id, e.target.value)
                        }
                        min="0"
                        step="0.01"
                        style={styles.quantityInput}
                      />
                    </td>
                    <td style={styles.td}>
                      ₱{(item.unit_price * item.quantity).toFixed(2)}
                    </td>
                    <td style={styles.td}>
                      <button
                        onClick={() => handleRemoveItem(item.product_id)}
                        style={styles.removeBtn}
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))
              )}
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

          <button
            onClick={handleContinue}
            disabled={selectedItems.length === 0}
            style={{
              ...styles.continueBtn,
              opacity: selectedItems.length === 0 ? 0.5 : 1,
              cursor: selectedItems.length === 0 ? "not-allowed" : "pointer",
            }}
          >
            Continue to Review
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "2rem",
    maxWidth: "1400px",
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
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "2rem",
  },
  leftPanel: {
    background: "#f9f9f9",
    padding: "1.5rem",
    borderRadius: "8px",
  },
  searchInput: {
    width: "100%",
    padding: "0.75rem",
    marginBottom: "1rem",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontSize: "1rem",
  },
  productList: {
    maxHeight: "500px",
    overflowY: "auto",
  },
  productCard: {
    background: "white",
    padding: "1rem",
    marginBottom: "0.75rem",
    borderRadius: "6px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    border: "1px solid #e0e0e0",
  },
  productName: {
    fontWeight: "500",
    marginBottom: "0.25rem",
  },
  productPrice: {
    color: "#666",
    fontSize: "0.9rem",
  },
  addBtn: {
    padding: "0.5rem 1rem",
    background: "#1f3d1a",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  rightPanel: {
    background: "#fff",
    padding: "1.5rem",
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginBottom: "1.5rem",
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
  quantityInput: {
    width: "80px",
    padding: "0.5rem",
    border: "1px solid #ddd",
    borderRadius: "4px",
    textAlign: "center",
  },
  removeBtn: {
    background: "none",
    border: "none",
    color: "#999",
    fontSize: "1.5rem",
    cursor: "pointer",
    padding: "0 0.5rem",
  },
  totalSection: {
    borderTop: "2px solid #333",
    paddingTop: "1rem",
    marginBottom: "1.5rem",
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
  continueBtn: {
    width: "100%",
    padding: "1rem",
    background: "#1f3d1a",
    color: "white",
    border: "none",
    borderRadius: "4px",
    fontSize: "1rem",
    fontWeight: "500",
  },
};