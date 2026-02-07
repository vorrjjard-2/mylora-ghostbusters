import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/mylora-logo.png";
import "./CreateOrder.css";


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
    // Save to localStorage and navigate to delivery details
    localStorage.setItem("order_items", JSON.stringify(selectedItems));
    navigate("/orders/delivery");
  };

  if (loading) {
    return <div className="order-container">Loading products...</div>;  }

    return (
        <div className="order-container">
            {/* HEADER */}
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
              <h2>Your order</h2>
            </div>
          </div>

          <div className="order-content">
            <div className="order-left-panel">              
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="order-search-input"
              />

              <div className="order-product-list">
                {filteredProducts.length === 0 ? (
                  <p>No products found</p>
                ) : (
                  filteredProducts.map((product) => (
                    <div key={product.product_id} className="order-product-card">
                      <div>
                        <div className="order-product-name">{product.name}</div>
                        <div className="order-product-price">
                          ₱{parseFloat(product.unit_price).toLocaleString("en-PH", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}/{product.unit}                        
                          </div>
                      </div>
                      <button
                        onClick={() => handleAddProduct(product)}
                        className="order-add-btn"
                      >
                        + Add Product
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="order-right-panel">
              <table className="order-table">
                <thead>
                  <tr>
                    <th className="order-th">ITEM</th>
                    <th className="order-th">QUANTITY</th>
                    <th className="order-th">AMOUNT</th>
                    <th className="order-th"></th>
                  </tr>
                </thead>
                <tbody>
                  {selectedItems.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="order-td empty-msg">
                        No items added yet
                      </td>
                    </tr>
                  ) : (
                    selectedItems.map((item) => (
                      <tr key={item.product_id}>
                        <td className="order-td">
                          <div>{item.name}</div>
                          <div className="order-item-unit">
                            ₱{item.unit_price.toFixed(2)}/{item.unit}
                          </div>
                        </td>
                        <td className="order-td">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              handleQuantityChange(item.product_id, e.target.value)
                            }
                            min="0"
                            step="0.01"
                            className="order-quantity-input"
                          />
                        </td>
                        <td className="order-td">
                          ₱{(item.unit_price * item.quantity).toFixed(2)}
                        </td>
                        <td className="order-td">
                          <button
                            onClick={() => handleRemoveItem(item.product_id)}
                            className="order-remove-btn"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <div className="order-total-section">
                <div className="order-total-row">
                  <span className="order-total-label">TOTAL</span>
                  <span className="order-total-amount">
                    ₱{calculateTotal().toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <button
                onClick={handleContinue}
                disabled={selectedItems.length === 0}
                className={`order-continue-btn ${selectedItems.length === 0 ? 'disabled' : ''}`}
              >
                Continue to Review
              </button>
            </div>
          </div>
        </div>
      );
    }