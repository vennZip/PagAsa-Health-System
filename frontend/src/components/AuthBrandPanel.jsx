function AuthBrandPanel() {
  return (
    <aside className="auth-brand-panel" aria-label="Barangay Pag-Asa Health Center">
      <video
        className="auth-brand-video"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
      >
        <source src="/healthcare-welcome.mp4" type="video/mp4" />
      </video>
      <div className="auth-brand-overlay" aria-hidden="true" />
      <div className="auth-brand-content">
        <div className="auth-brand-mark" aria-hidden="true">P+</div>
        <h1>Barangay Pag-Asa<br />Health Center</h1>
        <p>“Caring for you, beyond cure.”</p>
        <span>Community Health &amp; Wellness</span>
      </div>
    </aside>
  );
}

export default AuthBrandPanel;
