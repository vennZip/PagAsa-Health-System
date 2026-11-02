import { useState } from "react";
import { apiUrl } from "../config/api";
import { useAuth } from "../context/useAuth";

export default function GlobalFooter() {
  const { currentUser } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [sending, setSending] = useState(false);

  const submitFeedback = async (event) => {
    event.preventDefault();
    if (!rating) { setNotice("Please choose a star rating."); return; }
    try {
      setSending(true); setNotice("");
      const token = await currentUser.getIdToken();
      const response = await fetch(apiUrl("/api/announcements/feedback"), { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ rating, message }) });
      const data = await response.json();
      setNotice(data.message || (response.ok ? "Thank you for your feedback." : "Unable to send feedback."));
      if (response.ok) { setRating(0); setMessage(""); }
    } catch { setNotice("Unable to send feedback right now."); }
    finally { setSending(false); }
  };

  const displayedRating = hoveredRating || rating;
  return <footer className="global-footer">
    <div className="footer-heading"><h2>Get in Touch</h2><p>Contact the health center for appointments, inquiries, or urgent guidance.</p></div>
    <div className="footer-contact-grid">
      <article><div className="footer-icon footer-icon--blue" aria-hidden="true">CALL</div><h3>Call Us</h3><p><a className="footer-contact-link" href="tel:+639000000000">0900 000 0000</a> <small>(temporary)</small></p><p>Emergency assistance: <strong>911</strong></p></article>
      <article><div className="footer-icon footer-icon--green" aria-hidden="true">MAIL</div><h3>Email Us</h3><p><a className="footer-contact-link" href="mailto:mysupragotnoheadlights19@gmail.com">mysupragotnoheadlights19@gmail.com</a></p><p><small>Temporary contact email</small></p></article>
      <article><div className="footer-icon footer-icon--purple" aria-hidden="true">VISIT</div><h3>Visit Us</h3><p>Barangay Pag-Asa Health Center</p><p>Visit during the opening hours shown in the clinic calendar.</p></article>
    </div>
    <div className="footer-lower">
      <div><h3>Barangay Pag-Asa Health Center</h3><p>Community health services, appointments, queue management, and important clinic updates in one secure system.</p><p>For life-threatening emergencies, call 911 immediately.</p></div>
      <form className="footer-feedback" onSubmit={submitFeedback}><h3>Rate Your Experience</h3><div className="star-rating" role="radiogroup" aria-label="Feedback rating">{[1,2,3,4,5].map((value) => <button key={value} type="button" role="radio" aria-checked={rating === value} aria-label={`${value} star${value === 1 ? "" : "s"}`} className={value <= displayedRating ? "star-button star-button--active" : "star-button"} onMouseEnter={() => setHoveredRating(value)} onMouseLeave={() => setHoveredRating(0)} onFocus={() => setHoveredRating(value)} onBlur={() => setHoveredRating(0)} onClick={() => setRating(value)}>★</button>)}</div><label htmlFor="global-feedback">Feedback (optional)</label><textarea id="global-feedback" value={message} onChange={(event) => setMessage(event.target.value)} maxLength="1500" placeholder="Tell us what went well or what can be improved." /><button type="submit" disabled={sending}>{sending ? "Sending..." : "Send Feedback"}</button>{notice && <p className="footer-notice">{notice}</p>}</form>
    </div>
    <div className="footer-copyright">© {new Date().getFullYear()} Barangay Pag-Asa Health Center Monitoring System. All rights reserved.</div>
  </footer>;
}
