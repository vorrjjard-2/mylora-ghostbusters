import apiFetch from "../../utils/apiFetch";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/internal/Sidebar";
import { handleLogout } from "../../utils/logout";
import usePagination from "../../hooks/usePagination";
import Pagination from "../../components/Pagination";
import logo from "../../assets/mylora-logo.png";
import ReminderModal from "../../components/ReminderModal";
import "../upper_management/Dashboard.css";

export default function CustomerDatabase() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [reminderTarget, setReminderTarget] = useState(null);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [loading, setLoading] = useState(true);

  const { currentPage, totalPages, paginatedData, goToPage } = usePagination(filteredCustomers, 5, [searchTerm, sortBy, sortDirection]);

  useEffect(() => {
    apiFetch("/api/um/customers/")
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
    const sorted = [...filtered].sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === "credit_limit" || sortBy === "outstanding_balance") {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      } else if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) {
        return sortDirection === "asc" ? -1 : 1;
      }
      if (aVal > bVal) {
        return sortDirection === "asc" ? 1 : -1;
      }
      return 0;
    });
    setFilteredCustomers(sorted);
  }, [searchTerm, customers, sortBy, sortDirection]);

  const handleSortChange = (newSortBy) => {
    if (newSortBy === sortBy) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setSortDirection("asc");
    }
    setShowSortMenu(false);
  };

  const sortOptions = [
    { value: "name", label: "Name" },
    { value: "credit_limit", label: "Credit Limit" },
    { value: "outstanding_balance", label: "Outstanding Balance" },
  ];

  const getSortLabel = () => {
    const opt = sortOptions.find(o => o.value === sortBy);
    return opt ? opt.label : "Name";
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
          <button className="um-logout-btn" onClick={() => handleLogout(navigate)}>
            Logout
          </button>
        </div>
      </header>

      <div className="um-dashboard-body" style={{ display: "flex", flex: 1 }}>
        <Sidebar />

        <main className="um-dashboard-content">
          <h1 className="um-welcome-text">Customer Database</h1>

          {/* Search and Sort Controls */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "14px", color: "#666" }}>Sorted by:</span>
              <span style={{
                padding: "6px 12px",
                backgroundColor: "#1E2D1A",
                color: "white",
                borderRadius: "20px",
                fontSize: "14px",
                fontWeight: "600",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px"
              }}>
                {getSortLabel()}
                <span style={{ fontSize: "12px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
              </span>
            </div>
            <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
              <div style={{ position: "relative", maxWidth: "300px" }}>
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
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setShowSortMenu(!showSortMenu)}
                  style={{
                    padding: "10px 20px",
                    fontSize: "16px",
                    border: "1px solid #262626",
                    borderRadius: "8px",
                    backgroundColor: "white",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontWeight: "600"
                  }}
                >
                  <span>↕</span>
                  <span>Sort By: {getSortLabel()}</span>
                  <span style={{ fontSize: "12px", color: "#666" }}>
                    {sortDirection === "asc" ? "↑" : "↓"}
                  </span>
                </button>

                {showSortMenu && (
                  <div style={{
                    position: "absolute",
                    top: "calc(100% + 5px)",
                    right: 0,
                    backgroundColor: "white",
                    border: "1px solid #262626",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                    minWidth: "200px",
                    zIndex: 1000
                  }}>
                    {sortOptions.map((option, index) => (
                      <div
                        key={option.value}
                        onClick={() => handleSortChange(option.value)}
                        style={{
                          padding: "12px 16px",
                          cursor: "pointer",
                          borderBottom: index < sortOptions.length - 1 ? "1px solid #e0e0e0" : "none",
                          backgroundColor: sortBy === option.value ? "#f5f5f5" : "white",
                          fontWeight: sortBy === option.value ? "600" : "400",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          borderRadius: index === sortOptions.length - 1 ? "0 0 8px 8px" : index === 0 ? "8px 8px 0 0" : "0"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f9f9f9"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = sortBy === option.value ? "#f5f5f5" : "white"}
                      >
                        <span>{option.label}</span>
                        {sortBy === option.value && <span>{sortDirection === "asc" ? "↑" : "↓"}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Customer Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {filteredCustomers.length === 0 && (
              <div style={{ padding: "30px", textAlign: "center", color: "#888" }}>
                No customers found
              </div>
            )}
            {paginatedData.map((customer) => (
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
                  <div style={{ display: "flex", alignItems: "flex-end" }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setReminderTarget(customer); }}
                      style={{
                        padding: "8px 18px", fontSize: "14px", fontWeight: "600",
                        border: "none", borderRadius: "8px",
                        backgroundColor: "#dc3545", color: "white", cursor: "pointer",
                      }}
                    >
                      Remind
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={goToPage} />

          {reminderTarget && (
            <ReminderModal
              customerId={reminderTarget.customer_id}
              customerName={reminderTarget.name}
              onClose={() => setReminderTarget(null)}
            />
          )}
        </main>
      </div>
    </div>
  );
}