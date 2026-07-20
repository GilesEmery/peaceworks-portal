"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import type { MemberNoteDetailResponse } from "../../lib/member/dashboard";
import { routes } from "../../lib/navigation";
import { supabase } from "../../lib/supabase";
import SiteFooter from "../layout/SiteFooter";
import SiteHeader from "../layout/SiteHeader";

type NoteState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; response: MemberNoteDetailResponse };

export default function DashboardNoteDetail() {
  const params = useParams<{ source: string; noteId: string }>();
  const router = useRouter();
  const [state, setState] = useState<NoteState>({ status: "loading" });

  useEffect(() => {
    async function loadNote() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace(routes.login);
        return;
      }

      try {
        const response = await fetch(
          `/api/member/notes/${params.source}/${params.noteId}`,
          {
            headers: { Authorization: `Bearer ${session.access_token}` },
            cache: "no-store",
          }
        );
        const payload = (await response.json()) as
          | MemberNoteDetailResponse
          | { ok: false; message?: string };
        if (response.status === 401) {
          router.replace(routes.login);
          return;
        }
        if (!response.ok || !payload.ok) {
          throw new Error(
            "message" in payload && payload.message
              ? payload.message
              : "This note is not available."
          );
        }
        setState({ status: "ready", response: payload });
      } catch (error) {
        setState({
          status: "error",
          message: error instanceof Error ? error.message : "This note is not available.",
        });
      }
    }

    void loadNote();
  }, [params.noteId, params.source, router]);

  return (
    <main className="portal-page">
      <SiteHeader />
      <section className="dashboard-detail-shell">
        <div className="container">
          {state.status === "loading" && (
            <article className="portal-card dashboard-detail-card">Loading note...</article>
          )}
          {state.status === "error" && (
            <article className="portal-card dashboard-detail-card">
              <span className="card-label">My Dashboard</span>
              <h1>Note unavailable</h1>
              <p>{state.message}</p>
              <BackButton onClick={() => router.push(routes.myDashboard)} />
            </article>
          )}
          {state.status === "ready" && (
            <article className="portal-card dashboard-detail-card dashboard-note-detail">
              <span className="card-label">
                {state.response.note.circle?.name || "Note for Your Journey"}
              </span>
              <h1>{state.response.note.title}</h1>
              <div className="dashboard-note-meta">
                {state.response.note.authorDisplayName && (
                  <span>From {state.response.note.authorDisplayName}</span>
                )}
                {state.response.note.publishedAt && (
                  <span>Shared {formatDate(state.response.note.publishedAt)}</span>
                )}
                {state.response.note.meetingDate && (
                  <span>Meeting {formatDate(state.response.note.meetingDate)}</span>
                )}
                {state.response.note.followUpDate && (
                  <span>Follow up {formatDate(state.response.note.followUpDate)}</span>
                )}
              </div>
              <div className="dashboard-note-body">{state.response.note.body}</div>
              {state.response.note.links.length > 0 && (
                <div className="dashboard-note-links">
                  <h2>Shared links</h2>
                  {state.response.note.links.map((link) => (
                    <a key={link.id} href={link.url} target="_blank" rel="noreferrer">
                      {link.label}
                    </a>
                  ))}
                </div>
              )}
              <BackButton onClick={() => router.push(routes.myDashboard)} />
            </article>
          )}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="btn btn-secondary" type="button" onClick={onClick}>
      Back to My Dashboard
    </button>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
