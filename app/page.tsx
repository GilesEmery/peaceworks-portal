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
            <a href="https://www.peaceworks.network/join">Join</a>
            <a href="https://www.peaceworks.network/contact">Contact</a>
          </nav>
        </div>
      </header>

      <section className="portal-hero">
        <div className="container portal-grid">
          <div className="portal-copy">
            <div className="eyebrow">PeaceWorks Portal</div>

            <h1>Welcome to your journey toward peace.</h1>

            <p>
              This portal will become your home for assessments, courses,
              Peace Circles, progress tracking, and personalized next steps.
            </p>

            <div className="btn-row">
              <a className="btn btn-primary" href="#dashboard">
                Enter Test Portal
              </a>

              <a
                className="btn btn-secondary"
                href="https://www.peaceworks.network/"
              >
                Return to PeaceWorks
              </a>
            </div>
          </div>

          <aside className="login-card">
            <span className="card-label">Coming Soon</span>

            <h2>Member Login</h2>

            <p>
              Soon leaders will sign in here to access their Peace Index
              results, courses, resources, and Peace Circle pathway.
            </p>

            <div className="mock-input">Email address</div>
            <div className="mock-input">Password</div>

            <button className="mock-button">
              Login Preview
            </button>
          </aside>
        </div>
      </section>

      <section id="dashboard" className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <div className="eyebrow">Dashboard Preview</div>
              <h2>Your PeaceWorks Pathway</h2>
            </div>

            <p>
              This first test page shows the kind of experience the portal
              will eventually provide after login.
            </p>
          </div>

          <div className="dashboard-grid">
            <article className="portal-card">
              <h3>Peace Index</h3>

              <p>
                View assessment results, relational health indicators,
                and future 12-filter summaries.
              </p>

              <div className="progress-line">
                <span style={{ width: "72%" }} />
              </div>

              <small>Sample progress: 72%</small>
            </article>

            <article className="portal-card">
              <h3>Courses</h3>

              <p>
                Access lessons, videos, reflection guides, and practical
                tools for peace-making leadership.
              </p>

              <div className="progress-line">
                <span style={{ width: "38%" }} />
              </div>

              <small>Sample progress: 38%</small>
            </article>

            <article className="portal-card">
              <h3>Peace Circles</h3>

              <p>
                Track cohort participation, monthly rhythms,
                discussion prompts, and next steps.
              </p>

              <div className="progress-line">
                <span style={{ width: "55%" }} />
              </div>

              <small>Sample progress: 55%</small>
            </article>

            <article className="portal-card">
              <h3>Resources</h3>

              <p>
                Find listening tools, conflict repair frameworks,
                meeting guides, and implementation exercises.
              </p>

              <div className="resource-list">
                <span>Listening Lab Guide</span>
                <span>Conflict Repair Tool</span>
                <span>Leadership Reflection</span>
              </div>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}