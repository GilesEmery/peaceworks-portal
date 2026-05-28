export default function CirclePage() {
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
              <div className="eyebrow">PeaceWorks Circle</div>
              <h1 className="dashboard-title">Your Circle Journey</h1>
              <p className="dashboard-sub">
                A future home for your Circle pathway, courses, notes,
                assessment history, practices, and shared resources.
              </p>
            </div>
          </div>

          <div className="dashboard-wide-grid">
            <article className="portal-card dashboard-wide-card">
              <div>
                <span className="card-label">Course</span>
                <h3>Circle Journey</h3>
                <p>
                  Your core PeaceWorks Circle course pathway with monthly
                  rhythms, reflection prompts, practices, and implementation
                  steps.
                </p>
              </div>
            </article>

            <article className="portal-card dashboard-wide-card">
              <div>
                <span className="card-label">Growth</span>
                <h3>Assessments & Graphs</h3>
                <p>
                  View your Peace Index patterns, future assessment history,
                  progress over time, and visual maps of your growth.
                </p>
              </div>
            </article>

            <article className="portal-card dashboard-wide-card">
              <div>
                <span className="card-label">Reflection</span>
                <h3>Notes & Practices</h3>
                <p>
                  Keep track of personal reflections, practices, commitments,
                  and next steps from your Circle conversations.
                </p>
              </div>
            </article>

            <article className="portal-card dashboard-wide-card">
              <div>
                <span className="card-label">Resources</span>
                <h3>Circle Resources</h3>
                <p>
                  Access guides, tools, worksheets, conversation prompts, and
                  practical resources for making peace under pressure.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}