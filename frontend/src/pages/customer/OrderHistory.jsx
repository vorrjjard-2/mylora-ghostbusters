import apiFetch from "../../utils/apiFetch";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import useIsMobile from "../../hooks/useIsMobile";
import usePagination from "../../hooks/usePagination";
import Pagination from "../../components/Pagination";
import MobileBottomNav from "../../components/MobileBottomNav";
import searchIcon from "../../assets/search.png";
import logo from "../../assets/mylora-logo.png";
import "./OrderHistory.css";

import { getOrderStatusLabel, orderStatusBadgeStyle } from "../../utils/orderStatus";

const ALL_STATUSES = ["PENDING", "APPROVED", "PROCESSING", "COMPLETED", "CANCELLED", "REJECTED"];

export default function OrderHistory() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // filter / sort state
  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState("desc");           // "asc" | "desc"
  const [sortOpen, setSortOpen] = useState(false);
  const [activeStatuses, setActiveStatuses] = useState(new Set(ALL_STATUSES));

  /* ── fetch ── */
  useEffect(() => {
    apiFetch("/api/orders/")
      .then((r) => r.json())
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false)); 
  }, []);

  /* ── toggle a single status checkbox ── */
  const toggleStatus = (s) => {
    setActiveStatuses((prev) => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });
  };

  /* ── select-all / clear-all helper ── */
  const allChecked = activeStatuses.size === ALL_STATUSES.length;
  const toggleAll = () =>
    setActiveStatuses(allChecked ? new Set() : new Set(ALL_STATUSES));

  /* ── derived list ── */
  const filtered = useMemo(() => {
    let list = orders.filter(
      (o) =>
        activeStatuses.has(o.order_status) &&
        (`${o.order_id}`.toLowerCase().includes(search.toLowerCase()) ||
          o.order_status.toLowerCase().includes(search.toLowerCase()))
    );

    list.sort((a, b) => {
      const da = new Date(a.date_ordered);
      const db = new Date(b.date_ordered);
      return sortDir === "asc" ? da - db : db - da;
    });

    return list;
  }, [orders, search, sortDir, activeStatuses]);

  const { currentPage, totalPages, paginatedData, goToPage } = usePagination(filtered, 10, [search, sortDir, activeStatuses]);

  /* ── render ── */
  if (loading) return <div className="history-container">Loading...</div>;

  return (
    <div className="history-container">
      {/* HEADER */}
      <header className="history-header-section">
        <div className="history-brand-group">
          <img src={logo} alt="Mylora Logo" className="mylora-logo" />
          <span className="history-system-title">Web Credit System</span>
        </div>
        <div className="history-header-actions">
          <button className="history-back-btn" onClick={() => navigate("/customer/dashboard")}>
            Back
          </button> 
        </div>
      </header>

      <main className="order-history-content">

      <h1 className="history-title">Your order history</h1>

      {/* toolbar: search + sort dropdown */}
      <div className="history-toolbar">
        <div className="history-search-wrapper">
          <img 
            src={searchIcon} 
            alt="Search" 
            className="history-search-icon" 
          />  
          <input
            type="text"
            className="history-search-input"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* sort dropdown */}
        <div style={{ position: "relative" }}>
          <button className="history-sort-btn" onClick={() => setSortOpen(!sortOpen)}>
            ↕ Sort By
          </button>
          {sortOpen && (
            <div className="history-sort-dropdown">
              <button
                className="history-sort-option"
                style={{ fontWeight: sortDir === "desc" ? 600 : 400 }}
                onClick={() => { setSortDir("desc"); setSortOpen(false); }}
              >
                Date: Newest first
              </button>
              <button
                className="history-sort-option"
                style={{ fontWeight: sortDir === "asc" ? 600 : 400 }}
                onClick={() => { setSortDir("asc"); setSortOpen(false); }}
              >
                Date: Oldest first
              </button>
            </div>
          )}
        </div>
      </div>

      {/* status checkboxes */}
      <div className="history-filter-bar">
        <span className="history-filter-label">Status:</span>
        <label className="history-checkbox-label">
          <input
            type="checkbox"
            className="history-checkbox"
            checked={allChecked}
            onChange={toggleAll}
          />
          All
        </label>
        {ALL_STATUSES.map((s) => (
          <label key={s} className="history-checkbox-label">
            <input
              type="checkbox"
              className="history-checkbox"
              checked={activeStatuses.has(s)}
              onChange={() => toggleStatus(s)}
            />
            {getOrderStatusLabel(s)}
          </label>
        ))}
      </div>

      {/* table / mobile cards */}
      {filtered.length === 0 ? (
        <p style={{ textAlign: "center", color: "#888", padding: "2rem" }}>No orders match your filters.</p>
      ) : isMobile ? (
        <div className="mobile-card-list">
          {paginatedData.map((order) => (
            <div
              key={order.order_id}
              className="mobile-card"
              onClick={() => navigate(`/orders/${order.order_id}`, { state: { from: "/orders" } })}
            >
              <div className="mobile-card-row">
                <span className="mobile-card-label">Order ID</span>
                <span className="mobile-card-value">{order.order_id}</span>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">Amount</span>
                <span className="mobile-card-value">
                  ₱ {parseFloat(order.total_amount).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">Date</span>
                <span className="mobile-card-value">{order.date_ordered}</span>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">Status</span>
                <span style={orderStatusBadgeStyle(order.order_status)}>
                  {getOrderStatusLabel(order.order_status)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="history-table-wrapper">
          <table className="history-table">
            <thead>
              <tr>
                <th className="history-th">ORDER ID</th>
                <th className="history-th">AMOUNT</th>
                <th className="history-th">DATE ORDERED</th>
                <th className="history-th">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((order) => (
                <tr
                  key={order.order_id}
                  className="history-row"
                  onClick={() => navigate(`/orders/${order.order_id}`, { state: { from: "/orders" } })}
                >
                  <td className="history-td">{order.order_id}</td>
                  <td className="history-td">
                    ₱ {parseFloat(order.total_amount).toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="history-td">{order.date_ordered}</td>
                  <td className="history-td">
                    <span style={orderStatusBadgeStyle(order.order_status)}>
                      {getOrderStatusLabel(order.order_status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={goToPage} />
      </main>
      {isMobile && <MobileBottomNav />}
    </div>
  );
}
