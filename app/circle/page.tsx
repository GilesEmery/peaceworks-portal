import SiteHeader from "../../components/layout/SiteHeader";
import SiteFooter from "../../components/layout/SiteFooter";

export default function CirclePage() {
  return (
    <main className="portal-page">
      <SiteHeader />

      <section className="dashboard-shell">
        <div className="container">
          <div className="dashboard-hero compact-dashboard-hero">
            <div>
              <div className="eyebrow">PeaceWorks Circle</div>
              <h1 className="dashboard-title">Your Circle Journey</h1>
              <p className="dashboard-sub">
                Your Circle is the home for courses, practices, notes,
                assessments, resources, and next steps as you continue growing
                as a person of peace.
              </p>
            </div>
          </div>

          <div className="dashboard-wide-grid">
            <article className="portal-card dashboard-wide-card">
              <div>
                <span className="card-label">Course</span>
                <h3>Circle Journey</h3>
                <p>
                  Your core PeaceWorks pathway with monthly rhythms, teaching,
                  reflection prompts, practices, and implementation steps.
                </p>
              </div>
            </article>

            <article className="portal-card dashboard-wide-card">
              <div>
                <span className="card-label">Growth</span>
                <h3>Assessments & Graphs</h3>
                <p>
                  View your Peace Index patterns, Peace Assessment history,
                  progress over time, and visual maps of your growth.
                </p>
              </div>
            </article>

            <article className="portal-card dashboard-wide-card">
              <div>
                <span className="card-label">Reflection</span>
                <h3>Notes & Practices</h3>
                <p>
                  Track reflections, practices, commitments, and next steps from
                  your Circle conversations.
                </p>
              </div>
            </article>

            <article className="portal-card dashboard-wide-card">
              <div>
                <span className="card-label">Resources</span>
                <h3>Circle Resources</h3>
                <p>
                  Access tools, worksheets, conversation prompts, and practical
                  resources for making peace under pressure.
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
