export default function ApplicationSubmittedModal({
  applicationId,
  onClose,
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "white",
          padding: "2rem",
          maxWidth: "500px",
          width: "100%",
          borderRadius: "6px",
          textAlign: "center",
        }}
      >
        <h2>Application Submitted</h2>

        <p style={{ margin: "1rem 0" }}>
          Your application has been successfully submitted.
        </p>

        <p>
          <strong>Application Number:</strong>
        </p>

        <code
          style={{
            display: "block",
            padding: "0.75rem",
            margin: "0.5rem 0 1.5rem",
            background: "#f5f5f5",
            wordBreak: "break-all",
          }}
        >
          {applicationId}
        </code>

        <p style={{ fontSize: "0.9rem", color: "#555" }}>
          Please save this number. You will be notified by email once your
          application has been reviewed.
        </p>

        <button
          onClick={onClose}
          style={{
            marginTop: "1.5rem",
            padding: "0.6rem 1.2rem",
            background: "#1f3d1b",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
