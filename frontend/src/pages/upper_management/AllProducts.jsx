import { API_BASE_URL } from "../../utils/api";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCookie } from "../../utils/csrf";
import Sidebar from "../../components/internal/Sidebar";
import logo from "../../assets/mylora-logo.png";
import "./Dashboard.css";

export default function AllProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "product_id", direction: "asc" });

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add" or "edit"
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState({ name: "", unit_price: "", unit: "", branch_id: "" });
  const [formError, setFormError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchBranches();
  }, []);

  const fetchProducts = () => {
    fetch(`${API_BASE_URL}/api/um/products/`, { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setFilteredProducts(data);
      })
      .catch(err => console.error("Failed to load products", err));
  };

  const fetchBranches = () => {
    fetch(`${API_BASE_URL}/api/um/branches/`, { credentials: "include" })
      .then(res => res.json())
      .then(data => setBranches(data))
      .catch(err => console.error("Failed to load branches", err));
  };

  // Search + sort
  useEffect(() => {
    let filtered = products;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      filtered = products.filter(p =>
        p.product_id.toString().includes(s) ||
        p.name.toLowerCase().includes(s) ||
        p.unit.toLowerCase().includes(s) ||
        (p.branch_name || "").toLowerCase().includes(s)
      );
    }

    const sorted = [...filtered].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (sortConfig.key === "product_id") {
        aVal = parseInt(aVal) || 0;
        bVal = parseInt(bVal) || 0;
      } else if (sortConfig.key === "unit_price") {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      } else {
        aVal = (aVal || "").toString().toLowerCase();
        bVal = (bVal || "").toString().toLowerCase();
      }

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredProducts(sorted);
  }, [searchTerm, products, sortConfig]);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Open modal
  const openAddModal = () => {
    setModalMode("add");
    setSelectedProduct(null);
    setFormData({ name: "", unit_price: "", unit: "", branch_id: "" });
    setFormError("");
    setShowDeleteConfirm(false);
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setModalMode("edit");
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      unit_price: product.unit_price,
      unit: product.unit,
      branch_id: product.branch_id || "",
    });
    setFormError("");
    setShowDeleteConfirm(false);
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.unit.trim() || !formData.unit_price) {
      setFormError("Name, unit, and unit price are required.");
      return;
    }

    const url = modalMode === "add"
      ? `${API_BASE_URL}/api/um/product/create/`
      : `${API_BASE_URL}/api/um/product/${selectedProduct.product_id}/update/`;

    fetch(url, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie("csrftoken"),
      },
      body: JSON.stringify(formData),
    })
      .then(res => {
        if (!res.ok) return res.json().then(d => { throw new Error(d.error || "Failed"); });
        return res.json();
      })
      .then(() => {
        setShowModal(false);
        fetchProducts();
      })
      .catch(err => setFormError(err.message));
  };

  const handleDelete = () => {
    fetch(`${API_BASE_URL}/api/um/product/${selectedProduct.product_id}/delete/`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie("csrftoken"),
      },
    })
      .then(res => {
        if (!res.ok) return res.json().then(d => { throw new Error(d.error || "Failed"); });
        return res.json();
      })
      .then(() => {
        setShowModal(false);
        fetchProducts();
      })
      .catch(err => setFormError(err.message));
  };

  return (
    <div className="um-dashboard-wrapper">
      {/* HEADER */}
      <header className="um-header-section">
        <div className="um-brand-group">
          <img src={logo} alt="Mylora Logo" className="mylora-logo" />
          <span className="um-system-title">Web Credit System</span>
        </div>
        <div className="um-header-actions">
          <button className="um-logout-btn" onClick={() => navigate("/login")}>
            Logout
          </button>
        </div>
      </header>

      <div className="um-dashboard-body" style={{ display: "flex", flex: 1 }}>
        <Sidebar />

        <main className="um-dashboard-content">
          <h1 className="um-welcome-text">All Products</h1>

          {/* Search + Add */}
          <div style={{ display: "flex", gap: "15px", marginBottom: "25px", alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1, maxWidth: "400px" }}>
              <span style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", fontSize: "18px" }}>🔍</span>
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 10px 10px 45px",
                  fontSize: "16px",
                  border: "1px solid #262626",
                  borderRadius: "8px",
                  backgroundColor: "white"
                }}
              />
            </div>
            <button
              style={{
                padding: "10px 20px",
                fontSize: "16px",
                border: "1px solid #262626",
                borderRadius: "8px",
                backgroundColor: "white",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
              onClick={() => handleSort(sortConfig.key)}
            >
              ↕ Sort By
            </button>
            <button
              onClick={openAddModal}
              style={{
                padding: "10px 24px",
                fontSize: "16px",
                border: "none",
                borderRadius: "8px",
                backgroundColor: "#1E2D1A",
                color: "white",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              + Add Product
            </button>
          </div>

          {/* Products Table */}
          <div style={{
            backgroundColor: "white",
            border: "1px solid #262626",
            borderRadius: "15px",
            overflow: "hidden"
          }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "16px" }}>
              <thead>
                <tr style={{ backgroundColor: "#F9F9F9", borderBottom: "1px solid #262626" }}>
                  {[
                    { key: "product_id", label: "PRODUCT ID" },
                    { key: "name", label: "NAME" },
                    { key: "unit_price", label: "PRICE" },
                    { key: "unit", label: "UNIT" },
                    { key: "branch_name", label: "BRANCH" },
                  ].map(col => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      style={{
                        padding: "15px 20px",
                        textAlign: "left",
                        fontWeight: "700",
                        cursor: "pointer",
                        userSelect: "none"
                      }}
                    >
                      {col.label} {sortConfig.key === col.key && (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ padding: "30px", textAlign: "center", color: "#888" }}>
                      No products found
                    </td>
                  </tr>
                )}
                {filteredProducts.map((product) => (
                  <tr
                    key={product.product_id}
                    onClick={() => openEditModal(product)}
                    style={{ borderBottom: "1px solid #E9ECEF", cursor: "pointer" }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#F9F9F9"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "white"}
                  >
                    <td style={{ padding: "15px 20px", fontWeight: "700" }}>{product.product_id}</td>
                    <td style={{ padding: "15px 20px" }}>{product.name}</td>
                    <td style={{ padding: "15px 20px" }}>
                      ₱ {parseFloat(product.unit_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: "15px 20px" }}>{product.unit}</td>
                    <td style={{ padding: "15px 20px" }}>{product.branch_name || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "white",
              borderRadius: "15px",
              padding: "40px",
              width: "500px",
              maxWidth: "90vw",
              fontFamily: "'Arimo', sans-serif",
            }}
          >
            <h2 style={{ fontSize: "28px", fontWeight: "700", marginTop: 0, marginBottom: "25px", color: "#262626" }}>
              {modalMode === "add" ? "Add Product" : "Edit Product"}
            </h2>

            {formError && (
              <div style={{
                backgroundColor: "#F8D7DA", color: "#842029",
                padding: "10px 15px", borderRadius: "8px", marginBottom: "15px", fontSize: "14px"
              }}>
                {formError}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div>
                <label style={{ display: "block", fontWeight: "600", marginBottom: "5px", fontSize: "16px" }}>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: "100%", padding: "10px 12px", fontSize: "16px",
                    border: "1px solid #262626", borderRadius: "8px", boxSizing: "border-box"
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontWeight: "600", marginBottom: "5px", fontSize: "16px" }}>Unit Price (₱)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.unit_price}
                  onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                  style={{
                    width: "100%", padding: "10px 12px", fontSize: "16px",
                    border: "1px solid #262626", borderRadius: "8px", boxSizing: "border-box"
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontWeight: "600", marginBottom: "5px", fontSize: "16px" }}>Unit</label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="e.g., kg, pcs, box"
                  style={{
                    width: "100%", padding: "10px 12px", fontSize: "16px",
                    border: "1px solid #262626", borderRadius: "8px", boxSizing: "border-box"
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontWeight: "600", marginBottom: "5px", fontSize: "16px" }}>Branch</label>
                <select
                  value={formData.branch_id}
                  onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                  style={{
                    width: "100%", padding: "10px 12px", fontSize: "16px",
                    border: "1px solid #262626", borderRadius: "8px", boxSizing: "border-box",
                    backgroundColor: "white"
                  }}
                >
                  <option value="">— No Branch —</option>
                  {branches.map(b => (
                    <option key={b.branch_id} value={b.branch_id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "30px", gap: "10px" }}>
              <div>
                {modalMode === "edit" && !showDeleteConfirm && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    style={{
                      padding: "10px 20px", fontSize: "16px", fontWeight: "600",
                      border: "1px solid #dc3545", borderRadius: "8px",
                      backgroundColor: "white", color: "#dc3545", cursor: "pointer"
                    }}
                  >
                    Delete
                  </button>
                )}
                {showDeleteConfirm && (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "14px", color: "#dc3545" }}>Are you sure?</span>
                    <button
                      onClick={handleDelete}
                      style={{
                        padding: "8px 16px", fontSize: "14px", fontWeight: "600",
                        border: "none", borderRadius: "8px",
                        backgroundColor: "#dc3545", color: "white", cursor: "pointer"
                      }}
                    >
                      Yes, Delete
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      style={{
                        padding: "8px 16px", fontSize: "14px", fontWeight: "600",
                        border: "1px solid #262626", borderRadius: "8px",
                        backgroundColor: "white", cursor: "pointer"
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: "10px 24px", fontSize: "16px", fontWeight: "600",
                    border: "1px solid #262626", borderRadius: "8px",
                    backgroundColor: "white", cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  style={{
                    padding: "10px 24px", fontSize: "16px", fontWeight: "600",
                    border: "none", borderRadius: "8px",
                    backgroundColor: "#1E2D1A", color: "white", cursor: "pointer"
                  }}
                >
                  {modalMode === "add" ? "Add Product" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
