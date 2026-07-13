"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import ResultModal from "../assessment/ResultModal";
import { supabase } from "../../lib/supabase";
import type { PeaceAssessmentResult } from "../../lib/peaceAssessmentScoring";
import type {
  AdminActivityItem,
  AdminAnalyticsPayload,
  AdminAssessmentRecord,
  AdminDistributionItem,
} from "../../lib/admin/assessmentAnalytics";

type FilterType =
  | "profileType"
  | "peaceAnchor"
  | "pressureResponse"
  | "processingStyle"
  | "activity";

type ActiveFilter = {
  type: FilterType;
  label: string;
  value: string;
};

type LoadState = "loading" | "ready" | "denied" | "error";

export default function AdminDashboard() {
  const router = useRouter();
  const [state, setState] = useState<LoadState>("loading");
  const [analytics, setAnalytics] = useState<AdminAnalyticsPayload | null>(null);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter | null>(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<"date" | "name" | "profile">("date");
  const [modalResult, setModalResult] = useState<PeaceAssessmentResult | null>(
    null
  );

  useEffect(() => {
    async function loadAdminData() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        router.replace("/dashboard");
        return;
      }

      const response = await fetch("/api/admin/analytics", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.status === 401) {
        router.replace("/auth");
        return;
      }

      if (response.status === 403) {
        setState("denied");
        return;
      }

      if (!response.ok) {
        setState("error");
        return;
      }

      const payload = (await response.json()) as AdminAnalyticsPayload;
      setAnalytics(payload);
      setState("ready");
    }

    loadAdminData();
  }, [router]);

  const filteredRecords = useMemo(() => {
    if (!analytics) return [];

    const normalizedSearch = search.trim().toLowerCase();

    return analytics.records
      .filter((record) => matchesFilter(record, activeFilter))
      .filter((record) => {
        if (!normalizedSearch) return true;

        return [
          record.userName,
          record.email,
          record.profileType,
          record.profileTitle,
          record.peaceAnchor,
          record.pressureResponse,
          record.processingStyle,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);
      })
      .sort((a, b) => sortRecords(a, b, sortKey));
  }, [activeFilter, analytics, search, sortKey]);

  async function openResult(record: AdminAssessmentRecord) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      router.replace("/auth");
      return;
    }

    const response = await fetch(
      `/api/admin/assessments/${record.assessmentId}`,
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );

    if (!response.ok) return;

    const payload = (await response.json()) as {
      ok: true;
      result: PeaceAssessmentResult;
    };

    setModalResult(payload.result);
  }

  if (state === "loading") {
    return (
      <section className="admin-shell">
        <div className="container">
          <div className="admin-loading portal-card">Loading admin dashboard...</div>
        </div>
      </section>
    );
  }

  if (state === "denied") {
    return (
      <section className="admin-shell">
        <div className="container">
          <div className="admin-state portal-card">
            <span className="card-label">Access denied</span>
            <h1>Admin access is not available for this account.</h1>
            <p>
              This dashboard is limited to approved PeaceWorks administrators.
            </p>
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => router.push("/dashboard")}
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (state === "error" || !analytics) {
    return (
      <section className="admin-shell">
        <div className="container">
          <div className="admin-state portal-card">
            <span className="card-label">Unavailable</span>
            <h1>Admin data could not be loaded.</h1>
            <p>Please try again later or check the server configuration.</p>
          </div>
        </div>
      </section>
    );
  }

  const hasCompletedAssessments = analytics.overview.completedAssessments > 0;

  return (
    <>
      <section className="admin-shell">
        <div className="container">
          <div className="admin-hero">
            <div>
              <div className="eyebrow">PeaceWorks Admin</div>
              <h1>PeaceWorks Admin</h1>
              <p>
                A clear view of assessment participation, profile patterns, and
                the people represented in the results.
              </p>
            </div>

            <label className="admin-selector">
              <span>Assessment</span>
              <select value={analytics.assessment.key} onChange={() => null}>
                <option value="peace-assessment">Peace Assessment</option>
              </select>
            </label>
          </div>

          <div className="admin-overview-grid">
            <OverviewCard
              label="Registered Users"
              value={analytics.overview.totalRegisteredUsers}
            />
            <OverviewCard
              label="Users Started Assessment"
              value={analytics.overview.usersWithCompletedAssessment}
            />
            <OverviewCard
              label="Completed Assessments"
              value={analytics.overview.completedAssessments}
            />
            <OverviewCard
              label="Users Without Completed Assessment"
              value={analytics.overview.usersWithoutCompletedAssessment}
            />
            <OverviewCard
              label="Most Common Type"
              value={analytics.overview.mostCommonProfileType || "No data"}
              wide
            />
            <OverviewCard
              label="Most Recent Completion"
              value={formatDate(analytics.overview.mostRecentCompletion)}
              wide
            />
          </div>

          {analytics.notes.map((note) => (
            <p className="admin-note" key={note}>
              {note}
            </p>
          ))}

          {!hasCompletedAssessments ? (
            <div className="admin-state portal-card">
              <span className="card-label">No results yet</span>
              <h2>No completed Peace Assessments are available.</h2>
              <p>
                Once participants complete the assessment, charts and drill-downs
                will appear here.
              </p>
            </div>
          ) : (
            <div className="admin-chart-grid">
              <DistributionChart
                title="Profile-Type Distribution"
                description="Completed Peace Assessments across the 12 principal profile types."
                items={analytics.distributions.profileTypes}
                filterType="profileType"
                onSelect={setActiveFilter}
              />
              <DistributionChart
                title="Peace-Anchor Distribution"
                description="Primary peace anchors represented in completed results."
                items={analytics.distributions.peaceAnchors}
                filterType="peaceAnchor"
                onSelect={setActiveFilter}
              />
              <DistributionChart
                title="Pressure-Response Distribution"
                description="How pressure responses are distributed across results."
                items={analytics.distributions.pressureResponses}
                filterType="pressureResponse"
                onSelect={setActiveFilter}
              />
              <DistributionChart
                title="Processing-Style Distribution"
                description="Internal and external processing patterns in completed results."
                items={analytics.distributions.processingStyles}
                filterType="processingStyle"
                onSelect={setActiveFilter}
              />
              <ActivityChart
                items={analytics.activity}
                onSelect={setActiveFilter}
              />
            </div>
          )}

          <section className="admin-drilldown portal-card" aria-live="polite">
            <div className="admin-drilldown-head">
              <div>
                <span className="card-label">Drill-Down</span>
                <h2>
                  {activeFilter
                    ? `${activeFilter.label}: ${activeFilter.value}`
                    : "All Completed Results"}
                </h2>
                <p>
                  {filteredRecords.length} participant
                  {filteredRecords.length === 1 ? "" : "s"} represented.
                </p>
              </div>

              {activeFilter && (
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => setActiveFilter(null)}
                >
                  Clear Filter
                </button>
              )}
            </div>

            <div className="admin-table-tools">
              <label>
                <span>Search users</span>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Name, email, or profile"
                />
              </label>

              <label>
                <span>Sort by</span>
                <select
                  value={sortKey}
                  onChange={(event) =>
                    setSortKey(event.target.value as typeof sortKey)
                  }
                >
                  <option value="date">Completion date</option>
                  <option value="name">User name</option>
                  <option value="profile">Profile type</option>
                </select>
              </label>
            </div>

            {filteredRecords.length === 0 ? (
              <div className="admin-empty">
                No users match this chart segment or search.
              </div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Profile</th>
                      <th>Anchor</th>
                      <th>Response</th>
                      <th>Processing</th>
                      <th>Completed</th>
                      <th>Status</th>
                      <th>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((record) => (
                      <tr key={record.assessmentId}>
                        <td>
                          <strong>{record.userName}</strong>
                          <span>{record.email}</span>
                        </td>
                        <td>
                          <strong>{record.profileType}</strong>
                          <span>{record.profileTitle}</span>
                        </td>
                        <td>{record.peaceAnchor}</td>
                        <td>{record.pressureResponse}</td>
                        <td>{record.processingStyle}</td>
                        <td>{formatDate(record.completionDate)}</td>
                        <td>{record.resultStatus}</td>
                        <td>
                          <button
                            className="admin-link-button"
                            type="button"
                            onClick={() => openResult(record)}
                          >
                            View Result
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </section>

      {modalResult && (
        <ResultModal
          result={modalResult}
          onClose={() => setModalResult(null)}
          onGoToDashboard={() => setModalResult(null)}
        />
      )}
    </>
  );
}

function OverviewCard({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: number | string;
  wide?: boolean;
}) {
  return (
    <article className={`admin-overview-card${wide ? " wide" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function DistributionChart({
  title,
  description,
  items,
  filterType,
  onSelect,
}: {
  title: string;
  description: string;
  items: AdminDistributionItem[];
  filterType: FilterType;
  onSelect: (filter: ActiveFilter) => void;
}) {
  const max = Math.max(...items.map((item) => item.count), 1);

  return (
    <section className="admin-chart-card">
      <div className="admin-chart-heading">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>

      <div className="admin-bars" role="list" aria-label={title}>
        {items.map((item) => (
          <button
            className="admin-bar-row"
            key={item.key}
            type="button"
            onClick={() =>
              onSelect({
                type: filterType,
                label: title,
                value: item.label,
              })
            }
          >
            <span className="admin-bar-label">{item.label}</span>
            <span className="admin-bar-track" aria-hidden="true">
              <span
                className="admin-bar-fill"
                style={{ width: `${(item.count / max) * 100}%` }}
              />
            </span>
            <span className="admin-bar-value">
              {item.count} · {item.percentage}%
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function ActivityChart({
  items,
  onSelect,
}: {
  items: AdminActivityItem[];
  onSelect: (filter: ActiveFilter) => void;
}) {
  const max = Math.max(...items.map((item) => item.count), 1);

  return (
    <section className="admin-chart-card">
      <div className="admin-chart-heading">
        <h2>Assessment Activity Over Time</h2>
        <p>Monthly completion counts based on available completion dates.</p>
      </div>

      {items.length === 0 ? (
        <div className="admin-empty">No dated completions are available yet.</div>
      ) : (
        <div className="admin-activity-bars" aria-label="Assessment activity">
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              className="admin-activity-bar"
              onClick={() =>
                onSelect({
                  type: "activity",
                  label: "Completion Period",
                  value: item.key,
                })
              }
            >
              <span
                aria-hidden="true"
                style={{ height: `${Math.max((item.count / max) * 100, 8)}%` }}
              />
              <strong>{item.count}</strong>
              <small>{item.label}</small>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function matchesFilter(
  record: AdminAssessmentRecord,
  filter: ActiveFilter | null
) {
  if (!filter) return true;

  if (filter.type === "activity") {
    return record.completionDate?.startsWith(filter.value) || false;
  }

  return record[filter.type] === filter.value;
}

function sortRecords(
  a: AdminAssessmentRecord,
  b: AdminAssessmentRecord,
  sortKey: "date" | "name" | "profile"
) {
  if (sortKey === "name") return a.userName.localeCompare(b.userName);
  if (sortKey === "profile") return a.profileType.localeCompare(b.profileType);

  return (
    new Date(b.completionDate || 0).getTime() -
    new Date(a.completionDate || 0).getTime()
  );
}

function formatDate(value: string | null) {
  if (!value) return "No date";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
