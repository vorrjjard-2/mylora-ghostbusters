import { useState } from "react";
import ApplicationSubmittedModal from "../../components/ApplicationSubmittedModal";
import logo from "../../assets/mylora-logo.png";
import "./ApplyStep2.css";

export default function ApplyStep2() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [barangay, setBarangay] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [branch, setBranch] = useState("");

  const [creditAmount, setCreditAmount] = useState("");
  const [creditTerm, setCreditTerm] = useState("");

  const [supportingDocs, setSupportingDocs] = useState([]);
  const [govId, setGovId] = useState(null);

  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [applicationId, setApplicationId] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (
      !firstName || !lastName || !phone || !email ||
      !address1 || !barangay || !city || !zipCode ||
      !branch || !creditAmount || !creditTerm
    ) {
      setError("Please complete all required fields.");
      return;
    }

    const step1 = JSON.parse(localStorage.getItem("application_step_1"));
    if (!step1) {
      setError("Session expired. Please start again.");
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();

      formData.append("step1", JSON.stringify(step1));
      formData.append(
        "step2",
        JSON.stringify({
          firstName,
          lastName,
          phone,
          email,
          address1,
          address2,
          barangay,
          city,
          zipCode,
          branch,
          creditAmount,
          creditTerm,
        })
      );

      if (supportingDocs[0]) formData.append("doc1", supportingDocs[0]);
      if (supportingDocs[1]) formData.append("doc2", supportingDocs[1]);
      if (govId) formData.append("gov_id", govId);

      const res = await fetch("http://localhost:8000/api/applications/", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Submission failed");

      const data = await res.json();
      setApplicationId(data.application_id);
      setShowModal(true);
      localStorage.removeItem("application_step_1");

    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="apply-page-wrapper">
      <header className="apply-header">
        <div className="header-brand">
          <img src={logo} alt="Mylora Logo" className="mylora-logo" />
          <span className="header-title">Web Credit System</span>
        </div>
      </header>

      <div className="apply-container">
        <h1 className="main-title">Enrol for a credit line.</h1>

        <form onSubmit={handleSubmit} className="enroll-form"> 
          {/* Section 01 */}
          <section className="form-section">
            <h2 className="section-title">01 Personal Information</h2>
            <div className="input-grid">
              <div className="input-group">
                <label>First Name<span className="required">*</span></label>
                <input type="text" onChange={e => setFirstName(e.target.value)} required />
            </div>
            <div className="input-group">
                <label>Last Name<span className="required">*</span></label>
                <input type="text" onChange={e => setLastName(e.target.value)} required />
            </div>
            <div className="input-group">
                <label>Phone Number<span className="required">*</span></label>
                <input type="text" placeholder="XXXX XXX XXXX" onChange={e => setPhone(e.target.value)} required />
            </div>
            <div className="input-group">
                <label>Email Address<span className="required">*</span></label>
                <input type="email" onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>
          </section>
      
          {/* Section 2 */}
          <section className="form-section">
            <h2 className="section-title">02 Delivery Address</h2>
            <div className="input-group full-width">
              <label>Address 1<span className="required">*</span></label>
              <input type="text" placeholder="UNIT NO., BLDG NAME, STREET" onChange={e => setAddress1(e.target.value)} required />
            </div>
            <div className="input-group full-width">
              <label>Address 2</label>
              <input type="text" placeholder="LANDMARK STATUE" onChange={e => setAddress2(e.target.value)} />
            </div>
            <div className="input-grid three-col">
              <div className="input-group">
                <label>Barangay<span className="required">*</span></label>
                <input type="text" onChange={e => setBarangay(e.target.value)} required />
              </div>
              <div className="input-group">
                <label>City<span className="required">*</span></label>
                <input type="text" onChange={e => setCity(e.target.value)} required />
              </div>
              <div className="input-group">
                <label>Zip Code<span className="required">*</span></label>
                <input type="text" onChange={e => setZipCode(e.target.value)} required />
              </div>
            </div>
            <div className="input-group">
              <label>Default Store Branch<span className="required">*</span></label>
              <select onChange={e => setBranch(e.target.value)} required>
                <option value="">Select your preferred branch</option>
                <option value="branch-a">Branch A</option>
              </select>
            </div>
          </section>

          {/* Section 3 */}
          <section className="form-section">
            <h2 className="section-title">03 Credit Line Application</h2>
            <div className="input-group full-width">
              <label>How much credit are you applying for?</label>
              <input type="number" placeholder="Enter your amount here" onChange={e => setCreditAmount(e.target.value)} />
            </div>
            <div className="input-group">
              <label>What is your preferred credit term?</label>
              <select onChange={e => setCreditTerm(e.target.value)}>
                <option value="">Select your preferred terms</option>
                <option value="30">30 Days</option>
                <option value="60">60 Days</option>
                <option value="90">90 Days</option>
              </select>
            </div>
          </section>

          {/* Section 04 */}
          <section className="form-section">
            <h2 className="section-title">04 Upload Supporting Documents</h2>
            <label className="upload-zone">
              <div className="upload-content">
                <p className="upload-icon">↑ Upload files here.</p>
                <small className="upload-hint">
                  Supported formats are .jpg, .jpeg, and .png, .pdf. Max file size is 10mb
                </small>
              </div>
              <input 
                type="file" 
                multiple 
                onChange={e => setSupportingDocs([...e.target.files])} 
                className="hidden-file-input" 
              />
            </label>
          </section>

          {/* Section 05 */}
          <section className="form-section">
            <h2 className="section-title">05 Upload a Government-Issued ID</h2>
            <label className="upload-zone">
              <div className="upload-content">
                <p className="upload-icon">↑ Upload file here.</p>
                <small className="upload-hint">
                  Supported formats are .jpg, .jpeg, and .png. Max file size is 10mb
                </small>
              </div>
              <input 
                type="file" 
                onChange={e => setGovId(e.target.files[0])} 
                className="hidden-file-input" 
              />
            </label>
          </section>

          {error && <p className="error-text">{error}</p>}

          <div className="form-footer">
            <button type="button" className="btn-back">Back</button>
            <button type="submit" className="btn-next" disabled={submitting}>
              {submitting ? "Submitting..." : "Next"}
              </button>
            </div>
          </form>
        </div> 
      </div> 

      {showModal && (
        <ApplicationSubmittedModal
          applicationId={applicationId}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
