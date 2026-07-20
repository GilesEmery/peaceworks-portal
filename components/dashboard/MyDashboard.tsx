"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

import SiteHeader from "../layout/SiteHeader";
import SiteFooter from "../layout/SiteFooter";
import ResultModal from "../assessment/ResultModal";
import ExpandableDashboardSection from "./ExpandableDashboardSection";

import type { PeaceAssessmentResult } from "../../lib/peaceAssessmentScoring";
import { generatePeacePdf } from "../../lib/generatePeacePdf";
import { peaceAssessmentProfiles } from "../../data/peaceAssessmentProfiles";
import {
  buildPeaceReportProfile,
  getPeaceMainType,
} from "../../data/peaceReport";
import { routes } from "../../lib/navigation";
import type { MemberDashboardResponse } from "../../lib/member/dashboard";
import { formatMonthlyQuestionPeriod } from "../../lib/monthlyQuestionPeriod";

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
  const [dashboard, setDashboard] = useState<MemberDashboardResponse | null>(null);
  const [loadError, setLoadError] = useState("");
  const [latestResult, setLatestResult] =
    useState<DashboardAssessmentResult | null>(null);
  const [modalResult, setModalResult] = useState<PeaceAssessmentResult | null>(null);
  const [printPending, setPrintPending] = useState(false);

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

  useEffect(() => {
    if (!modalResult || !printPending) return;

    const frame = window.requestAnimationFrame(() => {
      void generatePeacePdf(
        `Peace-Assessment-${(latestMainType || "Results").replaceAll(" ", "-")}.pdf`
      ).finally(() => setPrintPending(false));
    });

    return () => window.cancelAnimationFrame(frame);
  }, [latestMainType, modalResult, printPending]);

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

  function printResult() {
    if (!latestResult) return;
    setPrintPending(true);
    openResultModal();
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

  const isCircleMember = dashboard.member.roles.includes("circle_member");
  const monthlyQuestionSection =
    dashboard.sections.monthlyQuestions.length > 0 ? (
      <ExpandableDashboardSection
        sectionId="monthly-questions"
        eyebrow="Monthly Question"
        title={
          isCircleMember
            ? "Circle Member Monthly Question"
            : "Monthly Question"
        }
        items={dashboard.sections.monthlyQuestions}
        expandLabel="Show all Monthly Questions"
        collapseLabel="Collapse Monthly Questions"
        renderItem={(question) => (
          <article
            className="portal-card dashboard-journey-card dashboard-question-card"
            key={question.contentItemId}
          >
            <div>
              <span className="card-label">
                {formatMonthlyQuestionTileLabel(
                  question.questionMonth,
                  question.questionYear,
                  question.questionNumber
                )}
              </span>
              <h3>{question.question}</h3>
              {question.coachIntroduction && (
                <p className="dashboard-coach-introduction">
                  {question.coachIntroduction}
                </p>
              )}
              {question.circle && <small>{question.circle.name}</small>}
              {question.hasReflection && (
                <div className="dashboard-reflection-status">
                  <strong>Reflection started</strong>
                  {question.reflectionUpdatedAt && (
                    <small>
                      Last saved {formatDate(question.reflectionUpdatedAt)}
                    </small>
                  )}
                </div>
              )}
            </div>
            <button
              className="btn btn-primary"
              type="button"
              onClick={() =>
                router.push(
                  `/my-dashboard/monthly-questions/${question.assignmentId}`
                )
              }
              aria-label={`Reflect on ${question.title || "this Monthly Question"}`}
            >
              {question.hasReflection
                ? "Continue Your Reflection"
                : "Reflect and Take Notes"}
            </button>
          </article>
        )}
      />
    ) : null;

  return (
    <main className="portal-page">
      <SiteHeader />

      <section className="dashboard-shell">
        <div className="container">
          <div className="dashboard-hero compact-dashboard-hero">
            <div>
              <h1 className="dashboard-title">Your PeaceWorks Journey</h1>
            </div>
          </div>

          {isCircleMember && monthlyQuestionSection}

          <DashboardSection eyebrow="Peace Assessment" title="Your Peace Profile">
            {latestResult && dashboard.assessment ? (
              <article className="portal-card dashboard-journey-card dashboard-assessment-card">
                <div>
                  <span className="card-label">Your Peace Profile</span>
                  <div className="dashboard-profile-identity">
                    <strong>{latestMainType}</strong>
                    <span>
                      {latestExpandedProfile?.title || latestResult.peaceProfile}
                    </span>
                  </div>
                  <p>
                    {latestResult.secondaryIdentityType
                      ? `Your secondary identity is ${latestResult.secondaryIdentityType}. `
                      : ""}
                    Revisit the patterns and practices that support your peace.
                  </p>
                  {dashboard.assessment.completedAt && (
                    <small>
                      Completed {formatDate(dashboard.assessment.completedAt)}
                    </small>
                  )}
                </div>
                <div className="dashboard-card-actions">
                  <button className="btn btn-primary" type="button" onClick={openResultModal}>
                    View Full Results
                  </button>
                  <button className="btn btn-secondary" type="button" onClick={printResult}>
                    Print
                  </button>
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => router.push(routes.peaceAssessment)}
                  >
                    Retake Assessment
                  </button>
                </div>
              </article>
            ) : (
              <article className="portal-card dashboard-journey-card dashboard-assessment-card">
                <div>
                  <span className="card-label">Peace Assessment</span>
                  <h3>Discover your Peace Profile</h3>
                  <p>
                    See what tends to steal your peace, how you respond under
                    pressure, and which practices can help you grow.
                  </p>
                </div>
                <div className="dashboard-card-actions">
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={() => router.push(routes.peaceAssessment)}
                  >
                    Take the Assessment
                  </button>
                </div>
              </article>
            )}
          </DashboardSection>

          {!isCircleMember && monthlyQuestionSection}

          {dashboard.sections.trainings.length > 0 && (
            <ExpandableDashboardSection
              sectionId="trainings"
              eyebrow="Training"
              title="Continue Learning"
              items={dashboard.sections.trainings}
              expandLabel="Show all Trainings"
              collapseLabel="Collapse Trainings"
              renderItem={(training) => (
                <article className="portal-card dashboard-journey-card" key={training.contentItemId}>
                  {training.coverUrl && (
                    <div
                      className="dashboard-tile-media"
                      style={{ backgroundImage: `url("${training.coverUrl}")` }}
                      role="img"
                      aria-label={`${training.title} cover`}
                    />
                  )}
                  <div>
                    <span className="card-label">{training.category || "Training"}</span>
                    <h3>{training.title}</h3>
                    {training.description && <p>{training.description}</p>}
                    {training.duration && <small>{training.duration}</small>}
                  </div>
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={() =>
                      router.push(`/my-dashboard/trainings/${training.id}`)
                    }
                    aria-label={`View training: ${training.title}`}
                  >
                    View Training
                  </button>
                </article>
              )}
            />
          )}

          {dashboard.sections.resources.length > 0 && (
            <ExpandableDashboardSection
              sectionId="resources"
              eyebrow="Resources"
              title="Tools for Your Journey"
              items={dashboard.sections.resources}
              renderItem={(resource) => (
                <article className="portal-card dashboard-journey-card" key={resource.contentItemId}>
                  {(resource.coverUrl || resource.thumbnailUrl) && (
                    <div
                      className="dashboard-tile-media"
                      style={{
                        backgroundImage: `url("${resource.coverUrl || resource.thumbnailUrl}")`,
                      }}
                      role="img"
                      aria-label={`${resource.title} cover`}
                    />
                  )}
                  <div>
                    <span className="card-label">{formatLabel(resource.resourceType)}</span>
                    <h3>{resource.title}</h3>
                    {resource.description && <p>{resource.description}</p>}
                    {resource.tags.length > 0 && (
                      <div className="dashboard-result-tags">
                        {resource.tags.slice(0, 3).map((tag) => (
                          <span key={tag}>{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  {resource.url ? (
                    <a
                      className="btn btn-primary"
                      href={resource.url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Open resource: ${resource.title}`}
                    >
                      Open Resource
                    </a>
                  ) : (
                    <button className="btn btn-secondary" type="button" disabled>
                      Resource Unavailable
                    </button>
                  )}
                </article>
              )}
            />
          )}
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

function DashboardSection({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="dashboard-journey-section">
      <div className="section-head journey-head">
        <div>
          <div className="eyebrow">{eyebrow}</div>
          <h2>{title}</h2>
        </div>
      </div>
      <div className="dashboard-journey-grid dashboard-journey-grid-1">
        {children}
      </div>
    </section>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatMonthlyQuestionTileLabel(
  month: number | null,
  year: number | null,
  questionNumber: string
) {
  const period = formatMonthlyQuestionPeriod(month, year);
  const number = questionNumber.trim();
  if (period && number) {
    return `${period.toUpperCase()} · ${number.toUpperCase()}`;
  }
  if (period) return `${period.toUpperCase()} · MONTHLY QUESTION`;
  if (number) return number.toUpperCase();
  return "MONTHLY QUESTION";
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
