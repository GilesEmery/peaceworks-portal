"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import ResultModal from "../../components/assessment/ResultModal";
import SiteFooter from "../../components/layout/SiteFooter";
import SiteHeader from "../../components/layout/SiteHeader";
import { peaceAssessmentProfiles } from "../../data/peaceAssessmentProfiles";
import {
  buildPeaceReportProfile,
} from "../../data/peaceReport";
import { supabase } from "../../lib/supabase";
import type { PeaceAssessmentResult } from "../../lib/peaceAssessmentScoring";

type AssessmentStatus = "Not started" | "Results available";

type AssessmentDefinition = {
  key: "peace-assessment";
  title: string;
  description: string;
  context: string;
  route: string;
};

type PeaceAssessmentRow = {
  scores: PeaceAssessmentResult["scores"];
  identity_type: PeaceAssessmentResult["identityType"];
  secondary_identity_type?: PeaceAssessmentResult["identityType"] | null;
  response_type: PeaceAssessmentResult["responseType"];
  processing_style: PeaceAssessmentResult["processingStyle"];
  capacity_stage: PeaceAssessmentResult["capacityStage"];
  peace_profile: string;
  base_pattern: string;
  created_at: string | null;
};

const availableAssessments: AssessmentDefinition[] = [
  {
    key: "peace-assessment",
    title: "Peace Assessment",
    description:
      "Understand the patterns that shape how you seek, lose, protect, and restore peace under pressure.",
    context: "Available to every PeaceWorks member",
    route: "/peace-assessment",
  },
];

export default function AssessmentsPage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [latestPeaceResult, setLatestPeaceResult] =
    useState<PeaceAssessmentRow | null>(null);
  const [modalResult, setModalResult] = useState<PeaceAssessmentResult | null>(
    null
  );

  useEffect(() => {
    let isMounted = true;

    async function loadAssessments() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        if (!isMounted) return;

        setIsAuthenticated(false);
        setLatestPeaceResult(null);
        setIsLoading(false);
        return;
      }

      setIsAuthenticated(true);

      const { data, error } = await supabase
        .from("peace_assessment_results")
        .select(
          "scores, identity_type, secondary_identity_type, response_type, processing_style, capacity_stage, peace_profile, base_pattern, created_at"
        )
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Unable to load assessment status.", error);
      }

      if (!isMounted) return;

      setLatestPeaceResult((data as PeaceAssessmentRow | null) || null);
      setIsLoading(false);
    }

    loadAssessments();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const assessmentCards = useMemo(
    () =>
      availableAssessments.map((assessment) => {
        const latestResult =
          assessment.key === "peace-assessment" ? latestPeaceResult : null;
        const status: AssessmentStatus = latestResult
          ? "Results available"
          : "Not started";

        return {
          ...assessment,
          latestResult,
          status,
          primaryAction: !isAuthenticated
            ? "Learn More"
            : latestResult
            ? "View Results"
            : "Start Assessment",
          secondaryAction:
            isAuthenticated && latestResult ? "Retake Assessment" : "",
        };
      }),
    [isAuthenticated, latestPeaceResult]
  );

  function openPeaceResult(result: PeaceAssessmentRow) {
    const secondaryIdentityType =
      result.secondary_identity_type ||
      getSecondaryIdentityType(result.scores, result.identity_type);
    const expandedProfile = buildPeaceReportProfile({
      identityAnchor: result.identity_type,
      secondaryPeaceStrategy: secondaryIdentityType,
      pressureResponse: result.response_type,
      processingStyle: result.processing_style,
    });
    const profileKey = `${result.identity_type}|${result.response_type}|${result.processing_style}`;
    const profileContent = peaceAssessmentProfiles[profileKey];

    setModalResult({
      scores: result.scores,
      identityType: result.identity_type,
      secondaryIdentityType,
      responseType: result.response_type,
      processingStyle: result.processing_style,
      capacityStage: result.capacity_stage,
      peaceProfile: expandedProfile?.title || result.peace_profile,
      basePattern: result.base_pattern,
      profileContent,
    });
  }

  return (
    <main className="portal-page">
      <SiteHeader />

      <section className="assessments-shell">
        <div className="container">
          <div className="assessments-hero">
            <div>
              <div className="eyebrow">PeaceWorks Assessments</div>
              <h1>Assessments</h1>
              <p>
                PeaceWorks assessments help you understand your patterns,
                growth, relationships, and leadership so you can practice peace
                with more clarity.
              </p>
            </div>
          </div>

          <section className="assessments-library" aria-labelledby="available-assessments">
            <div className="assessments-library-head">
              <div>
                <p className="account-eyebrow">Available Assessments</p>
                <h2 id="available-assessments">Your assessment library</h2>
              </div>
              <p>
                Additional assessments can be added here later based on role,
                Circle membership, direct assignment, organization, invitation,
                or availability window.
              </p>
            </div>

            <div className="assessments-grid">
              {isLoading ? (
                <article className="assessment-library-card">
                  <p>Loading your assessments...</p>
                </article>
              ) : (
                assessmentCards.map((assessment) => (
                  <article className="assessment-library-card" key={assessment.key}>
                    <div>
                      <span className="assessment-status">
                        {assessment.status}
                      </span>
                      <h3>{assessment.title}</h3>
                      <p>{assessment.description}</p>
                    </div>

                    <div className="assessment-card-meta">
                      <span>{assessment.context}</span>
                      {assessment.latestResult?.created_at && (
                        <span>
                          Latest result:{" "}
                          {formatAssessmentDate(assessment.latestResult.created_at)}
                        </span>
                      )}
                    </div>

                    <div className="assessment-card-actions">
                      <button
                        className="btn btn-primary"
                        type="button"
                        onClick={() => {
                          if (assessment.latestResult) {
                            openPeaceResult(assessment.latestResult);
                            return;
                          }

                          router.push(assessment.route);
                        }}
                      >
                        {assessment.primaryAction}
                      </button>

                      {assessment.secondaryAction && (
                        <button
                          className="btn btn-secondary"
                          type="button"
                          onClick={() => router.push(assessment.route)}
                        >
                          {assessment.secondaryAction}
                        </button>
                      )}
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </section>

      <SiteFooter />

      {modalResult && (
        <ResultModal
          result={modalResult}
          onClose={() => setModalResult(null)}
          onGoToDashboard={() => router.push("/dashboard")}
        />
      )}
    </main>
  );
}

function getSecondaryIdentityType(
  scores: PeaceAssessmentResult["scores"],
  primary: PeaceAssessmentResult["identityType"]
) {
  const entries = (["Performance", "Prestige", "Prosperity"] as const)
    .filter((key) => key !== primary)
    .map((key) => [key, scores[key]] as const)
    .sort(([, a], [, b]) => b - a);

  return entries[0]?.[0] || primary;
}

function formatAssessmentDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
