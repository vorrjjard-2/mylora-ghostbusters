import { API_BASE_URL } from "../../utils/api";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCookie } from "../../utils/csrf";
import { handleLogout } from "../../utils/logout";
import useIsMobile from "../../hooks/useIsMobile";
import MobileBottomNav from "../../components/MobileBottomNav";
import logo from "../../assets/mylora-logo.png";
import "./CreditIncreaseRequest.css";

export default function CreditIncreaseRequest() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [creditInfo, setCreditInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  const [requestedLimit, setRequestedLimit] = useState("");
  const [displayLimit, setDisplayLimit] = useState("");
  const [justification, setJustification] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [inlineError, setInlineError] = useState("");
  const [hasPending, setHasPending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/customer/dashboard/`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setCreditInfo(data.credit);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleLimitChange = (e) => {
    const raw = e.target.value.replace(/[^0-9.]/g, "");
    const parts = raw.split(".");
    const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    const formatted = parts.length > 1 ? `${intPart}.${parts[1]}` : intPart;
    setDisplayLimit(formatted);
    setRequestedLimit(raw);
    setErrors((prev) => ({ ...prev, requestedLimit: "" }));
    setInlineError("");
  };

  const validate = () => {
    const newErrors = {};
    if (!requestedLimit) {
      newErrors.requestedLimit = "New credit limit is required.";
    } else if (creditInfo && parseFloat(requestedLimit) <= parseFloat(creditInfo.credit_limit)) {
      newErrors.requestedLimit = "New limit must be greater than your current credit limit.";
    }
    if (!justification.trim()) {
      newErrors.justification = "Reason is required.";
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    setInlineError("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/customer/credit-increase/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify({
          requested_limit: requestedLimit,
          justification: justification.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 400 && data.error && data.error.includes("pending")) {
          setHasPending(true);
          setInlineError(data.error);
        } else {
          setInlineError(data.error || "Failed to submit request.");
        }
        return;
      }

      setShowSuccess(true);
    } catch (err) {
      console.error(err);
      setInlineError("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="cir-container">Loading...</div>;
  }

  return (
    <div className="cir-container">
      <header className="cir-main-header">
        <div className="cir-brand-group">
          <img src={logo} alt="Mylora Logo" className="cir-logo-img" />
          <span className="cir-system-title">Web Credit System</span>
        </div>
        <div>
          <button className="cir-logout-btn" onClick={() => handleLogout(navigate)}>
            Logout
          </button>
        </div>
      </header>

      <main className="cir-content">
        <h1 className="cir-page-title">Request Credit Increase</h1>

        <div className="cir-credit-section">
          <p className="cir-current-limit">
            Current Credit Limit: ₱{creditInfo ? parseFloat(creditInfo.credit_limit).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
          </p>
        </div>

        {inlineError && (
          <div className="cir-inline-error">{inlineError}</div>
        )}

        <form onSubmit={handleSubmit} className="cir-form">
          <div className="cir-form-group">
            <label className="cir-label">New Credit Limit</label>
            <input
              type="text"
              value={`₱ ${displayLimit}`}
              onChange={handleLimitChange}
              className={`cir-input${errors.requestedLimit ? " cir-input-error" : ""}`}
              placeholder="₱ 0"
              disabled={hasPending}
            />
            {errors.requestedLimit && <span className="cir-error">{errors.requestedLimit}</span>}
          </div>

          <div className="cir-form-group">
            <label className="cir-label">Reason</label>
            <textarea
              value={justification}
              onChange={(e) => {
                setJustification(e.target.value);
                setErrors((prev) => ({ ...prev, justification: "" }));
              }}
              className={`cir-textarea${errors.justification ? " cir-input-error" : ""}`}
              placeholder="Please explain why you need a higher credit limit..."
              disabled={hasPending}
            />
            {errors.justification && <span className="cir-error">{errors.justification}</span>}
          </div>

          <div className="cir-form-footer">
            <button type="button" className="cir-btn-back" onClick={() => navigate("/customer/dashboard")}>
              Back
            </button>
            {!hasPending && (
              <button type="submit" className="cir-btn-submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit"}
              </button>
            )}
          </div>
        </form>
      </main>

      {/* Success Modal */}
      {showSuccess && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 2000,
        }}>
          <div style={{
            backgroundColor: "white", borderRadius: "15px",
            padding: "40px", width: "420px", maxWidth: "90vw",
            fontFamily: "'Arimo', sans-serif", textAlign: "center",
          }}>
            <h2 style={{ fontSize: "24px", fontWeight: "700", marginTop: 0, marginBottom: "16px", color: "#183112" }}>
              Request Submitted
            </h2>
            <p style={{ fontSize: "16px", color: "#555", marginBottom: "30px" }}>
              Your request has been submitted. You will be notified once it has been reviewed.
            </p>
            <button
              onClick={() => navigate("/customer/dashboard")}
              style={{
                padding: "10px 40px", fontSize: "16px", fontWeight: "600",
                border: "none", borderRadius: "8px",
                backgroundColor: "#1E2D1A", color: "white", cursor: "pointer",
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
      {isMobile && <MobileBottomNav />}
    </div>
  );
}
