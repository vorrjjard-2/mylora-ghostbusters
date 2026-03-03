import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/internal/Sidebar";
import logo from "../../assets/mylora-logo.png";
import "../upper_management/Dashboard.css";

export default function CustomerDatabase() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/api/um/customers/", {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load customers");
        return res.json();
      })
      .then(data => {
        setCustomers(data);
        setFilteredCustomers(data);
      })
      .catch((err) => {
        console.error(err);
        alert("Failed to load customers");
      })
      .finally(() => setLoading(false));
  }, []);

  // Handle search
  useEffect(() => {
    let filtered;
    if (searchTerm === "") {
      filtered = customers;
    } else {
      const searchLower = searchTerm.toLowerCase();
      filtered = customers.filter(customer => 
        customer.name.toLowerCase().includes(searchLower) ||
        (customer.phone && customer.phone.toLowerCase().includes(searchLower)) ||
        (customer.email && customer.email.toLowerCase().includes(searchLower))
      );
    }
    
    // Re-apply current sort to filtered results
    if (sortConfig.key) {
      const sorted = [...filtered].sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (sortConfig.key === "credit_limit" || sortConfig.key === "outstanding_balance") {
          aVal = parseFloat(aVal) || 0;
          bVal = parseFloat(bVal) || 0;
        } else if (typeof aVal === "string") {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }

        if (aVal < bVal) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aVal > bVal) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
      setFilteredCustomers(sorted);
    } else {
      setFilteredCustomers(filtered);
    }
  }, [searchTerm, customers, sortConfig]);

  // Handle sorting
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });

    const sorted = [...filteredCustomers].sort((a, b) => {
      let aVal = a[key];
      let bVal = b[key];

      if (key === "credit_limit" || key === "outstanding_balance") {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      } else if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) {
        return direction === "asc" ? -1 : 1;
      }
      if (aVal > bVal) {
        return direction === "asc" ? 1 : -1;
      }
      return 0;
    });

    setFilteredCustomers(sorted);
  };

  if (loading) {
    return (
      <div className="um-dashboard-wrapper">
        <header className="um-header-section">
          <div className="um-brand-group">
            <img src={logo} alt="Mylora Logo" className="mylora-logo" />
            <span className="um-system-title">Web Credit System</span>
          </div>
        </header>
        <div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>
      </div>
    );
  }

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
          <h1 className="um-welcome-text">Customer Database</h1>

          {/* Search and Sort Controls */}
          <div style={{ display: "flex", gap: "15px", marginBottom: "25px" }}>
            <div style={{ position: "relative", flex: 1, maxWidth: "400px" }}>
              <span style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", fontSize: "18px" }}>🔍</span>
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search customers"
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
          </div>

          {/* Customer Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {filteredCustomers.length === 0 && (
              <div style={{ padding: "30px", textAlign: "center", color: "#888" }}>
                No customers found
              </div>
            )}
            {filteredCustomers.map((customer) => (
              <div
                key={customer.customer_id}
                style={{
                  backgroundColor: "white",
                  border: "1px solid #262626",
                  borderRadius: "15px",
                  padding: "20px 30px",
                  cursor: "pointer",
                  transition: "background-color 0.2s"
                }}
                onClick={() => navigate(`/upper-management/customer/${customer.customer_id}`)}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#F9F9F9"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "white"}
              >
                <h3 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "12px" }}>
                  {customer.name}
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "15px" }}>
                  <div style={{ fontSize: "16px" }}>
                    <span style={{ fontWeight: "600" }}>Phone Number:</span> {customer.phone || "N/A"}
                  </div>
                  <div style={{ fontSize: "16px" }}>
                    <span style={{ fontWeight: "600" }}>Email Address:</span> {customer.email || "N/A"}
                  </div>
                </div>
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between",
                  paddingTop: "15px",
                  borderTop: "1px solid #E9ECEF"
                }}>
                  <div>
                    <div style={{ fontSize: "14px", color: "#666", fontWeight: "600", marginBottom: "4px" }}>
                      Credit Limit:
                    </div>
                    <div style={{ fontSize: "18px", fontWeight: "700" }}>
                      ₱ {parseFloat(customer.credit_limit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "14px", color: "#666", fontWeight: "600", marginBottom: "4px" }}>
                      Outstanding Balance:
                    </div>
                    <div style={{ fontSize: "18px", fontWeight: "700", color: "#b03a2e" }}>
                      ₱ {parseFloat(customer.outstanding_balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}