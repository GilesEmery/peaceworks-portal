"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

import SiteHeader from "../layout/SiteHeader";
import SiteFooter from "../layout/SiteFooter";
import ResultModal from "../assessment/ResultModal";

import type { PeaceAssessmentResult } from "../../lib/peaceAssessmentScoring";
import { peaceAssessmentProfiles } from "../../data/peaceAssessmentProfiles";
import {
  buildPeaceReportProfile,
  getPeaceMainType,
} from "../../data/peaceReport";
import { routes } from "../../lib/navigation";

type DashboardAssessmentResult = {
  scores: PeaceAssessmentResult["scores"];
  identity_type: PeaceAssessmentResult["identityType"];
  secondary_identity_type?: PeaceAssessmentResult["identityType"] | null;
  response_type: PeaceAssessmentResult["responseType"];
  processing_style: PeaceAssessmentResult["processingStyle"];
  capacity_stage: PeaceAssessmentResult["capacityStage"];
  peace_profile: string;
  base_pattern: string;
};

export default function MyDashboard() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [latestResult, setLatestResult] =
    useState<DashboardAssessmentResult | null>(null);
  const [modalResult, setModalResult] = useState<PeaceAssessmentResult | null>(null);

  const latestExpandedProfile = latestResult
    ? buildPeaceReportProfile({
        identityAnchor: latestResult.identity_type,
        secondaryPeaceStrategy:
          latestResult.secondary_identity_type ||
          getSecondaryIdentityType(latestResult.scores, latestResult.identity_type),
        pressureResponse: latestResult.response_type,
        processingStyle: latestResult.processing_style,
      })
    : null;
  const latestMainType = latestResult
    ? getPeaceMainType(latestResult.identity_type, latestResult.response_type)
    : "";

  useEffect(() => {
    async function loadDashboard() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push(routes.login);
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

      if (data) setLatestResult(data as DashboardAssessmentResult);

      setLoading(false);
    }

    loadDashboard();
  }, [router]);

  function openResultModal() {
    if (!latestResult) return;

    const secondaryIdentityType =
      latestResult.secondary_identity_type ||
      getSecondaryIdentityType(latestResult.scores, latestResult.identity_type);

    const profileKey = `${latestResult.identity_type}|${latestResult.response_type}|${latestResult.processing_style}`;
    const profileContent = peaceAssessmentProfiles[profileKey];

    setModalResult({
      scores: latestResult.scores,
      identityType: latestResult.identity_type,
      secondaryIdentityType,
      responseType: latestResult.response_type,
      processingStyle: latestResult.processing_style,
      capacityStage: latestResult.capacity_stage,
      peaceProfile: latestExpandedProfile?.title || latestResult.peace_profile,
      basePattern: latestResult.base_pattern,
      profileContent,
    });
  }

  if (loading) {
    return (
      <main className="portal-page">
        <SiteHeader />
        <section className="portal-hero">
          <div className="container">Loading dashboard...</div>
        </section>
        <SiteFooter />
      </main>
    );
  }

  return (
    <main className="portal-page">
      <SiteHeader />

      <section className="dashboard-shell">
        <div className="container">
          <div className="dashboard-hero compact-dashboard-hero">
            <div>
              <div className="eyebrow">The Peace Index</div>
              <h1 className="dashboard-title">Your PeaceWorks Dashboard</h1>
              <p className="dashboard-sub">
                Signed in as {userEmail}. View your Peace Assessment, revisit
                your results, and continue your PeaceWorks journey.
              </p>
            </div>
          </div>

          <div className="dashboard-wide-grid">
            <article className="portal-card dashboard-wide-card">
              <div>
                <span className="card-label">Assessment</span>
                <h3>Take the Peace Assessment</h3>
                <p>
                  Take the Peace Assessment to discover what tends to steal
                  your peace, how you respond under pressure, and what practices
                  can help you grow.
                </p>
              </div>

              <button
                className="btn btn-primary"
                type="button"
                onClick={() => router.push(routes.peaceAssessment)}
              >
                Take Peace Assessment
              </button>
            </article>

            <article className="portal-card dashboard-wide-card">
              <div>
                <span className="card-label">Latest Result</span>
                <h3>Your Peace Assessment Results</h3>

                {latestResult ? (
                  <>
                    <div className="dashboard-profile-identity">
                      <strong>{latestMainType}</strong>
                      <span>
                        {latestExpandedProfile?.title ||
                          latestResult.peace_profile}
                      </span>
                    </div>

                    <div className="dashboard-result-tags">
                      <span>
                        {latestExpandedProfile?.profileCode ||
                          latestResult.base_pattern}
                      </span>
                      <span>{latestResult.capacity_stage} Capacity</span>
                    </div>
                  </>
                ) : (
                  <p>
                    Once you complete the Peace Assessment, your latest result
                    will appear here.
                  </p>
                )}
              </div>

              <button
                className="btn btn-secondary"
                type="button"
                onClick={
                  latestResult
                    ? openResultModal
                    : () => router.push(routes.peaceAssessment)
                }
              >
                {latestResult ? "View Full Result" : "Start Peace Assessment"}
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
                onClick={() => router.push(routes.circle)}
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
                onClick={() => router.push(routes.coach)}
              >
                View Coach Portal
              </button>
            </article>
          </div>
        </div>
      </section>

      <SiteFooter />

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

function getSecondaryIdentityType(
  scores: PeaceAssessmentResult["scores"] | null | undefined,
  primary: string
): PeaceAssessmentResult["identityType"] {
  const identityKeys: PeaceAssessmentResult["identityType"][] = [
    "Performance",
    "Prestige",
    "Prosperity",
  ];

  return identityKeys
    .filter((key) => key !== primary)
    .map((key) => ({
      key,
      value: Number(scores?.[key] ?? 0),
    }))
    .sort((a, b) => b.value - a.value)[0].key;
}
