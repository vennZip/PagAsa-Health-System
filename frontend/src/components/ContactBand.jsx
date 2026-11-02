export default function ContactBand() {
  return <div className="contact-band" aria-label="Temporary health center contact details">
    <span className="contact-band-label">Temporary Contacts</span>
    <a href="tel:+639000000000" aria-label="Call temporary mobile number 0900 000 0000">
      <span className="contact-band-action" aria-hidden="true">Call</span>
      Mobile: 0900 000 0000
    </a>
    <a href="mailto:mysupragotnoheadlights19@gmail.com" aria-label="Email the health center">
      <span className="contact-band-action" aria-hidden="true">Email</span>
      mysupragotnoheadlights19@gmail.com
    </a>
  </div>;
}
