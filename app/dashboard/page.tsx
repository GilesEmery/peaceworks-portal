"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import ResultModal from "../../components/assessment/ResultModal";
import type { PeaceAssessmentResult } from "../../lib/peaceAssessmentScoring";
import { peaceAssessmentProfiles } from "../../data/peaceAssessmentProfiles";

export default function DashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [latestResult, setLatestResult] = useState<any>(null);
  const [modalResult, setModalResult] = useState<PeaceAssessmentResult | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/auth");
        return;
      }

      setUserEmail(session.user.email || "");

      const { data } = await supabase
        .from("peace_assessment_results")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (data) setLatestResult(data);

      setLoading(false);
    }

    loadDashboard();
  }, [router]);

function openResultModal() {
  if (!latestResult) return;

  const profileKey = `${latestResult.identity_type}|${latestResult.response_type}|${latestResult.processing_style}`;

  const profileContent = peaceAssessmentProfiles[profileKey];

  setModalResult({
    scores: latestResult.scores,
    identityType: latestResult.identity_type,
    responseType: latestResult.response_type,
    processingStyle: latestResult.processing_style,
    capacityStage: latestResult.capacity_stage,
    peaceProfile: latestResult.peace_profile,
    basePattern: latestResult.base_pattern,
    profileContent,
  });
}

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/auth");
  }

  if (loading) {
    return (
      <main className="portal-page">
        <section className="portal-hero">
          <div className="container">Loading dashboard...</div>
        </section>
      </main>
    );
  }

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
            <button className="nav-button" type="button" onClick={handleLogout}>
              Sign Out
            </button>
          </nav>
        </div>
      </header>

      <section className="dashboard-shell">
        <div className="container">
          <div className="dashboard-hero compact-dashboard-hero">
            <div>
              <div className="eyebrow">The Peace Index</div>
              <h1 className="dashboard-title">Your PeaceWorks Dashboard</h1>
              <p className="dashboard-sub">
                Signed in as {userEmail}. View your assessment, revisit your
                results, and continue your PeaceWorks journey.
              </p>
            </div>
          </div>

          <div className="dashboard-wide-grid">
            <article className="portal-card dashboard-wide-card">
              <div>
                <span className="card-label">Assessment</span>
                <h3>Take the PeaceWorks Assessment</h3>
                <p>
                  Take the PeaceWorks assessment to discover what tends to steal
                  your peace, how you respond under pressure, and what practices
                  can help you grow.
                </p>
              </div>

              <button
                className="btn btn-primary"
                type="button"
                onClick={() => router.push("/peace-assessment")}
              >
                Take Assessment
              </button>
            </article>

            <article className="portal-card dashboard-wide-card">
              <div>
                <span className="card-label">Latest Result</span>
                <h3>Your Assessment Results</h3>

                {latestResult ? (
                  <>
                    <p>
                      Your latest PeaceWorks Assessment result is{" "}
                      <strong>{latestResult.peace_profile}</strong>.
                    </p>

                    <div className="dashboard-result-tags">
                      <span>{latestResult.base_pattern}</span>
                      <span>{latestResult.processing_style} Processing</span>
                      <span>{latestResult.capacity_stage} Capacity</span>
                    </div>
                  </>
                ) : (
                  <p>
                    Once you complete the assessment, your latest result will
                    appear here.
                  </p>
                )}
              </div>

              <button
                className="btn btn-secondary"
                type="button"
                onClick={
                  latestResult
                    ? openResultModal
                    : () => router.push("/peace-assessment")
                }
              >
                {latestResult ? "View Full Result" : "Start Assessment"}
              </button>
            </article>
          </div>

          <div className="dashboard-divider" />

          <div className="section-head journey-head">
            <div>
              <div className="eyebrow">PeaceWorks Pathways</div>
              <h2>Your PeaceWorks Journey</h2>
            </div>
          </div>

          <div className="dashboard-wide-grid">
            <article className="portal-card dashboard-wide-card">
              <div>
                <span className="card-label">Circle Members</span>
                <h3>Your Circle</h3>
                <p>
                  Enter your Circle space for your journey pathway, courses,
                  assessments, notes, graphs, and shared PeaceWorks resources.
                </p>
              </div>

              <button
                className="btn btn-primary"
                type="button"
                onClick={() => router.push("/circle")}
              >
                Enter Your Circle
              </button>
            </article>

            <article className="portal-card dashboard-wide-card">
              <div>
                <span className="card-label">Coaches</span>
                <h3>Coach Portal</h3>
                <p>
                  Access coaching pathways, Circle support tools, participant
                  insights, notes, resources, and future reporting.
                </p>
              </div>

              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => router.push("/coach")}
              >
                View Coach Portal
              </button>
            </article>
          </div>
        </div>
      </section>

      {modalResult && (
        <ResultModal
          result={modalResult}
          onClose={() => setModalResult(null)}
          onGoToDashboard={() => setModalResult(null)}
        />
      )}
    </main>
  );
}