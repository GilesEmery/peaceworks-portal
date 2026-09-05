"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type { MemberDashboardResponse } from "../../lib/member/dashboard";
import { dashboardLoginHref, routes } from "../../lib/navigation";
import { formatMonthlyQuestionPeriod } from "../../lib/monthlyQuestionPeriod";
import { supabase } from "../../lib/supabase";
import ResourceMediaPlayer from "../dashboard/ResourceMediaPlayer";
import styles from "./CircleDashboard.module.css";

type CircleViewState =
  | { status: "loading" }
  | { status: "denied" }
  | { status: "error"; message: string }
  | { status: "ready"; dashboard: MemberDashboardResponse };

export default function CircleDashboard() {
  const router = useRouter();
  const [state, setState] = useState<CircleViewState>({ status: "loading" });

  useEffect(() => {
    async function loadCircleHome() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        router.replace(dashboardLoginHref(routes.circle));
        return;
      }

      try {
        const headers = { Authorization: `Bearer ${session.access_token}` };
        const accessResponse = await fetch("/api/circle/me", {
          cache: "no-store",
          headers,
        });

        if (!accessResponse.ok) {
          setState(
            accessResponse.status === 401 || accessResponse.status === 403
              ? { status: "denied" }
              : { status: "error", message: "Your Circle could not be loaded." }
          );
          return;
        }

        const dashboardResponse = await fetch("/api/member/dashboard", {
          cache: "no-store",
          headers,
        });
        const payload = (await dashboardResponse.json()) as
          | MemberDashboardResponse
          | { ok: false; message?: string };

        if (!dashboardResponse.ok || !payload.ok) {
          throw new Error(
            "message" in payload && payload.message
              ? payload.message
              : "Your Circle could not be loaded."
          );
        }

        setState({ status: "ready", dashboard: payload });
      } catch (error) {
        setState({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Your Circle could not be loaded.",
        });
      }
    }

    void loadCircleHome();
  }, [router]);

  if (state.status === "loading") {
    return <CircleStatus>Checking Circle access...</CircleStatus>;
  }

  if (state.status === "denied") {
    return (
      <CircleStatus>
        <span className="card-label">PeaceWorks Circle</span>
        <h1>Circle access is not available for this account.</h1>
        <p>Circle spaces are available to active Circle members.</p>
      </CircleStatus>
    );
  }

  if (state.status === "error") {
    return (
      <CircleStatus>
        <span className="card-label">PeaceWorks Circle</span>
        <h1>Your Circle could not be loaded.</h1>
        <p>{state.message}</p>
      </CircleStatus>
    );
  }

  const { dashboard } = state;
  if (!dashboard.eligibility.hasActiveCircle || dashboard.circles.length === 0) {
    return (
      <CircleStatus>
        <span className="card-label">PeaceWorks Circle</span>
        <h1>No active Circle is connected to this account.</h1>
      </CircleStatus>
    );
  }

  const circleIds = new Set(dashboard.circles.map((circle) => circle.id));
  const monthlyQuestions = Array.from(
    dashboard.sections.monthlyQuestions
      .filter((question) => question.circle && circleIds.has(question.circle.id))
      .reduce((questionsByCircle, question) => {
        const circleId = question.circle?.id;
        if (circleId && !questionsByCircle.has(circleId)) {
          questionsByCircle.set(circleId, question);
        }
        return questionsByCircle;
      }, new Map<string, MemberDashboardResponse["sections"]["monthlyQuestions"][number]>())
      .values()
  );
  const resources = dashboard.sections.resources.filter(
    (resource) => resource.circle && circleIds.has(resource.circle.id)
  );
  const trainings = dashboard.sections.trainings.filter(
    (training) => training.circle && circleIds.has(training.circle.id)
  );
  const notes = dashboard.sections.notes.filter(
    (note) => note.circle && circleIds.has(note.circle.id)
  );
  const posts = (dashboard.sections.posts || []).filter((post) =>
    Boolean(post.circle && circleIds.has(post.circle.id))
  );

  return (
    <section className={styles.shell}>
      <div className="container">
        <header className={styles.identity}>
          <span className="eyebrow">Your PeaceWorks Circle</span>
          <h1>{dashboard.circles.map((circle) => circle.name).join(" · ")}</h1>
          {dashboard.circles.map((circle) => (
            <div className={styles.identityDetail} key={circle.id}>
              {circle.description && <p>{circle.description}</p>}
              {circle.coaches.length > 0 && (
                <p>
                  <strong>{circle.coaches.length === 1 ? "Coach" : "Coaches"}</strong>{" "}
                  {circle.coaches.map((coach) => coach.displayName).join(", ")}
                </p>
              )}
              {circle.joinedAt && (
                <p>
                  <strong>Connected since</strong> {formatDate(circle.joinedAt)}
                </p>
              )}
            </div>
          ))}
        </header>

        {monthlyQuestions.length > 0 && (
          <CircleSection eyebrow="Current rhythm" title="Monthly Question">
            <div className={styles.singleColumn}>
              {monthlyQuestions.map((question) => (
                <article className={`${styles.panel} ${styles.question}`} key={question.assignmentId}>
                  <div>
                    <span className="card-label">
                      {formatQuestionLabel(question.questionMonth, question.questionYear)}
                    </span>
                    <h2>{question.question}</h2>
                    {question.authorName && <p className="content-byline">By {question.authorName}</p>}
                    {question.coachIntroduction && <p>{question.coachIntroduction}</p>}
                    {question.openingReflection && (
                      <p className={styles.supportingCopy}>{question.openingReflection}</p>
                    )}
                    {question.hasReflection && (
                      <p className={styles.reflectionState}>
                        Reflection started
                        {question.reflectionUpdatedAt
                          ? ` · Saved ${formatDate(question.reflectionUpdatedAt)}`
                          : ""}
                      </p>
                    )}
                  </div>
                  <Link className="btn btn-primary" href={`/my-dashboard/monthly-questions/${question.assignmentId}`}>
                    {question.hasReflection ? "Continue Reflection" : "Reflect"}
                  </Link>
                </article>
              ))}
            </div>
          </CircleSection>
        )}

        {posts.length > 0 && (
          <CircleSection eyebrow="From PeaceWorks" title="Circle Posts">
            <div className={styles.grid}>
              {posts.map((post) => (
                <article className={styles.panel} key={post.id}>
                  <div>
                    <span className="card-label">{formatPostLabel(post.format)}</span>
                    <h3>{post.title}</h3>
                    {post.authorName && <p className="content-byline">By {post.authorName}</p>}
                    {post.excerpt && <p>{post.excerpt}</p>}
                  </div>
                  <Link className="btn btn-secondary" href={post.detailHref}>Read</Link>
                </article>
              ))}
            </div>
          </CircleSection>
        )}

        {trainings.length > 0 && (
          <CircleSection eyebrow="Circle learning" title="Assigned Trainings">
            <div className={styles.grid}>
              {trainings.map((training) => (
                <article className={styles.panel} key={training.contentItemId}>
                  <div>
                    <span className="card-label">{training.circle?.name}</span>
                    <h3>{training.title}</h3>
                    {training.authorName && <p className="content-byline">By {training.authorName}</p>}
                    {training.description && <p>{training.description}</p>}
                    {training.duration && <small>{training.duration}</small>}
                  </div>
                  <Link className="btn btn-secondary" href={`/my-dashboard/trainings/${training.id}`}>
                    View Training
                  </Link>
                </article>
              ))}
            </div>
          </CircleSection>
        )}

        {resources.length > 0 && (
          <CircleSection eyebrow="For your Circle" title="Assigned Resources">
            <div className={styles.grid}>
              {resources.map((resource) => (
                <article className={styles.panel} key={resource.contentItemId}>
                  <div>
                    <span className="card-label">{resource.circle?.name}</span>
                    <h3>{resource.title}</h3>
                    {resource.authorName && <p className="content-byline">By {resource.authorName}</p>}
                    {resource.description && <p>{resource.description}</p>}
                  </div>
                  <ResourceMediaPlayer
                    media={resource.media}
                    resourceTitle={resource.title}
                    resourceType={resource.resourceType}
                  />
                </article>
              ))}
            </div>
          </CircleSection>
        )}

        {notes.length > 0 && (
          <CircleSection eyebrow="From your Circle" title="Circle Notes">
            <div className={styles.grid}>
              {notes.map((note) => (
                <article className={styles.panel} key={`${note.noteSource}-${note.id}`}>
                  <div>
                    <span className="card-label">{note.circle?.name}</span>
                    <h3>{note.title}</h3>
                    {note.preview && <p>{note.preview}</p>}
                  </div>
                  <Link className="btn btn-secondary" href={note.detailHref}>Read Note</Link>
                </article>
              ))}
            </div>
          </CircleSection>
        )}

        <section className={styles.connection} aria-labelledby="circle-connection-title">
          <div>
            <span className="eyebrow">Connection</span>
            <h2 id="circle-connection-title">Stay connected</h2>
            <p>Open your PeaceWorks messages to continue the conversation.</p>
          </div>
          <Link className="btn btn-primary" href={routes.messages}>Open Messages</Link>
        </section>
      </div>
    </section>
  );
}

function CircleStatus({ children }: { children: React.ReactNode }) {
  return (
    <section className={styles.shell}>
      <div className="container">
        <article className={styles.status}>{children}</article>
      </div>
    </section>
  );
}

function CircleSection({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.section}>
      <header>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </header>
      {children}
    </section>
  );
}

function formatQuestionLabel(month: number | null, year: number | null) {
  const period = formatMonthlyQuestionPeriod(month, year);
  return period ? period.toUpperCase() : "MONTHLY QUESTION";
}

function formatPostLabel(format: string) {
  if (format === "blog_article") return "Blog Post";
  if (format === "circle_update") return "Circle Update";
  if (format === "dashboard_message") return "Dashboard Message";
  return "Announcement";
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "recently";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
