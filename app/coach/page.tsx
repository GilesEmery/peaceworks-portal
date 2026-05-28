export default function CoachPage() {
  return (
    <main className="portal-page">
      <header className="site-header">
        <div className="container header-inner">
          <a className="brand" href="/dashboard">
            <img
              src="https://gilesemery.github.io/peaceworks-main/PeaceworksLogo.svg"
              alt="PeaceWorks"
            />
          </a>

          <nav className="site-nav">
            <a href="/dashboard">Dashboard</a>
            <a href="/peace-assessment">Assessment</a>
            <a href="/circle">Your Circle</a>
            <a href="/coach">Coaches</a>
          </nav>
        </div>
      </header>

      <section className="dashboard-shell">
        <div className="container">
          <div className="dashboard-hero compact-dashboard-hero">
            <div>
              <div className="eyebrow">PeaceWorks Coaches</div>
              <h1 className="dashboard-title">Coach Portal</h1>
              <p className="dashboard-sub">
                A future home for coaches to support Circles, view participant
                insights, track growth, and access coaching resources.
              </p>
            </div>
          </div>

          <div className="dashboard-wide-grid">
            <article className="portal-card dashboard-wide-card">
              <div>
                <span className="card-label">Circles</span>
                <h3>Assigned Circles</h3>
                <p>
                  View the Circles you are supporting, upcoming sessions,
                  participant engagement, and group rhythms.
                </p>
              </div>
            </article>

            <article className="portal-card dashboard-wide-card">
              <div>
                <span className="card-label">Insights</span>
                <h3>Participant Results</h3>
                <p>
                  Review Peace Index results, growth patterns, and assessment
                  trends for approved participants.
                </p>
              </div>
            </article>

            <article className="portal-card dashboard-wide-card">
              <div>
                <span className="card-label">Coaching</span>
                <h3>Notes & Next Steps</h3>
                <p>
                  Track coaching notes, relational observations, assigned
                  practices, and follow-up steps.
                </p>
              </div>
            </article>

            <article className="portal-card dashboard-wide-card">
              <div>
                <span className="card-label">Resources</span>
                <h3>Coach Toolkit</h3>
                <p>
                  Access coaching guides, facilitation tools, group prompts,
                  and PeaceWorks training resources.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}