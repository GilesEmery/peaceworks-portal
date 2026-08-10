"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import type {
  DashboardMonthlyQuestion,
  DashboardTraining,
  MemberDashboardResponse,
} from "../../lib/member/dashboard";
import {
  monthlyQuestionReflectionMaxLength,
  type MonthlyQuestionReflectionResponse,
} from "../../lib/monthlyQuestionReflections";
import { formatMonthlyQuestionPeriod } from "../../lib/monthlyQuestionPeriod";
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
      accessToken: string;
      isCircleMember: boolean;
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
                (question) => question.assignmentId === params.id
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

        setState({
          status: "ready",
          item,
          accessToken: session.access_token,
          isCircleMember: payload.member.roles.includes("circle_member"),
        });
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
                accessToken={state.accessToken}
                isCircleMember={state.isCircleMember}
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
  accessToken,
  isCircleMember,
  question,
  onBack,
}: {
  accessToken: string;
  isCircleMember: boolean;
  question: DashboardMonthlyQuestion;
  onBack: () => void;
}) {
  const [body, setBody] = useState("");
  const [savedBody, setSavedBody] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [status, setStatus] = useState<
    "loading" | "ready" | "saving" | "saved" | "error"
  >("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadReflection() {
      try {
        const response = await fetch(
          `/api/member/monthly-questions/${question.assignmentId}/reflection`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            cache: "no-store",
          }
        );
        const payload = (await response.json()) as
          | MonthlyQuestionReflectionResponse
          | { ok: false; message?: string };

        if (!response.ok || !payload.ok) {
          throw new Error(
            "message" in payload && payload.message
              ? payload.message
              : "Your reflection could not be loaded."
          );
        }

        setBody(payload.reflection.body);
        setSavedBody(payload.reflection.body);
        setSavedAt(payload.reflection.updatedAt);
        setStatus("ready");
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Your reflection could not be loaded."
        );
        setStatus("error");
      }
    }

    void loadReflection();
  }, [accessToken, question.assignmentId]);

  const dirty = body !== savedBody;
  const period = formatMonthlyQuestionPeriod(
    question.questionMonth,
    question.questionYear
  );

  async function saveReflection() {
    if (status === "saving" || body.length > monthlyQuestionReflectionMaxLength) {
      return;
    }

    setStatus("saving");
    setMessage("");
    try {
      const response = await fetch(
        `/api/member/monthly-questions/${question.assignmentId}/reflection`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reflectionBody: body }),
        }
      );
      const payload = (await response.json()) as
        | MonthlyQuestionReflectionResponse
        | { ok: false; message?: string };

      if (!response.ok || !payload.ok) {
        throw new Error(
          "message" in payload && payload.message
            ? payload.message
            : "Your reflection could not be saved."
        );
      }

      setBody(payload.reflection.body);
      setSavedBody(payload.reflection.body);
      setSavedAt(payload.reflection.updatedAt);
      setStatus("saved");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Your reflection could not be saved."
      );
      setStatus("error");
    }
  }

  return (
    <article className="portal-card dashboard-detail-card">
      <span className="card-label">
        {period ? `${period} · ` : ""}
        {question.questionNumber ? `${question.questionNumber} · ` : ""}
        {isCircleMember ? "Circle Member Monthly Question" : "Monthly Question"}
      </span>
      <h1>{question.title || "This Month's Question"}</h1>
      {question.authorName && <p className="content-byline">By {question.authorName}</p>}
      {(question.theme || question.category) && (
        <p className="eyebrow">{question.theme || question.category}</p>
      )}
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
      <section className="dashboard-reflection-editor">
        <label htmlFor="monthly-question-reflection">Your Reflection and Notes</label>
        <textarea
          id="monthly-question-reflection"
          value={body}
          maxLength={monthlyQuestionReflectionMaxLength}
          disabled={status === "loading"}
          onChange={(event) => {
            setBody(event.target.value);
            setStatus("ready");
            setMessage("");
          }}
          rows={12}
        />
        <div className="dashboard-reflection-meta">
          <span>
            {body.length.toLocaleString()} /{" "}
            {monthlyQuestionReflectionMaxLength.toLocaleString()}
          </span>
          <span aria-live="polite">
            {status === "loading" && "Loading reflection…"}
            {status === "saving" && "Saving…"}
            {status === "saved" && "Saved"}
            {status === "ready" && (dirty ? "Unsaved changes" : "Saved")}
            {status === "error" && "Unable to save"}
          </span>
        </div>
        {savedAt && (
          <small>Last saved {formatDateTime(savedAt)}</small>
        )}
        {message && <p className="form-message error">{message}</p>}
        <p className="dashboard-reflection-disclosure">
          Your reflection is shared with your authorized PeaceWorks coach or
          coaches so they can better support your continued growth.
        </p>
        <div className="dashboard-reflection-actions">
          <button
            className="btn btn-primary"
            type="button"
            disabled={status === "loading" || status === "saving" || !dirty}
            onClick={saveReflection}
          >
            {status === "saving" ? "Saving…" : "Save Reflection"}
          </button>
          <button className="btn btn-secondary" type="button" onClick={onBack}>
            Back to My Dashboard
          </button>
        </div>
      </section>
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
      {training.authorName && <p className="content-byline">By {training.authorName}</p>}
      {training.duration && <p className="eyebrow">{training.duration}</p>}
      {training.description && <p>{training.description}</p>}
      <button className="btn btn-secondary" type="button" onClick={onBack}>
        Back to My Dashboard
      </button>
    </article>
  );
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
