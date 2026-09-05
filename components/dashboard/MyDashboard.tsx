"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

import SiteHeader from "../layout/SiteHeader";
import SiteFooter from "../layout/SiteFooter";
import ResultModal from "../assessment/ResultModal";
import ExpandableDashboardSection from "./ExpandableDashboardSection";
import ResourceMediaPlayer from "./ResourceMediaPlayer";

import {
  resolveSecondaryIdentityType,
  type PeaceAssessmentResult,
} from "../../lib/peaceAssessmentScoring";
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

  const latestSecondaryIdentityType = latestResult
    ? resolveSecondaryIdentityType(
        latestResult.scores,
        latestResult.identityType,
        latestResult.secondaryIdentityType
      )
    : null;
  const latestExpandedProfile = latestResult && latestSecondaryIdentityType
    ? buildPeaceReportProfile({
        identityAnchor: latestResult.identityType,
        secondaryPeaceStrategy: latestSecondaryIdentityType,
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

    const secondaryIdentityType = resolveSecondaryIdentityType(
      latestResult.scores,
      latestResult.identityType,
      latestResult.secondaryIdentityType
    );
    if (!secondaryIdentityType) {
      console.error("Dashboard assessment has no resolvable secondary identity.");
      return;
    }

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
  const circlePosts = dashboard.sections.posts || [];
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
              {question.authorName && <p className="content-byline">By {question.authorName}</p>}
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
  const notesSection =
    dashboard.sections.notes.length > 0 ? (
      <ExpandableDashboardSection
        sectionId="notes"
        eyebrow="Notes"
        title="Notes for Your Journey"
        items={dashboard.sections.notes}
        expandLabel="Show all Notes"
        collapseLabel="Show Less"
        renderItem={(note) => (
          <article
            className="portal-card dashboard-journey-card dashboard-note-card"
            key={`${note.noteSource}-${note.id}`}
          >
            <div>
              <span className="card-label">
                {note.circle?.name || formatLabel(note.noteType)}
              </span>
              <h3>{note.title}</h3>
              {note.preview && <p>{note.preview}</p>}
              {note.publishedAt && <small>Shared {formatDate(note.publishedAt)}</small>}
            </div>
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => router.push(note.detailHref)}
              aria-label={`Read note: ${note.title}`}
            >
              Read Note
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

          <DashboardSection eyebrow="Assessments" title="Insights for Your Journey">
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

          {notesSection}

          {circlePosts.length > 0 && (
            <ExpandableDashboardSection
              sectionId="circle-posts"
              eyebrow="From PeaceWorks"
              title="For Your Circle"
              items={circlePosts}
              renderItem={(post) => (
                <article className="portal-card dashboard-journey-card" key={post.id}>
                  {post.thumbnailUrl && (
                    <div
                      className="dashboard-tile-media"
                      style={{ backgroundImage: `url("${post.thumbnailUrl}")` }}
                      role="img"
                      aria-label={`${post.title} thumbnail`}
                    />
                  )}
                  <div>
                    <span className="card-label">{formatLabel(post.format)}</span>
                    <h3>{post.title}</h3>
                    {post.authorName && <p className="content-byline">By {post.authorName}</p>}
                    {post.excerpt && <p>{post.excerpt}</p>}
                    {post.circle && <small>{post.circle.name}</small>}
                  </div>
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={() => router.push(post.detailHref)}
                  >
                    Read
                  </button>
                </article>
              )}
            />
          )}

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
                    {training.authorName && <p className="content-byline">By {training.authorName}</p>}
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
                  {(resource.coverUrl || resource.thumbnailUrl) &&
                    !isPlayableMedia(resource.media.kind) && (
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
                    {resource.authorName && <p className="content-byline">By {resource.authorName}</p>}
                    {resource.description && <p>{resource.description}</p>}
                    {resource.tags.length > 0 && (
                      <div className="dashboard-result-tags">
                        {resource.tags.slice(0, 3).map((tag) => (
                          <span key={tag}>{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <ResourceMediaPlayer
                    media={resource.media}
                    resourceTitle={resource.title}
                    resourceType={resource.resourceType}
                  />
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

function isPlayableMedia(kind: string) {
  return [
    "video-embed",
    "video-file",
    "audio-embed",
    "audio-file",
  ].includes(kind);
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
          <h2 className="dashboard-section-title">{title}</h2>
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
