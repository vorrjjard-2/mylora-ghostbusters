// Standardized order status labels and colors used across all roles

export const ORDER_STATUS_LABEL = {
  PENDING: "Pending Approval",
  APPROVED: "Pending Delivery",
  PROCESSING: "Processing",
  COMPLETED: "Order Completed",
  CANCELLED: "Cancelled",
  REJECTED: "Credit Rejected",
};

export const ORDER_STATUS_STYLES = {
  PENDING:    { backgroundColor: "#FFF3CD", color: "#856404" },   // yellow
  PROCESSING: { backgroundColor: "#FFF3CD", color: "#856404" },   // yellow
  APPROVED:   { backgroundColor: "#D1E7DD", color: "#0F5132" },   // green
  REJECTED:   { backgroundColor: "#F8D7DA", color: "#842029" },   // red
  CANCELLED:  { backgroundColor: "#F8D7DA", color: "#842029" },   // red
  COMPLETED:  { backgroundColor: "#CCE5FF", color: "#004085" },   // blue
};

export function getOrderStatusLabel(status) {
  return ORDER_STATUS_LABEL[status] || status;
}

export function getOrderStatusStyle(status) {
  return ORDER_STATUS_STYLES[status] || { backgroundColor: "#E9ECEF", color: "#333" };
}

export function orderStatusBadgeStyle(status) {
  return {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "600",
    ...getOrderStatusStyle(status),
  };
}
