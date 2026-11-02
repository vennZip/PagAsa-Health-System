function HealthCrossLogo({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      role="img"
      aria-label="Barangay Pag-Asa Health Center medical cross"
    >
      <circle className="health-cross-logo__ring" cx="32" cy="32" r="29" />
      <circle className="health-cross-logo__field" cx="32" cy="32" r="23" />
      <path
        className="health-cross-logo__cross"
        d="M27 17h10v10h10v10H37v10H27V37H17V27h10V17Z"
      />
    </svg>
  );
}

export default HealthCrossLogo;
