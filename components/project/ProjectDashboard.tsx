"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { CalendarDays, CheckSquare, FolderKanban, MessageSquare } from "lucide-react";

import { supabase } from "../../lib/supabase";

type LoadState = "loading" | "ready" | "denied" | "error";

export default function ProjectDashboard() {
  const [state, setState] = useState<LoadState>("loading");

  useEffect(() => {
    async function verifyAccess() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setState("denied");
        return;
      }

      const response = await fetch("/api/project/me", {
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        setState("ready");
        return;
      }

      setState(response.status === 403 || response.status === 401 ? "denied" : "error");
    }

    void verifyAccess();
  }, []);

  if (state === "loading") {
    return (
      <section className="project-dashboard-shell">
        <div className="container">
          <div className="portal-card project-dashboard-card">Loading Project Dashboard...</div>
        </div>
      </section>
    );
  }

  if (state === "denied") {
    return (
      <section className="project-dashboard-shell">
        <div className="container">
          <div className="portal-card project-dashboard-card">
            <span className="card-label">Project Dashboard</span>
            <h1>Project access is not available for this account.</h1>
            <p>
              Project workspaces are available to active PeaceWorks Project Managers.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (state === "error") {
    return (
      <section className="project-dashboard-shell">
        <div className="container">
          <div className="portal-card project-dashboard-card">
            <span className="card-label">Project Dashboard</span>
            <h1>Project Dashboard could not be loaded.</h1>
            <p>Please try again later.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="project-dashboard-shell">
      <div className="container project-dashboard-stack">
        <div className="project-dashboard-hero">
          <div>
            <span className="card-label">Project Dashboard</span>
            <h1>Project Dashboard</h1>
            <p>
              Plan initiatives, coordinate responsibilities, and follow meaningful
              work across PeaceWorks.
            </p>
          </div>
        </div>

        <div className="project-dashboard-grid">
          <ProjectTile
            icon={<FolderKanban size={22} />}
            title="Active Projects"
            text="No active projects are currently assigned to you."
          />
          <ProjectTile
            icon={<CalendarDays size={22} />}
            title="Upcoming Milestones"
            text="No upcoming milestones are scheduled."
          />
          <ProjectTile
            icon={<CheckSquare size={22} />}
            title="My Tasks"
            text="No tasks are currently waiting for your attention."
          />
          <ProjectTile
            icon={<MessageSquare size={22} />}
            title="Team Updates"
            text="No project updates are currently available."
          />
        </div>
      </div>
    </section>
  );
}

function ProjectTile({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <article className="project-dashboard-tile">
      <div className="project-dashboard-icon" aria-hidden="true">
        {icon}
      </div>
      <h2>{title}</h2>
      <p>{text}</p>
    </article>
  );
}
