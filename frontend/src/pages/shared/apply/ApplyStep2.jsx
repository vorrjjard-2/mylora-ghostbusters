import { useState } from "react";
import ApplicationSubmittedModal from "../../../components/ApplicationSubmittedModal";
import logo from "../../../assets/mylora-logo.png";
import fileIcon from "../../../assets/file.png";
import "./ApplyStep2.css";

export default function ApplyStep2() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

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
      !firstName || !lastName || !phone ||
      !address1 || !barangay || !city || !zipCode ||
      !branch || !creditAmount || !creditTerm ||
      supportingDocs.length < 2. // ADDED TO CHECK FOR AT LEAST 2 DOCS
    ) {
    if (supportingDocs.length < 2) {
            setError("Please upload at least 2 supporting documents.");  // ADDED ERROR MESSAGE FOR LACKING DOCS
        } else {
            setError("Please complete all required fields.");
        }
        return;
    }

    if (!govId) {
        setError("Please upload a Government-Issued ID.");  // ADDED ERROR MESSAGE FOR NO GOV ID
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

  // For currency formatting
  const formatAsCurrency = (value) => {
      if (!value) return "";
      // Remove all non-digits
      const number = value.toString().replace(/\D/g, "");
      if (!number) return "";
      // Format with commas and add the Peso sign
      return "₱" + Number(number).toLocaleString("en-PH");
    };

 return (
   <>
     <div className="apply2-page-wrapper">
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
                <input
                  type="text"
                  value={firstName}
                  onChange={e => {
                    const value = e.target.value.toUpperCase();
                    if (value === '' || /^[A-Z\s]+$/.test(value)) {
                      setFirstName(value);
                    }
                  }}
                  style={{ textTransform: "uppercase" }}
                  required
                />
           </div>
           <div className="input-group">
               <label>Last Name<span className="required">*</span></label>
                <input
                  type="text"
                  value={lastName}
                  onChange={e => {
                    const value = e.target.value.toUpperCase();
                    if (value === '' || /^[A-Z\s]+$/.test(value)) {
                      setLastName(value);
                    }
                  }}
                  style={{ textTransform: "uppercase" }}
                  required
                />
           </div>
           <div className="input-group full-width">
               <label>Phone Number<span className="required">*</span></label>
                <input 
                      type="text" 
                      placeholder="09XX XXX XXXX" 
                      value={phone} 
                      onChange={e => {
                        // 1. Remove all non-numeric characters
                        let rawValue = e.target.value.replace(/\D/g, "");
                        
                        // 2. Limit to 11 digits
                        if (rawValue.length > 11) rawValue = rawValue.substring(0, 11);
                        
                        // 3. Apply the mask (09XX XXX XXXX)
                        let formattedValue = "";
                        if (rawValue.length > 0) {
                          formattedValue += rawValue.substring(0, 4);
                          if (rawValue.length > 4) {
                            formattedValue += " " + rawValue.substring(4, 7);
                          }
                          if (rawValue.length > 7) {
                            formattedValue += " " + rawValue.substring(7, 11);
                          }
                        }
                        
                        setPhone(formattedValue);
                      }} 
                      required 
                    />           
                </div>
           </div>
         </section>
    
         {/* Section 2 */}
         <section className="form-section">
           <h2 className="section-title">02 Delivery Address</h2>
           <div className="input-group full-width">
             <label>Address 1<span className="required">*</span></label>
              <input 
                  type="text" 
                  placeholder="UNIT NO., BLDG NAME, STREET" 
                  value={address1} 
                  onChange={e => setAddress1(e.target.value.toUpperCase())} 
                  required 
                />           
              </div>
           <div className="input-group full-width">
             <label>Address 2</label>
                <input 
                    type="text" 
                    placeholder="LANDMARK STATUE" 
                    value={address2}
                    onChange={e => setAddress2(e.target.value.toUpperCase())} 
                  />           
              </div>
           <div className="input-grid three-col">
             <div className="input-group">
               <label>Barangay<span className="required">*</span></label>
                <input 
                    type="text" 
                    value={barangay}
                    onChange={e => setBarangay(e.target.value.toUpperCase())} 
                    required
                  />                
             </div>
             <div className="input-group">
               <label>City<span className="required">*</span></label>
                <input 
                    type="text" 
                    value={city}
                    onChange={e => setCity(e.target.value.toUpperCase())} 
                    required
                  />                 
                </div>
             <div className="input-group">
               <label>Zip Code<span className="required">*</span></label>
                <input 
                      type="text" 
                      placeholder="XXXX"
                      value={zipCode} 
                      onChange={e => {
                        // Remove anything that isn't a number
                        const value = e.target.value.replace(/\D/g, "");
                        
                        // Only update state if it's 4 digits or less
                        if (value.length <= 4) {
                          setZipCode(value);
                        }
                      }} 
                      required 
                    />             
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
                <input 
                  type="text" 
                  placeholder="₱0" 
                  // Display the formatted version 
                  value={formatAsCurrency(creditAmount)}
                  onChange={(e) => {
                    // Strip everything except numbers before saving to state 
                    const rawValue = e.target.value.replace(/\D/g, "");
                    setCreditAmount(rawValue);
                  }} 
                />
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
          <div className="section-header-text">
            <p>The following supporting documents are required:</p>
            <ul className="required-docs-list">
              <li>Document 1<span className="required">*</span></li>
              <li>Document 2<span className="required">*</span></li>
              <li>Document 3 <span>(optional)</span></li>
            </ul>
          </div>
          {supportingDocs.length > 0 ? (
            <div className="file-list-container">
              {supportingDocs.map((file, index) => (
                <div key={index} className="file-display-badge">
                <img src={fileIcon} alt="File Icon" className="custom-file-icon" />                  
                <span className="file-name">{file.name}</span>
                  <button type="button" className="remove-file" onClick={() => setSupportingDocs(supportingDocs.filter((_, i) => i !== index))}>×</button>
                </div>
              ))}
              <button type="button" className="add-more-files" onClick={() => document.getElementById('docs-input').click()}>+ Add more</button>
              <input
                id="docs-input"
                type="file"
                multiple
                accept=".jpg, .jpeg, .png, .pdf"
                onChange={e => setSupportingDocs([...supportingDocs, ...e.target.files])}
                className="hidden-file-input"
              />
            </div>
          ) : (
            <label className="upload-zone">
              <div className="upload-content">
                <p className="upload-icon">↑ Upload files here.</p>
                <small className="upload-hint">Supported formats are .jpg, .jpeg, and .png, .pdf. Max file size is 10mb</small>
              </div>
              <input
                type="file"
                multiple
                onChange={e => setSupportingDocs([...e.target.files])}
                className="hidden-file-input"
              />
            </label>
          )}
        </section>

        {/* Section 05 */}
        <section className="form-section">
          <h2 className="section-title">05 Upload a Government-Issued ID</h2>
          <p className="id-hint-text">Please make sure that uploaded image is clear.<span className="required">*</span></p>
          {govId ? (
            <div className="file-list-container">
              <div className="file-display-badge">
                <img src={fileIcon} alt="File Icon" className="custom-file-icon" />                  
                <span className="file-name">{govId.name}</span>
                <button type="button" className="remove-file" onClick={() => setGovId(null)}>×</button>
              </div>
            </div>
          ) : (
            <label className="upload-zone">
              <div className="upload-content">
                <p className="upload-icon">↑ Upload file here.</p>
                <small className="upload-hint">Supported formats are .jpg, .jpeg, and .png. Max file size is 10mb</small>
              </div>
              <input
                type="file"
                accept=".jpg, .jpeg, .png"
                onChange={e => setGovId(e.target.files[0])}
                className="hidden-file-input"
              />
            </label>
          )}
        </section>

        {error && <p className="error-text" style={{color: '#911818', marginLeft: '-40px', marginTop: '20px'}}>{error}</p>}

        <div className="form-footer">
          <button type="button" className="btn-back">Back</button>
          <button type="submit" className="btn-next" disabled={submitting}>
            {submitting ? "Submitting..." : "Next"}
          </button>
        </div>

        <div className="form-footer">
</div>

      </form> {/* Closing the enroll-form */}
    </div> {/* Closing the apply-container */}
  </div> {/* Closing the apply2-page-wrapper */}

  {showModal && (
    <ApplicationSubmittedModal
      applicationId={applicationId}
      onClose={() => setShowModal(false)}
    />
  )}
</>
 );
}

