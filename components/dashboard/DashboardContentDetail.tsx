"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import type {
  DashboardMonthlyQuestion,
  DashboardTraining,
  MemberDashboardResponse,
} from "../../lib/member/dashboard";
import { routes } from "../../lib/navigation";
import { supabase } from "../../lib/supabase";
import SiteFooter from "../layout/SiteFooter";
import SiteHeader from "../layout/SiteHeader";

type DetailState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      item: DashboardMonthlyQuestion | DashboardTraining;
    };

export default function DashboardContentDetail({
  kind,
}: {
  kind: "monthlyQuestion" | "training";
}) {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [state, setState] = useState<DetailState>({ status: "loading" });

  useEffect(() => {
    async function loadContent() {
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
              : "This content could not be loaded."
          );
        }

        const item =
          kind === "monthlyQuestion"
            ? payload.sections.monthlyQuestions.find(
                (question) => question.id === params.id
              )
            : payload.sections.trainings.find(
                (training) => training.id === params.id
              );

        if (!item) {
          setState({
            status: "error",
            message: "This assigned content is no longer available.",
          });
          return;
        }

        setState({ status: "ready", item });
      } catch (error) {
        setState({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "This content could not be loaded.",
        });
      }
    }

    void loadContent();
  }, [kind, params.id, router]);

  return (
    <main className="portal-page">
      <SiteHeader />
      <section className="dashboard-detail-shell">
        <div className="container">
          {state.status === "loading" && (
            <article className="portal-card dashboard-detail-card">
              Loading your content...
            </article>
          )}

          {state.status === "error" && (
            <article className="portal-card dashboard-detail-card">
              <span className="card-label">My Dashboard</span>
              <h1>Content unavailable</h1>
              <p>{state.message}</p>
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => router.push(routes.myDashboard)}
              >
                Back to My Dashboard
              </button>
            </article>
          )}

          {state.status === "ready" &&
            (kind === "monthlyQuestion" ? (
              <MonthlyQuestionDetail
                question={state.item as DashboardMonthlyQuestion}
                onBack={() => router.push(routes.myDashboard)}
              />
            ) : (
              <TrainingDetail
                training={state.item as DashboardTraining}
                onBack={() => router.push(routes.myDashboard)}
              />
            ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

function MonthlyQuestionDetail({
  question,
  onBack,
}: {
  question: DashboardMonthlyQuestion;
  onBack: () => void;
}) {
  return (
    <article className="portal-card dashboard-detail-card">
      <span className="card-label">
        {question.theme || question.category || "Monthly Question"}
      </span>
      <h1>{question.title || "This Month's Question"}</h1>
      {question.circle && <p className="eyebrow">{question.circle.name}</p>}
      {question.coachIntroduction && (
        <p className="dashboard-coach-introduction">
          {question.coachIntroduction}
        </p>
      )}
      {question.openingReflection && <p>{question.openingReflection}</p>}
      <blockquote className="dashboard-detail-question">
        {question.question}
      </blockquote>
      {question.guidance && <p>{question.guidance}</p>}
      {question.discussionPrompts.length > 0 && (
        <ul className="dashboard-detail-prompts">
          {question.discussionPrompts.map((prompt) => (
            <li key={prompt}>{prompt}</li>
          ))}
        </ul>
      )}
      <button className="btn btn-secondary" type="button" onClick={onBack}>
        Back to My Dashboard
      </button>
    </article>
  );
}

function TrainingDetail({
  training,
  onBack,
}: {
  training: DashboardTraining;
  onBack: () => void;
}) {
  return (
    <article className="portal-card dashboard-detail-card">
      {training.coverUrl && (
        <div
          className="dashboard-tile-media"
          style={{ backgroundImage: `url("${training.coverUrl}")` }}
          role="img"
          aria-label={`${training.title} cover`}
        />
      )}
      <span className="card-label">{training.category || "Training"}</span>
      <h1>{training.title}</h1>
      {training.duration && <p className="eyebrow">{training.duration}</p>}
      {training.description && <p>{training.description}</p>}
      <button className="btn btn-secondary" type="button" onClick={onBack}>
        Back to My Dashboard
      </button>
    </article>
  );
}
