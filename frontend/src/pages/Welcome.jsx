import { Link } from "react-router-dom";
import HealthCrossLogo from "../components/HealthCrossLogo";
import ThemeSelector from "../components/ThemeSelector";
import { Icon } from "../components/Icons";

const goals = [
  {
    icon: "calendar",
    title: "Simpler appointments",
    description: "Request appointments and check clinic schedules through one accessible portal."
  },
  {
    icon: "queue",
    title: "Clearer patient journeys",
    description: "Follow appointment decisions, queue updates, and important health center notices."
  },
  {
    icon: "service",
    title: "Better community service",
    description: "Help health workers coordinate services, records, medicines, and daily operations."
  }
];

function Welcome() {
  const currentYear = new Date().getFullYear();

  return (
    <main className="welcome-page">
      <video className="welcome-page__video" autoPlay muted loop playsInline preload="metadata" aria-hidden="true">
        <source src="/healthcare-welcome.mp4" type="video/mp4" />
      </video>
      <div className="welcome-page__overlay" aria-hidden="true" />

      <header className="welcome-header">
        <Link className="welcome-brand" to="/" aria-label="Barangay Pag-Asa Health Center home">
          <HealthCrossLogo className="welcome-brand__logo" />
          <span>
            <strong>Barangay Pag-Asa</strong>
            <small>Health Center</small>
          </span>
        </Link>
        <div className="welcome-header__actions">
          <ThemeSelector compact />
        </div>
      </header>

      <section className="welcome-hero" aria-labelledby="welcome-title">
        <div className="welcome-hero__copy">
          <span className="welcome-eyebrow">Community health, made more accessible</span>
          <h1 id="welcome-title">Care starts with a better connection.</h1>
          <p>
            The Barangay Pag-Asa Health Center Monitoring System connects patients, staff, and
            administrators in one secure place for appointments, queues, clinic updates, and
            essential health services.
          </p>
          <div className="welcome-hero__actions">
            <Link className="welcome-button welcome-button--primary" to="/login">Go to login</Link>
            <Link className="welcome-button welcome-button--secondary" to="/register">Create an account</Link>
          </div>
          <small className="welcome-assurance">Designed to support organized, timely, and patient-centered care.</small>
        </div>

        <aside className="welcome-goals" aria-labelledby="goals-title">
          <div className="welcome-goals__heading">
            <span>Our purpose</span>
            <h2 id="goals-title">What this system aims to achieve</h2>
          </div>
          <div className="welcome-goals__list">
            {goals.map((goal) => (
              <article className="welcome-goal" key={goal.title}>
                <div className="welcome-goal__icon" aria-hidden="true"><Icon name={goal.icon} size={21} /></div>
                <div>
                  <h3>{goal.title}</h3>
                  <p>{goal.description}</p>
                </div>
              </article>
            ))}
          </div>
        </aside>
      </section>

      <footer className="welcome-footer">
        <span>&copy; {currentYear} Barangay Pag-Asa Health Center. All rights reserved.</span>
        <span>Community Health &amp; Wellness</span>
      </footer>
    </main>
  );
}

export default Welcome;
