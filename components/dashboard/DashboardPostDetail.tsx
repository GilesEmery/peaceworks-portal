"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import type { DashboardPostDetail as DashboardPostDetailData } from "../../lib/member/dashboard";
import { routes } from "../../lib/navigation";
import { supabase } from "../../lib/supabase";
import SiteFooter from "../layout/SiteFooter";
import SiteHeader from "../layout/SiteHeader";

type PostState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; post: DashboardPostDetailData };

export default function DashboardPostDetail() {
  const params = useParams<{ communicationId: string }>();
  const router = useRouter();
  const [state, setState] = useState<PostState>({ status: "loading" });

  useEffect(() => {
    async function loadPost() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace(routes.login);
        return;
      }

      const response = await fetch(`/api/member/posts/${params.communicationId}`, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const payload = (await response.json()) as
        | { ok: true; post: DashboardPostDetailData }
        | { ok: false; message?: string };
      if (!response.ok || !payload.ok) {
        setState({
          status: "error",
          message: "message" in payload && payload.message
            ? payload.message
            : "This post could not be loaded.",
        });
        return;
      }
      setState({ status: "ready", post: payload.post });
    }

    void loadPost();
  }, [params.communicationId, router]);

  return (
    <main className="portal-page">
      <SiteHeader />
      <section className="dashboard-detail-shell">
        <div className="container">
          <article className="portal-card dashboard-detail-card">
            {state.status === "loading" && "Loading post..."}
            {state.status === "error" && (
              <>
                <span className="card-label">Circle post</span>
                <h1>Post unavailable</h1>
                <p>{state.message}</p>
              </>
            )}
            {state.status === "ready" && (
              <>
                <span className="card-label">{formatPostLabel(state.post.format)}</span>
                <h1>{state.post.title}</h1>
                {state.post.authorName && (
                  <p className="content-byline">By {state.post.authorName}</p>
                )}
                <p className="eyebrow">{state.post.circle.name}</p>
                <div className="dashboard-post-body">{state.post.body}</div>
              </>
            )}
            <button className="btn btn-secondary" type="button" onClick={() => router.push(routes.myDashboard)}>
              Back to My Dashboard
            </button>
          </article>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

function formatPostLabel(format: string) {
  if (format === "blog_article") return "Blog Post";
  if (format === "circle_update") return "Circle Update";
  if (format === "dashboard_message") return "Dashboard Message";
  return "Announcement";
}
