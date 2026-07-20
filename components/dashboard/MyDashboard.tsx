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
import type { MemberDashboardResponse } from "../../lib/member/dashboard";

type DashboardAssessmentResult = {
  scores: PeaceAssessmentResult["scores"];
  identityType: PeaceAssessmentResult["identityType"];
  secondaryIdentityType?: PeaceAssessmentResult["identityType"] | null;
  responseType: PeaceAssessmentResult["responseType"];
  processingStyle: PeaceAssessmentResult["processingStyle"];
  capacityStage: PeaceAssessmentResult["capacityStage"];
  peaceProfile: string;
  basePattern: string;
};

export default function MyDashboard() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [dashboard, setDashboard] = useState<MemberDashboardResponse | null>(null);
  const [loadError, setLoadError] = useState("");
  const [latestResult, setLatestResult] =
    useState<DashboardAssessmentResult | null>(null);
  const [modalResult, setModalResult] = useState<PeaceAssessmentResult | null>(null);

  const latestExpandedProfile = latestResult
    ? buildPeaceReportProfile({
        identityAnchor: latestResult.identityType,
        secondaryPeaceStrategy:
          latestResult.secondaryIdentityType ||
          getSecondaryIdentityType(latestResult.scores, latestResult.identityType),
        pressureResponse: latestResult.responseType,
        processingStyle: latestResult.processingStyle,
      })
    : null;
  const latestMainType = latestResult
    ? getPeaceMainType(latestResult.identityType, latestResult.responseType)
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

      try {
        const response = await fetch("/api/member/dashboard", {
          headers: { Authorization: `Bearer ${session.access_token}` },
          cache: "no-store",
        });
        const payload = (await response.json()) as
          | MemberDashboardResponse
          | { ok: false; message?: string };

        if (response.status === 401) {
          router.push(routes.login);
          return;
        }
        if (!response.ok || !payload.ok) {
          throw new Error(
            "message" in payload && payload.message
              ? payload.message
              : "Your dashboard could not be loaded."
          );
        }

        setDashboard(payload);
        if (payload.assessment) {
          setLatestResult({
            scores: payload.assessment.scores as PeaceAssessmentResult["scores"],
            identityType:
              payload.assessment.identityType as PeaceAssessmentResult["identityType"],
            secondaryIdentityType:
              payload.assessment
                .secondaryIdentityType as PeaceAssessmentResult["identityType"] | null,
            responseType:
              payload.assessment.responseType as PeaceAssessmentResult["responseType"],
            processingStyle:
              payload.assessment
                .processingStyle as PeaceAssessmentResult["processingStyle"],
            capacityStage:
              payload.assessment.capacityStage as PeaceAssessmentResult["capacityStage"],
            peaceProfile: payload.assessment.peaceProfile,
            basePattern: payload.assessment.basePattern,
          });
        }
      } catch (error) {
        console.error("Member dashboard load failed", error);
        setLoadError(
          error instanceof Error
            ? error.message
            : "Your dashboard could not be loaded."
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  function openResultModal() {
    if (!latestResult) return;

    const secondaryIdentityType =
      latestResult.secondaryIdentityType ||
      getSecondaryIdentityType(latestResult.scores, latestResult.identityType);

    const profileKey = `${latestResult.identityType}|${latestResult.responseType}|${latestResult.processingStyle}`;
    const profileContent = peaceAssessmentProfiles[profileKey];

    setModalResult({
      scores: latestResult.scores,
      identityType: latestResult.identityType,
      secondaryIdentityType,
      responseType: latestResult.responseType,
      processingStyle: latestResult.processingStyle,
      capacityStage: latestResult.capacityStage,
      peaceProfile: latestExpandedProfile?.title || latestResult.peaceProfile,
      basePattern: latestResult.basePattern,
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

  if (loadError || !dashboard) {
    return (
      <main className="portal-page">
        <SiteHeader />
        <section className="portal-hero">
          <div className="container">
            {loadError || "Your dashboard could not be loaded."}
          </div>
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
                          latestResult.peaceProfile}
                      </span>
                    </div>

                    <div className="dashboard-result-tags">
                      <span>
                        {latestExpandedProfile?.profileCode ||
                          latestResult.basePattern}
                      </span>
                      <span>{latestResult.capacityStage} Capacity</span>
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
