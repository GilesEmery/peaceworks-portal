import SiteHeader from "../components/layout/SiteHeader";
import SiteFooter from "../components/layout/SiteFooter";

export default function Home() {
  return (
    <main className="portal-page">
      <SiteHeader showSignOut={false} />

      <section className="portal-hero">
        <div className="container portal-grid">
          <div className="portal-copy">
            <div className="eyebrow">The Peace Index</div>

            <h1>Discover how peace moves under pressure.</h1>

            <p>
              The Peace Index helps leaders understand what tends to steal their
              peace, how they respond under pressure, and what practices can
              help them grow into steadier, healthier leadership.
            </p>

            <div className="btn-row">
              <a className="btn btn-primary" href="/auth">
                Start the Peace Assessment
              </a>

              <a className="btn btn-secondary" href="/dashboard">
                Go to Dashboard
              </a>
            </div>
          </div>

          <aside className="login-card">
            <span className="card-label">PeaceWorks</span>

            <h2>Your Peace Index home</h2>

            <p>
              Sign in to take the PeaceWorks Assessment, view your latest
              results, access Circle resources, and connect with future coaching
              pathways.
            </p>

            <div className="resource-list">
              <span>Peace Assessment</span>
              <span>Assessment Results</span>
              <span>Circle Journey</span>
              <span>Coach Portal</span>
            </div>
          </aside>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}