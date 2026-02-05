import "./ApplicationSubmittedModal.css";

export default function ApplicationSubmittedModal({
  applicationId,
  onClose,
}) {
return (
    <div className="modal-overlay">
      <div className="modal-container">
        <h1 className="modal-success-title">
          Application successfully submitted!
        </h1>

        <p className="modal-success-text">
          Your application <strong>{applicationId ? applicationId.slice(0, 8).toUpperCase() : "PENDING"}</strong> has been sent for review of eligibility for a credit line. Please regularly check your email for updates on your credit application status.
        </p>

        <button onClick={onClose} className="modal-return-btn">
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}