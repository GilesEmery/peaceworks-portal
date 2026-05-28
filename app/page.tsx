export default function Home() {
  return (
    <main className="portal-page">
      <header className="site-header">
        <div className="container header-inner">
          <a className="brand" href="https://www.peaceworks.network/">
            <img
              src="https://gilesemery.github.io/peaceworks-main/PeaceworksLogo.svg"
              alt="PeaceWorks"
            />
          </a>

          <nav className="site-nav">
            <a href="https://www.peaceworks.network/">Main Site</a>
            <a href="/auth">Sign In</a>
            <a href="/dashboard">Dashboard</a>
          </nav>
        </div>
      </header>

      <section className="portal-hero">
        <div className="container portal-grid">
          <div className="portal-copy">
            <div className="eyebrow">The Peace Index</div>

            <h1>Discover how peace moves under pressure.</h1>

            <p>
              The Peace Index helps leaders understand what tends to steal their
              peace, how they respond under pressure, and what practices can help
              them grow into steadier, healthier leadership.
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
              results, access future Circle resources, and eventually connect
              with coaching pathways.
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
    </main>
  );
}