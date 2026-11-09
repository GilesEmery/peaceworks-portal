"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default function CircleReportPublisher() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function publish() {
    if (!file) return;
    setBusy(true);
    setStatus("Uploading to the private Circle library…");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setStatus("Please sign in with a PeaceWorks administrator account.");
        return;
      }
      const form = new FormData();
      form.set("report", file);
      const response = await fetch("/api/admin/circle-reports", {
        method: "POST",
        body: form,
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const result = await response.json();
      setStatus(result.message || "Upload failed.");
    } catch {
      setStatus("Could not upload the flipbook. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="container" style={{ maxWidth: 840, paddingTop: 55, paddingBottom: 70 }}>
      <p className="eyebrow">Circle library · Administrator</p>
      <h1>Publish the Restoration Report</h1>
      <p>Upload the complete self-contained HTML flipbook. It will be stored in the private PeaceWorks Circle reports bucket—not the public website or GitHub source. Only verified active Founders Circle members and administrators can read it.</p>
      <div style={{ border: "1px solid #c8d8d0", borderRadius: 16, padding: 30, marginTop: 25, marginBottom: 15 }}>
        <label htmlFor="report-upload">November 2026 flipbook (.html)</label>
        <input id="report-upload" type="file" accept=".html,text/html" style={{ display: "block", marginTop: 14, marginBottom: 20 }} onChange={e => setFile(e.target.files?.[0] || null)} />
        <button className="btn btn-primary" disabled={!file || busy} type="button" onClick={() => void publish()}>{busy ? "Publishing…" : "Publish to Circle"}</button>
        <p role="status" aria-live="polite" style={{ paddingTop: 12 }}>{status}</p>
      </div>
      <Link href="/circle/reports/november-2026">Open the members-only report →</Link>
    </section>
  );
}
