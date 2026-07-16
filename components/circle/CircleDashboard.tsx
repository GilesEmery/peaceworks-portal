"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { dashboardLoginHref, routes } from "../../lib/navigation";
import { supabase } from "../../lib/supabase";

type CircleState = "loading" | "ready" | "denied" | "error";

export default function CircleDashboard() {
  const router = useRouter();
  const [state, setState] = useState<CircleState>("loading");

  useEffect(() => {
    async function verifyAccess() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        router.replace(dashboardLoginHref(routes.circle));
        return;
      }

      const response = await fetch("/api/circle/me", {
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        setState("ready");
        return;
      }

      setState(response.status === 401 || response.status === 403 ? "denied" : "error");
    }

    void verifyAccess();
  }, [router]);

  if (state === "loading") {
    return (
      <section className="dashboard-shell">
        <div className="container">
          <div className="portal-card">Checking Circle access...</div>
        </div>
      </section>
    );
  }

  if (state === "denied") {
    return (
      <section className="dashboard-shell">
        <div className="container">
          <div className="portal-card">
            <span className="card-label">PeaceWorks Circle</span>
            <h1>Circle access is not available for this account.</h1>
            <p>Circle spaces are available to active Circle members.</p>
          </div>
        </div>
      </section>
    );
  }

  if (state === "error") {
    return (
      <section className="dashboard-shell">
        <div className="container">
          <div className="portal-card">
            <span className="card-label">PeaceWorks Circle</span>
            <h1>Your Circle could not be loaded.</h1>
            <p>Please try again later.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="dashboard-shell">
      <div className="container">
        <div className="dashboard-hero compact-dashboard-hero">
          <div>
            <div className="eyebrow">PeaceWorks Circle</div>
            <h1 className="dashboard-title">Your Circle Journey</h1>
            <p className="dashboard-sub">
              Your Circle is the home for courses, practices, notes,
              assessments, resources, and next steps as you continue growing
              as a person of peace.
            </p>
          </div>
        </div>

        <div className="dashboard-wide-grid">
          <article className="portal-card dashboard-wide-card">
            <div>
              <span className="card-label">Course</span>
              <h3>Circle Journey</h3>
              <p>
                Your core PeaceWorks pathway with monthly rhythms, teaching,
                reflection prompts, practices, and implementation steps.
              </p>
            </div>
          </article>

          <article className="portal-card dashboard-wide-card">
            <div>
              <span className="card-label">Growth</span>
              <h3>Assessments & Graphs</h3>
              <p>
                View your Peace Index patterns, Peace Assessment history,
                progress over time, and visual maps of your growth.
              </p>
            </div>
          </article>

          <article className="portal-card dashboard-wide-card">
            <div>
              <span className="card-label">Reflection</span>
              <h3>Notes & Practices</h3>
              <p>
                Track reflections, practices, commitments, and next steps from
                your Circle conversations.
              </p>
            </div>
          </article>

          <article className="portal-card dashboard-wide-card">
            <div>
              <span className="card-label">Resources</span>
              <h3>Circle Resources</h3>
              <p>
                Access tools, worksheets, conversation prompts, and practical
                resources for making peace under pressure.
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
