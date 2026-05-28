import SiteHeader from "../../components/layout/SiteHeader";
import SiteFooter from "../../components/layout/SiteFooter";

export default function CoachPage() {
  return (
    <main className="portal-page">
      <SiteHeader />

      <section className="dashboard-shell">
        <div className="container">
          <div className="dashboard-hero compact-dashboard-hero">
            <div>
              <div className="eyebrow">PeaceWorks Coaches</div>
              <h1 className="dashboard-title">Coach Portal</h1>
              <p className="dashboard-sub">
                The Coach Portal supports Circle leaders, facilitators, and
                coaches through participant insights, coaching tools, notes,
                and PeaceWorks resources.
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
                  participant engagement, and ongoing group rhythms.
                </p>
              </div>
            </article>

            <article className="portal-card dashboard-wide-card">
              <div>
                <span className="card-label">Insights</span>
                <h3>Participant Results</h3>
                <p>
                  Review Peace Index results, growth patterns, assessment
                  trends, and future analytics for approved participants.
                </p>
              </div>
            </article>

            <article className="portal-card dashboard-wide-card">
              <div>
                <span className="card-label">Coaching</span>
                <h3>Notes & Next Steps</h3>
                <p>
                  Track coaching notes, relational observations, practices,
                  follow-up steps, and development pathways.
                </p>
              </div>
            </article>

            <article className="portal-card dashboard-wide-card">
              <div>
                <span className="card-label">Resources</span>
                <h3>Coach Toolkit</h3>
                <p>
                  Access facilitation guides, group prompts, worksheets,
                  teaching tools, and PeaceWorks coaching resources.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}