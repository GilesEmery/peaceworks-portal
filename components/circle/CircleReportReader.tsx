"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { dashboardLoginHref, routes } from "../../lib/navigation";
import { supabase } from "../../lib/supabase";

type ReaderState =
  | { status: "loading" }
  | { status: "denied" }
  | { status: "missing" }
  | { status: "error" }
  | { status: "ready"; html: string };

export default function CircleReportReader() {
  const router = useRouter();
  const [state, setState] = useState<ReaderState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;

      if (!session?.access_token) {
        router.replace(dashboardLoginHref("/circle/reports/november-2026"));
        return;
      }

      try {
        const response = await fetch("/api/circle/reports/november-2026", {
          cache: "no-store",
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (cancelled) return;
        if (response.status === 401 || response.status === 403) {
          setState({ status: "denied" });
        } else if (response.status === 404) {
          setState({ status: "missing" });
        } else if (!response.ok) {
          setState({ status: "error" });
        } else {
          const html = await response.text();
          if (!cancelled) setState({ status: "ready", html });
        }
      } catch {
        if (!cancelled) setState({ status: "error" });
      }
    };

    void load();
    return () => { cancelled = true; };
  }, [router]);

  return (
    <section className="circle-report-shell">
      <header className="circle-report-intro">
        <div>
          <span className="eyebrow">Founders Circle • Private resource</span>
          <h1>The Restoration Report</h1>
          <p>November 2026 · The Sign of Peace · Five-page interactive booklet</p>
        </div>
        <Link className="btn btn-secondary" href={routes.circle}>
          ← Back to your Circle
        </Link>
      </header>
      {state.status === "loading" && <p role="status">Checking Circle membership and loading your booklet…</p>}
      {state.status === "denied" && (
        <div className="circle-report-status" role="alert">
          <h2>Circle membership required</h2>
          <p>This resource is reserved for active Founders Circle members and PeaceWorks administrators.</p>
          <Link className="btn btn-primary" href={routes.circle}>Go to your Circle</Link>
        </div>
      )}
      {state.status === "missing" && (
        <div className="circle-report-status" role="status">
          <h2>Publication being prepared</h2>
          <p>The November edition has not been added to the private Circle library yet.</p>
        </div>
      )}
      {state.status === "error" && (
        <div className="circle-report-status" role="alert">
          <h2>Could not load the report</h2>
          <p>Please reload this page, or contact the PeaceWorks team if the problem continues.</p>
        </div>
      )}
      {state.status === "ready" && (
        <iframe
          className="circle-report-frame"
          title="The Restoration Report — November 2026 interactive flipbook"
          srcDoc={state.html}
          sandbox="allow-scripts allow-downloads allow-popups"
          referrerPolicy="no-referrer"
        />
      )}
      <p className="circle-report-private-note">
        This Circle publication is shared for members’ personal learning. Please do not forward it
        outside the Circle without permission.
      </p>
      <style jsx>{`
        .circle-report-shell { width: min(1420px, 100%); padding: 38px 20px 46px; margin: 0 auto; }
        .circle-report-intro { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 20px; align-items: end; margin-bottom: 24px; }
        h1 { font-family: Georgia, serif; color: #153f35; font-size: clamp(2.1rem, 4vw, 3.7rem); margin: 8px 0; }
        .circle-report-intro p { color: #60746c; margin: 4px 0; }
        .circle-report-frame { width: 100%; height: min(1000px, 83vh); min-height: 620px; display: block; border: 1px solid #cbdbd1; border-radius: 16px; background: #102b25; }
        .circle-report-status { min-height: 330px; border: 1px solid #ccd6ce; border-radius: 14px; padding: 40px; background: #faf8f3; }
        .circle-report-status h2 { font-size: 1.5rem; color: #153f35; }
        .circle-report-private-note { color: #66716b; font-size: 0.85rem; margin-top: 16px; }
        @media(max-width: 700px) { .circle-report-frame { height: 74vh; min-height: 490px; } .circle-report-shell { padding: 25px 10px; } }
      `}</style>
    </section>
  );
}
