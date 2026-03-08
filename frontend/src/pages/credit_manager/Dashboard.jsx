import { API_BASE_URL } from "../../utils/api";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CMSidebar from "../../components/credit_manager/CMSidebar";
import logo from "../../assets/mylora-logo.png";
import ReminderModal from "../../components/ReminderModal";
import "../upper_management/Dashboard.css";

export default function CreditManagerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState({ username: "" });

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/me/`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => { if (data.username) setUser({ username: data.username }); })
      .catch(console.error);
  }, []);

  const [creditData, setCreditData] = useState(null);
  const [allOrders, setAllOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [allPayments, setAllPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(null);
  const [dashTab, setDashTab] = useState("credit");
  
  // Sorting states
  const [sortBy, setSortBy] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");
  const [showSortMenu, setShowSortMenu] = useState(false);
  
  // Filtered and sorted data
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [reminderTarget, setReminderTarget] = useState(null);

  // Dashboard home view sorted data
  const [sortedDashOrders, setSortedDashOrders] = useState([]);
  const [sortedDashPayments, setSortedDashPayments] = useState([]);


  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE_URL}/api/cm/pending-orders/`, { credentials: "include" }).then((r) => r.json()),
      fetch(`${API_BASE_URL}/api/cm/all-orders/`, { credentials: "include" }).then((r) => r.json()),
      fetch(`${API_BASE_URL}/api/cm/pending-payments/`, { credentials: "include" }).then((r) => r.json()),
      fetch(`${API_BASE_URL}/api/cm/all-payments/`, { credentials: "include" }).then((r) => r.json()),
      fetch(`${API_BASE_URL}/api/cm/customers/`, { credentials: "include" }).then((r) => r.json()),
    ])
      .then(([cd, ao, pm, ap, cust]) => {
        setCreditData(cd);
        setAllOrders(ao);
        setPayments(pm);
        setAllPayments(ap);
        setCustomers(cust);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);


  // Update filtered and sorted data whenever dependencies change
  useEffect(() => {
    // Credit Approval - Pending tab
    if (creditData?.pending_orders && activeTab === "credit") {
      const sorted = [...creditData.pending_orders].sort((a, b) => {
        let comparison = 0;
        if (sortBy === "order_id") {
          comparison = a.order_id - b.order_id;
        } else if (sortBy === "date") {
          comparison = new Date(a.date_ordered) - new Date(b.date_ordered);
        }
        return sortDirection === "asc" ? comparison : -comparison;
      });
      setFilteredOrders(sorted);
    }

    // Credit Approval - View All tab
    if (activeTab === "credit-all") {
      const term = searchTerm.toLowerCase();
      const filtered = allOrders.filter((o) =>
        !term ||
        String(o.order_id).includes(term) ||
        o.customer_name.toLowerCase().includes(term)
      );
      const sorted = filtered.sort((a, b) => {
        let comparison = 0;
        if (sortBy === "order_id") {
          comparison = a.order_id - b.order_id;
        } else if (sortBy === "status") {
          comparison = (a.status || "").localeCompare(b.status || "");
        } else if (sortBy === "date") {
          comparison = new Date(a.date_ordered) - new Date(b.date_ordered);
        }
        return sortDirection === "asc" ? comparison : -comparison;
      });
      setFilteredOrders(sorted);
    }

    // Payment Review - Pending tab
    if (payments && activeTab === "payment") {
      const sorted = [...payments].sort((a, b) => {
        let comparison = 0;
        if (sortBy === "customer") {
          comparison = (a.customer_name || "").localeCompare(b.customer_name || "");
        } else if (sortBy === "amount") {
          comparison = parseFloat(a.amount_paid) - parseFloat(b.amount_paid);
        } else if (sortBy === "date") {
          comparison = new Date(a.date_paid) - new Date(b.date_paid);
        }
        return sortDirection === "asc" ? comparison : -comparison;
      });
      setFilteredPayments(sorted);
    }

    // Payment Review - View All tab
    if (activeTab === "payment-all") {
      const sorted = [...allPayments].sort((a, b) => {
        let comparison = 0;
        if (sortBy === "customer") {
          comparison = (a.customer_name || "").localeCompare(b.customer_name || "");
        } else if (sortBy === "amount") {
          comparison = parseFloat(a.amount_paid) - parseFloat(b.amount_paid);
        } else if (sortBy === "date") {
          comparison = new Date(a.date_paid) - new Date(b.date_paid);
        }
        return sortDirection === "asc" ? comparison : -comparison;
      });
      setFilteredPayments(sorted);
    }

    // Credit Adjustment (customers) sorting + search
    if (customers && activeTab === "adjustment") {
      let filtered = customers.filter((c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

      const sorted = [...filtered].sort((a, b) => {
        let comparison = 0;
        if (sortBy === "name") {
          comparison = (a.name || "").localeCompare(b.name || "");
        } else if (sortBy === "credit_limit") {
          comparison = parseFloat(a.credit_limit) - parseFloat(b.credit_limit);
        } else if (sortBy === "outstanding") {
          comparison = parseFloat(a.outstanding_balance) - parseFloat(b.outstanding_balance);
        }
        return sortDirection === "asc" ? comparison : -comparison;
      });
      setFilteredCustomers(sorted);
    }

    // Dashboard home view - Pending Credit
    if (!activeTab && dashTab === "credit" && creditData?.pending_orders) {
      const sorted = [...creditData.pending_orders].sort((a, b) => {
        let comparison = 0;
        if (sortBy === "order_id") {
          comparison = a.order_id - b.order_id;
        } else if (sortBy === "date") {
          comparison = new Date(a.date_ordered) - new Date(b.date_ordered);
        }
        return sortDirection === "asc" ? comparison : -comparison;
      });
      setSortedDashOrders(sorted);
    }

    // Dashboard home view - Pending Payment
    if (!activeTab && dashTab === "payment" && payments) {
      const sorted = [...payments].sort((a, b) => {
        let comparison = 0;
        if (sortBy === "customer") {
          comparison = (a.customer_name || "").localeCompare(b.customer_name || "");
        } else if (sortBy === "amount") {
          comparison = parseFloat(a.amount_paid) - parseFloat(b.amount_paid);
        } else if (sortBy === "date") {
          comparison = new Date(a.date_paid) - new Date(b.date_paid);
        }
        return sortDirection === "asc" ? comparison : -comparison;
      });
      setSortedDashPayments(sorted);
    }
  }, [activeTab, dashTab, creditData, allOrders, payments, allPayments, customers, sortBy, sortDirection, searchTerm]);

  const handleSortChange = (newSortBy) => {
    if (newSortBy === sortBy) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setSortDirection(newSortBy === "date" ? "desc" : "asc");
    }
    setShowSortMenu(false);
  };

  const getSortLabel = () => {
    // Sidebar tabs
    if (activeTab === "credit" || activeTab === "credit-all") {
      if (sortBy === "date") return "Date Ordered";
      if (sortBy === "status") return "Status";
      if (sortBy === "order_id") return "Order ID";
    } else if (activeTab === "payment" || activeTab === "payment-all") {
      if (sortBy === "date") return "Date Paid";
      if (sortBy === "customer") return "Customer Name";
      if (sortBy === "amount") return "Amount Paid";
    } else if (activeTab === "adjustment") {
      if (sortBy === "name") return "Customer Name";
      if (sortBy === "credit_limit") return "Credit Limit";
      if (sortBy === "outstanding") return "Outstanding Balance";
    }
    // Dashboard home view tabs
    if (!activeTab && dashTab === "credit") {
      if (sortBy === "date") return "Date Ordered";
      if (sortBy === "order_id") return "Order ID";
    } else if (!activeTab && dashTab === "payment") {
      if (sortBy === "date") return "Date Paid";
      if (sortBy === "customer") return "Customer Name";
      if (sortBy === "amount") return "Amount Paid";
    }
    return "Date";
  };

  const getSortOptions = () => {
    // Sidebar tabs
    if (activeTab === "credit" || activeTab === "credit-all") {
      return [
        { value: "date", label: "Date Ordered" },
        { value: "status", label: "Status" },
        { value: "order_id", label: "Order ID" }
      ];
    } else if (activeTab === "payment" || activeTab === "payment-all") {
      return [
        { value: "date", label: "Date Paid" },
        { value: "customer", label: "Customer Name" },
        { value: "amount", label: "Amount Paid" }
      ];
    } else if (activeTab === "adjustment") {
      return [
        { value: "name", label: "Customer Name" },
        { value: "credit_limit", label: "Credit Limit" },
        { value: "outstanding", label: "Outstanding Balance" }
      ];
    }
    // Dashboard home view tabs
    if (!activeTab && dashTab === "credit") {
      return [
        { value: "date", label: "Date Ordered" },
        { value: "order_id", label: "Order ID" }
      ];
    } else if (!activeTab && dashTab === "payment") {
      return [
        { value: "date", label: "Date Paid" },
        { value: "customer", label: "Customer Name" },
        { value: "amount", label: "Amount Paid" }
      ];
    }
    return [];
  };

  const renderSortDropdown = () => (
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
          {getSortOptions().map((option, index) => (
            <div
              key={option.value}
              onClick={() => handleSortChange(option.value)}
              style={{
                padding: "12px 16px",
                cursor: "pointer",
                borderBottom: index < getSortOptions().length - 1 ? "1px solid #e0e0e0" : "none",
                backgroundColor: sortBy === option.value ? "#f5f5f5" : "white",
                fontWeight: sortBy === option.value ? "600" : "400",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderRadius: index === getSortOptions().length - 1 ? "0 0 8px 8px" : "0"
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
  );

  const renderSortIndicator = () => (
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
  );

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

  function fmt(n) {
    return parseFloat(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
        <CMSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="um-dashboard-content">
          {/* WELCOME BANNER */}
          <h1 className="um-welcome-text">
            {!activeTab && `Hello, ${user.username}`}
            {(activeTab === "credit" || activeTab === "credit-all") && "Credit Approval"}
            {(activeTab === "payment" || activeTab === "payment-all") && "Payment Review"}
            {activeTab === "adjustment" && "Credit Adjustment"}
          </h1>

          {/* STAT CARDS - Only show on dashboard view */}
          {!activeTab && (
            <>
              <div className="um-stats-container">
                <div className="um-stat-card">
                  <span className="um-stat-label">Pending Credit Approval</span>
                  <span className="um-stat-number">{creditData?.pending_credit_count ?? 0}</span>
                </div>
                <div className="um-stat-card">
                  <span className="um-stat-label">Pending Payment Review</span>
                  <span className="um-stat-number">{creditData?.pending_payment_count ?? 0}</span>
                </div>
              </div>

              {/* Tabbed full-width layout for dashboard */}
              <div style={{ marginTop: "30px" }}>
                <div style={{ display: "flex", gap: "30px", borderBottom: "2px solid #e0e0e0", marginBottom: "20px" }}>
                  <button
                    onClick={() => setDashTab("credit")}
                    style={{
                      fontSize: "16px",
                      fontWeight: "600",
                      color: dashTab === "credit" ? "#1f3d1a" : "#888",
                      borderBottom: dashTab === "credit" ? "3px solid #1f3d1a" : "none",
                      marginBottom: "-2px",
                      paddingBottom: "10px",
                      background: "none",
                      border: "none",
                      borderBottom: dashTab === "credit" ? "3px solid #1f3d1a" : "none",
                      cursor: "pointer"
                    }}
                  >
                    Pending Credit Approval
                  </button>
                  <button
                    onClick={() => setDashTab("payment")}
                    style={{
                      fontSize: "16px",
                      fontWeight: "600",
                      color: dashTab === "payment" ? "#1f3d1a" : "#888",
                      borderBottom: dashTab === "payment" ? "3px solid #1f3d1a" : "none",
                      marginBottom: "-2px",
                      paddingBottom: "10px",
                      background: "none",
                      border: "none",
                      cursor: "pointer"
                    }}
                  >
                    Pending Payment Review
                  </button>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                  {renderSortIndicator()}
                  {renderSortDropdown()}
                </div>

                {dashTab === "credit" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    {sortedDashOrders.length === 0 && (
                      <p style={{ color: "#888", padding: "1rem" }}>No pending orders.</p>
                    )}
                    {sortedDashOrders.map((order) => (
                      <div
                        key={order.order_id}
                        className="um-request-item"
                        onClick={() => navigate(`/credit-manager/approve/${order.order_id}`)}
                        style={{ cursor: "pointer" }}
                      >
                        <div className="um-request-info">
                          <div className="um-request-id">ORDER ID {order.order_id}</div>
                          <div className="um-request-sub">Ordered by: {order.customer_name}</div>
                        </div>
                        <div className="um-request-date">Date Ordered: {order.date_ordered}</div>
                      </div>
                    ))}
                  </div>
                )}

                {dashTab === "payment" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    {sortedDashPayments.length === 0 && (
                      <p style={{ color: "#888", padding: "1rem" }}>No pending payments.</p>
                    )}
                    {sortedDashPayments.map((p) => (
                      <div
                        key={p.payment_id}
                        className="um-request-item"
                        onClick={() => navigate(`/credit-manager/payment/${p.payment_id}`)}
                        style={{ cursor: "pointer" }}
                      >
                        <div className="um-request-info">
                          <div className="um-request-id">{p.customer_name}</div>
                          <div className="um-request-sub">Amount paid: ₱ {fmt(p.amount_paid)}</div>
                        </div>
                        <div className="um-request-date">Date Paid: {p.date_paid}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* CREDIT APPROVAL LIST - PENDING */}
          {activeTab === "credit" && (
            <>
              {/* Tabs */}
              <div style={{ display: "flex", gap: "30px", borderBottom: "2px solid #e0e0e0", marginBottom: "20px" }}>
                <button
                  onClick={() => setActiveTab("credit")}
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#1f3d1a",
                    borderBottom: "3px solid #1f3d1a",
                    marginBottom: "-2px",
                    paddingBottom: "10px",
                    background: "none",
                    border: "none",
                    cursor: "pointer"
                  }}
                >
                  Pending
                </button>
                <button
                  onClick={() => setActiveTab("credit-all")}
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#888",
                    paddingBottom: "10px",
                    background: "none",
                    border: "none",
                    cursor: "pointer"
                  }}
                >
                  View All
                </button>
              </div>

              {/* Search and Sort */}
              <div style={{ display: "flex", gap: "15px", alignItems: "center", marginBottom: "15px" }}>
                <div style={{ position: "relative", flex: 1, maxWidth: "400px" }}>
                  <span style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", fontSize: "18px" }}>🔍</span>
                  <input
                    type="text"
                    placeholder="Search"
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
                {renderSortIndicator()}
                {renderSortDropdown()}
              </div>

              {/* Orders List */}
              <div className="um-list-container">
                {filteredOrders.length === 0 && (
                  <p style={{ color: "#888", padding: "1rem" }}>No pending orders.</p>
                )}
                {filteredOrders.map((order) => (
                  <div
                    key={order.order_id}
                    className="um-request-item"
                    onClick={() => navigate(`/credit-manager/approve/${order.order_id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="um-request-info">
                      <div className="um-request-id">ORDER ID {order.order_id}</div>
                      <div className="um-request-sub">Ordered by: {order.customer_name}</div>
                    </div>
                    <div className="um-request-date">Date Ordered: {order.date_ordered}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* CREDIT APPROVAL - VIEW ALL */}
          {activeTab === "credit-all" && (
            <>
              {/* Tabs */}
              <div style={{ display: "flex", gap: "30px", borderBottom: "2px solid #e0e0e0", marginBottom: "20px" }}>
                <button
                  onClick={() => setActiveTab("credit")}
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#888",
                    paddingBottom: "10px",
                    background: "none",
                    border: "none",
                    cursor: "pointer"
                  }}
                >
                  Pending
                </button>
                <button
                  onClick={() => setActiveTab("credit-all")}
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#1f3d1a",
                    borderBottom: "3px solid #1f3d1a",
                    marginBottom: "-2px",
                    paddingBottom: "10px",
                    background: "none",
                    border: "none",
                    cursor: "pointer"
                  }}
                >
                  View All
                </button>
              </div>

              {/* Search and Sort */}
              <div style={{ display: "flex", gap: "15px", alignItems: "center", marginBottom: "15px" }}>
                <div style={{ position: "relative", flex: 1, maxWidth: "400px" }}>
                  <span style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", fontSize: "18px" }}>🔍</span>
                  <input
                    type="text"
                    placeholder="Search by order ID or customer"
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
                {renderSortIndicator()}
                {renderSortDropdown()}
              </div>

              {/* Table View */}
              <div style={{
                backgroundColor: "white",
                border: "1px solid #262626",
                borderRadius: "15px",
                overflow: "hidden"
              }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f5f5f5", borderBottom: "1px solid #262626" }}>
                      <th style={{ padding: "15px", textAlign: "left", fontWeight: "600", fontSize: "14px" }}>ORDER ID</th>
                      <th style={{ padding: "15px", textAlign: "left", fontWeight: "600", fontSize: "14px" }}>AMOUNT</th>
                      <th style={{ padding: "15px", textAlign: "left", fontWeight: "600", fontSize: "14px" }}>DATE ORDERED</th>
                      <th style={{ padding: "15px", textAlign: "left", fontWeight: "600", fontSize: "14px" }}>ORDERED BY</th>
                      <th style={{ padding: "15px", textAlign: "left", fontWeight: "600", fontSize: "14px" }}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{ padding: "20px", textAlign: "center", color: "#888" }}>No orders found.</td>
                      </tr>
                    )}
                    {filteredOrders.map((order, idx) => {
                      const statusStyles = {
                        PENDING:   { backgroundColor: "#FFF3CD", color: "#856404" },
                        APPROVED:  { backgroundColor: "#D1E7DD", color: "#0F5132" },
                        REJECTED:  { backgroundColor: "#F8D7DA", color: "#842029" },
                        COMPLETED: { backgroundColor: "#CCE5FF", color: "#004085" },
                      };
                      const badge = statusStyles[order.status] || { backgroundColor: "#e0e0e0", color: "#333" };
                      return (
                        <tr
                          key={order.order_id}
                          onClick={() => navigate(`/credit-manager/approve/${order.order_id}`)}
                          style={{
                            borderBottom: idx < filteredOrders.length - 1 ? "1px solid #e0e0e0" : "none",
                            cursor: "pointer"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f9f9f9"}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "white"}
                        >
                          <td style={{ padding: "15px", fontSize: "14px", fontWeight: "600" }}>{order.order_id}</td>
                          <td style={{ padding: "15px", fontSize: "14px" }}>₱ {fmt(order.amount)}</td>
                          <td style={{ padding: "15px", fontSize: "14px" }}>{order.date_ordered}</td>
                          <td style={{ padding: "15px", fontSize: "14px" }}>{order.customer_name}</td>
                          <td style={{ padding: "15px", fontSize: "14px" }}>
                            <span style={{
                              padding: "4px 12px",
                              borderRadius: "12px",
                              fontSize: "12px",
                              fontWeight: "600",
                              ...badge
                            }}>
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* PAYMENT REVIEW LIST - PENDING */}
          {activeTab === "payment" && (
            <>
              {/* Tabs */}
              <div style={{ display: "flex", gap: "30px", borderBottom: "2px solid #e0e0e0", marginBottom: "20px" }}>
                <button
                  onClick={() => setActiveTab("payment")}
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#1f3d1a",
                    borderBottom: "3px solid #1f3d1a",
                    marginBottom: "-2px",
                    paddingBottom: "10px",
                    background: "none",
                    border: "none",
                    cursor: "pointer"
                  }}
                >
                  Pending
                </button>
                <button
                  onClick={() => setActiveTab("payment-all")}
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#888",
                    paddingBottom: "10px",
                    background: "none",
                    border: "none",
                    cursor: "pointer"
                  }}
                >
                  View All
                </button>
              </div>

              {/* Search and Sort */}
              <div style={{ display: "flex", gap: "15px", alignItems: "center", marginBottom: "15px" }}>
                <div style={{ position: "relative", flex: 1, maxWidth: "400px" }}>
                  <span style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", fontSize: "18px" }}>🔍</span>
                  <input
                    type="text"
                    placeholder="Search"
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
                {renderSortIndicator()}
                {renderSortDropdown()}
              </div>

              {/* Payments List */}
              <div className="um-list-container">
                {filteredPayments.length === 0 && (
                  <p style={{ color: "#888", padding: "1rem" }}>No pending payments.</p>
                )}
                {filteredPayments.map((p) => (
                  <div
                    key={p.payment_id}
                    className="um-request-item"
                    onClick={() => navigate(`/credit-manager/payment/${p.payment_id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="um-request-info">
                      <div className="um-request-id">{p.customer_name}</div>
                      <div className="um-request-sub">Amount paid: ₱ {fmt(p.amount_paid)}</div>
                    </div>
                    <div className="um-request-date">Date Paid: {p.date_paid}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* PAYMENT REVIEW - VIEW ALL */}
          {activeTab === "payment-all" && (
            <>
              {/* Tabs */}
              <div style={{ display: "flex", gap: "30px", borderBottom: "2px solid #e0e0e0", marginBottom: "20px" }}>
                <button
                  onClick={() => setActiveTab("payment")}
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#888",
                    paddingBottom: "10px",
                    background: "none",
                    border: "none",
                    cursor: "pointer"
                  }}
                >
                  Pending
                </button>
                <button
                  onClick={() => setActiveTab("payment-all")}
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#1f3d1a",
                    borderBottom: "3px solid #1f3d1a",
                    marginBottom: "-2px",
                    paddingBottom: "10px",
                    background: "none",
                    border: "none",
                    cursor: "pointer"
                  }}
                >
                  View All
                </button>
              </div>

              {/* Search and Sort */}
              <div style={{ display: "flex", gap: "15px", alignItems: "center", marginBottom: "15px" }}>
                <div style={{ position: "relative", flex: 1, maxWidth: "400px" }}>
                  <span style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", fontSize: "18px" }}>🔍</span>
                  <input
                    type="text"
                    placeholder="Search"
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
                {renderSortIndicator()}
                {renderSortDropdown()}
              </div>

              {/* Table View */}
              <div style={{ 
                backgroundColor: "white", 
                border: "1px solid #262626", 
                borderRadius: "15px", 
                overflow: "hidden"
              }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f5f5f5", borderBottom: "1px solid #262626" }}>
                      <th style={{ padding: "15px", textAlign: "left", fontWeight: "600", fontSize: "14px" }}>CUSTOMER</th>
                      <th style={{ padding: "15px", textAlign: "left", fontWeight: "600", fontSize: "14px" }}>AMOUNT PAID</th>
                      <th style={{ padding: "15px", textAlign: "left", fontWeight: "600", fontSize: "14px" }}>DATE PAID</th>
                      <th style={{ padding: "15px", textAlign: "left", fontWeight: "600", fontSize: "14px" }}>STATUS</th>
                      <th style={{ padding: "15px", textAlign: "left", fontWeight: "600", fontSize: "14px" }}>CONFIRMED BY</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{ padding: "20px", textAlign: "center", color: "#888" }}>No payments found.</td>
                      </tr>
                    )}
                    {filteredPayments.map((p, idx) => {
                      const statusStyles = {
                        PENDING:  { backgroundColor: "#FFF3CD", color: "#856404" },
                        VERIFIED: { backgroundColor: "#D1E7DD", color: "#0F5132" },
                        REJECTED: { backgroundColor: "#F8D7DA", color: "#842029" },
                      };
                      const badge = statusStyles[p.status] || { backgroundColor: "#e0e0e0", color: "#333" };
                      return (
                        <tr
                          key={p.payment_id}
                          onClick={() => navigate(`/credit-manager/payment/${p.payment_id}`)}
                          style={{
                            borderBottom: idx < filteredPayments.length - 1 ? "1px solid #e0e0e0" : "none",
                            cursor: "pointer"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f9f9f9"}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "white"}
                        >
                          <td style={{ padding: "15px", fontSize: "14px", fontWeight: "600" }}>{p.customer_name}</td>
                          <td style={{ padding: "15px", fontSize: "14px" }}>₱ {fmt(p.amount_paid)}</td>
                          <td style={{ padding: "15px", fontSize: "14px" }}>{p.date_paid}</td>
                          <td style={{ padding: "15px", fontSize: "14px" }}>
                            <span style={{ padding: "4px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: "600", ...badge }}>
                              {p.status}
                            </span>
                          </td>
                          <td style={{ padding: "15px", fontSize: "14px", color: p.confirmed_by ? "inherit" : "#aaa" }}>
                            {p.confirmed_by ?? "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* CREDIT ADJUSTMENT - CUSTOMER LIST */}
          {activeTab === "adjustment" && (
            <>
              <p style={{ fontSize: "20px", fontWeight: "600", marginBottom: "20px" }}>
                Credit Customers:
              </p>

              {/* Search and Sort */}
              <div style={{ display: "flex", gap: "15px", alignItems: "center", marginBottom: "15px" }}>
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
                {renderSortIndicator()}
                {renderSortDropdown()}
              </div>

              {/* Customer Cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                {filteredCustomers.length === 0 && (
                  <p style={{ color: "#888", padding: "1rem" }}>No customers found.</p>
                )}
                {filteredCustomers.map((customer) => (
                  <div
                    key={customer.customer_id}
                    onClick={() => navigate(`/credit-manager/customer/${customer.customer_id}/details`)}
                    style={{
                      backgroundColor: "white",
                      border: "1px solid #262626",
                      borderRadius: "15px",
                      padding: "20px 30px",
                      cursor: "pointer",
                      transition: "background-color 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#F9F9F9"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "white"}
                  >
                    <h3 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "15px" }}>
                      {customer.name}
                    </h3>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <div style={{ fontSize: "16px" }}>
                          <span style={{ fontWeight: "600" }}>Phone Number:</span> {customer.phone || "N/A"}
                        </div>
                        <div style={{ fontSize: "16px" }}>
                          <span style={{ fontWeight: "600" }}>Email Address:</span> {customer.email || "N/A"}
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", textAlign: "right" }}>
                        <div style={{ fontSize: "16px" }}>
                          <span style={{ fontWeight: "600" }}>Credit Limit:</span> ₱ {fmt(customer.credit_limit)}
                        </div>
                        <div style={{ fontSize: "16px" }}>
                          <span style={{ fontWeight: "600" }}>Outstanding Balance:</span> ₱ {fmt(customer.outstanding_balance)}
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

              {reminderTarget && (
                <ReminderModal
                  customerId={reminderTarget.customer_id}
                  customerName={reminderTarget.name}
                  onClose={() => setReminderTarget(null)}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}