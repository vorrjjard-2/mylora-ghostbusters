import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import logo from "../../assets/mylora-logo.png";
import "./OrderSuccess.css";

export default function OrderSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const orderId = location.state?.orderId;
  const exceedsCredit = location.state?.exceedsCredit || false;


  useEffect(() => {
    if (!orderId) {
      navigate("/customer/dashboard");
    } 
  }, [orderId, navigate]);

return (
    <div className="success-container">
          {/* Header Section */}
          <header className="success-main-header"> 
            <div className="success-brand-group">
              <img src={logo} alt="Mylora Logo" className="success-logo-img" />
              <span className="success-system-title">Web Credit System</span>
            </div>
          </header>

      <main className="success-content">
      <div className="success-card">

        <h1 className="success-title">Your purchase request has been sent!</h1>

        <p className="success-message">
          <strong>ORDER ID: {orderId}</strong>
        </p>

        {exceedsCredit ? (
          <>
            <p className="success-warning-text">
              This order exceeds your available credit limit and requires override approval.
            </p>
            <p className="success-description">
              Your purchase request will be reviewed by management for credit limit override approval.
              You will be notified once a decision has been made.
            </p>
          </>
        ) : (
          <p className="success-description">
            Your purchase request has been sent to the office and will be reviewed shortly.
          </p>
        )}

        <p className="success-description">
          You may check the status of your order through your order history.
        </p>

        <div className="success-actions">
          <button
            onClick={() => navigate("/customer/dashboard")}
            className="success-dashboard-btn"
          >
            Back to Dashboard
          </button>
          <button
            onClick={() => navigate("/orders")}
            className="success-orders-btn"
          >
            View Order History
          </button>
        </div>
      </div>
      </main>
    </div>
  );
}