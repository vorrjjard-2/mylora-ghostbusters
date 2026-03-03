import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/internal/Sidebar";
import logo from "../../assets/mylora-logo.png";
import "../upper_management/Dashboard.css";

export default function EmployeeDatabase() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/api/um/employees/", {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load employees");
        return res.json();
      })
      .then(data => {
        setEmployees(data);
        setFilteredEmployees(data);
      })
      .catch((err) => {
        console.error(err);
        alert("Failed to load employees");
      })
      .finally(() => setLoading(false));
  }, []);

  // Handle search
  useEffect(() => {
    let filtered;
    if (searchTerm === "") {
      filtered = employees;
    } else {
      const searchLower = searchTerm.toLowerCase();
      filtered = employees.filter(employee => 
        employee.name.toLowerCase().includes(searchLower) ||
        employee.role.toLowerCase().includes(searchLower) ||
        (employee.email && employee.email.toLowerCase().includes(searchLower))
      );
    }
    
    // Re-apply current sort to filtered results
    if (sortConfig.key) {
      const sorted = [...filtered].sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (typeof aVal === "string") {
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
      setFilteredEmployees(sorted);
    } else {
      setFilteredEmployees(filtered);
    }
  }, [searchTerm, employees, sortConfig]);

  // Handle sorting
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });

    const sorted = [...filteredEmployees].sort((a, b) => {
      let aVal = a[key];
      let bVal = b[key];

      if (typeof aVal === "string") {
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

    setFilteredEmployees(sorted);
  };

  const getRoleDisplay = (role) => {
    const roleMap = {
      "credit_manager": "Credit Manager",
      "order_processor": "Order Processor",
      "upper_management": "Upper Management",
    };
    return roleMap[role] || role;
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
          <h1 className="um-welcome-text">Employee Database</h1>

          {/* Search and Sort Controls */}
          <div style={{ display: "flex", gap: "15px", marginBottom: "25px" }}>
            <div style={{ position: "relative", flex: 1, maxWidth: "400px" }}>
              <span style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", fontSize: "18px" }}>🔍</span>
              <input
                type="text"
                placeholder="Search"
                aria-label="Search employees"
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
              style={{
                padding: "10px 20px",
                fontSize: "16px",
                border: "none",
                borderRadius: "8px",
                backgroundColor: "#1E2D1A",
                color: "white",
                cursor: "pointer",
                fontWeight: "600"
              }}
              onClick={() => navigate("/upper-management/employee/create")}
            >
              + Add New Employee
            </button>
          </div>

          {/* Employee Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {filteredEmployees.length === 0 && (
              <div style={{ padding: "30px", textAlign: "center", color: "#888" }}>
                No employees found
              </div>
            )}
            {filteredEmployees.map((employee) => (
              <div
                key={employee.user_id}
                style={{
                  backgroundColor: "white",
                  border: "1px solid #262626",
                  borderRadius: "15px",
                  padding: "20px 30px",
                  cursor: "pointer",
                  transition: "background-color 0.2s"
                }}
                onClick={() => navigate(`/upper-management/employee/${employee.user_id}`)}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#F9F9F9"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "white"}
              >
                <h3 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "12px" }}>
                  {employee.name}
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ fontSize: "16px" }}>
                    <span style={{ fontWeight: "600" }}>Role:</span> {getRoleDisplay(employee.role)}
                  </div>
                  <div style={{ fontSize: "16px" }}>
                    <span style={{ fontWeight: "600" }}>Date Joined:</span> {employee.date_joined}
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