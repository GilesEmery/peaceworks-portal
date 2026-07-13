"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode, RefObject } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  ClipboardCheck,
  Compass,
  FileText,
  Mail,
  Search,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

import ResultModal from "../assessment/ResultModal";
import AdminUsersManager from "./AdminUsersManager";
import { supabase } from "../../lib/supabase";
import type { PeaceAssessmentResult } from "../../lib/peaceAssessmentScoring";
import type {
  AdminAnalyticsPayload,
  AdminAssessmentRecord,
} from "../../lib/admin/assessmentAnalytics";
import type {
  AdminManagedProfile,
  AdminUsersPayload,
} from "../../lib/admin/userManagement";
import {
  getMissingProfileCompletionFields,
  isProfileComplete,
} from "../../lib/profileCompletion";

type LoadState = "loading" | "ready" | "denied" | "error";

type SectionId =
  | "overview"
  | "people"
  | "assessments"
  | "circles"
  | "coaching"
  | "content"
  | "communications"
  | "diagnostics"
  | "settings";

type AdminSection = {
  id: SectionId;
  title: string;
  description: string;
};

const sections: AdminSection[] = [
  {
    id: "overview",
    title: "Overview",
    description: "Operating signals across people, access, and assessments.",
  },
  {
    id: "people",
    title: "People & Access",
    description: "Manage roles, Circle memberships, and coach assignments.",
  },
  {
    id: "assessments",
    title: "Assessments",
    description: "Review completion patterns and profile distributions.",
  },
  {
    id: "circles",
    title: "Circles",
    description: "Inspect Circle health and membership coverage.",
  },
  {
    id: "coaching",
    title: "Coaching",
    description: "Review coach capacity and active assignments.",
  },
  {
    id: "content",
    title: "Content Studio",
    description: "Prepare future monthly content workflows.",
  },
  {
    id: "communications",
    title: "Communications",
    description: "Prepare future email and audience workflows.",
  },
  {
    id: "diagnostics",
    title: "Diagnostics",
    description: "Find relationship, role, and profile data issues.",
  },
  {
    id: "settings",
    title: "Platform Settings",
    description: "Review safe configuration status.",
  },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [state, setState] = useState<LoadState>("loading");
  const [analytics, setAnalytics] = useState<AdminAnalyticsPayload | null>(null);
  const [usersPayload, setUsersPayload] = useState<AdminUsersPayload | null>(null);
  const [openSection, setOpenSection] = useState<SectionId>("overview");
  const [adminSearch, setAdminSearch] = useState("");
  const [showFloatingSearch, setShowFloatingSearch] = useState(false);
  const [modalResult, setModalResult] = useState<PeaceAssessmentResult | null>(
    null
  );
  const searchToolbarRef = useRef<HTMLElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const featureGridRef = useRef<HTMLElement | null>(null);
  const workspaceRef = useRef<HTMLElement | null>(null);
  const workspaceHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const lastOpenedSectionRef = useRef<SectionId>("overview");
  const shouldScrollWorkspaceRef = useRef(false);
  const shouldScrollDashboardRef = useRef(false);

  useEffect(() => {
    async function loadAdminData() {
      const token = await getAccessToken();

      if (!token) {
        router.replace("/dashboard");
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [analyticsResponse, usersResponse] = await Promise.all([
        fetch("/api/admin/analytics", { headers }),
        fetch("/api/admin/users", { headers }),
      ]);

      if (analyticsResponse.status === 401 || usersResponse.status === 401) {
        router.replace("/auth");
        return;
      }

      if (analyticsResponse.status === 403 || usersResponse.status === 403) {
        setState("denied");
        return;
      }

      if (!analyticsResponse.ok || !usersResponse.ok) {
        setState("error");
        return;
      }

      setAnalytics((await analyticsResponse.json()) as AdminAnalyticsPayload);
      setUsersPayload((await usersResponse.json()) as AdminUsersPayload);
      setState("ready");
    }

    loadAdminData();
  }, [router]);

  useEffect(() => {
    function openHashSection() {
      const hash = window.location.hash.replace("#", "") as SectionId;

      if (!sections.some((section) => section.id === hash)) return;

      shouldScrollWorkspaceRef.current = true;
      setOpenSection(hash);
    }

    openHashSection();
    window.addEventListener("hashchange", openHashSection);

    return () => window.removeEventListener("hashchange", openHashSection);
  }, []);

  useEffect(() => {
    if (state !== "ready") return;

    function handleScroll() {
      const toolbar = searchToolbarRef.current;
      const toolbarBottom = toolbar
        ? toolbar.getBoundingClientRect().bottom + window.scrollY
        : 0;
      const threshold = Math.max(300, toolbarBottom);
      const shouldShow = window.scrollY >= threshold;

      setShowFloatingSearch((current) =>
        current === shouldShow ? current : shouldShow
      );
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, [state]);

  useEffect(() => {
    if (!shouldScrollWorkspaceRef.current) return;

    shouldScrollWorkspaceRef.current = false;

    requestAnimationFrame(() => {
      workspaceRef.current?.scrollIntoView({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        block: "start",
      });
      workspaceHeadingRef.current?.focus({ preventScroll: true });
    });
  }, [openSection]);

  useEffect(() => {
    if (!shouldScrollDashboardRef.current) return;

    shouldScrollDashboardRef.current = false;

    requestAnimationFrame(() => {
      featureGridRef.current?.scrollIntoView({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        block: "start",
      });
      document
        .querySelector<HTMLButtonElement>(
          `[data-admin-tile="${lastOpenedSectionRef.current}"]`
        )
        ?.focus({ preventScroll: true });
    });
  }, [openSection]);

  const operations = useMemo(() => {
    if (!analytics || !usersPayload) return null;

    return buildOperations(analytics, usersPayload);
  }, [analytics, usersPayload]);

  async function openResult(record: AdminAssessmentRecord) {
    const token = await getAccessToken();

    if (!token) {
      router.replace("/auth");
      return;
    }

    const response = await fetch(
      `/api/admin/assessments/${record.assessmentId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
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

  function goToSection(sectionId: SectionId) {
    lastOpenedSectionRef.current = sectionId;
    shouldScrollWorkspaceRef.current = true;
    setOpenSection(sectionId);
    window.history.replaceState(null, "", `#${sectionId}`);
  }

  function openUser(userId: string) {
    router.push(`/admin/people/${userId}`);
  }

  function openCircle() {
    goToSection("circles");
  }

  function returnToDashboard() {
    shouldScrollDashboardRef.current = true;
    window.history.replaceState(null, "", window.location.pathname);
    setOpenSection("overview");
  }

  function returnToSearch() {
    searchToolbarRef.current?.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "start",
    });

    requestAnimationFrame(() => searchInputRef.current?.focus());
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
      <AdminState
        label="Access denied"
        title="Admin access is not available for this account."
        message="This dashboard is limited to approved PeaceWorks administrators."
        onAction={() => router.push("/dashboard")}
      />
    );
  }

  if (state === "error" || !analytics || !usersPayload || !operations) {
    return (
      <AdminState
        label="Unavailable"
        title="Admin data could not be loaded."
        message="Please try again later or check the server configuration."
        onAction={() => window.location.reload()}
      />
    );
  }

  return (
    <>
      <section className="admin-shell unified-admin-shell">
        <div className="container">
          <div className="admin-hero unified-admin-hero">
            <div>
              <div className="eyebrow">PeaceWorks Administration</div>
              <h1>PeaceWorks Administration</h1>
              <p>
                See the health of the network, find what needs attention, and
                manage every part of the PeaceWorks system.
              </p>
            </div>
          </div>

          <div>
            <AdminCommandSearch
              inputRef={searchInputRef}
              search={adminSearch}
              toolbarRef={searchToolbarRef}
              onSearch={setAdminSearch}
              onJump={goToSection}
              onOpenUser={openUser}
              onOpenCircle={openCircle}
              operations={operations}
              usersPayload={usersPayload}
            />
          </div>
          <VisualDiagnosticsDashboard operations={operations} />

          <NeedsAttention alerts={operations.alerts} onJump={goToSection} />

          <AdminFeatureGrid
            activeSection={openSection}
            analytics={analytics}
            gridRef={featureGridRef}
            operations={operations}
            usersPayload={usersPayload}
            onOpen={goToSection}
          />

          <AdminExpandedWorkspace
            activeSection={openSection}
            analytics={analytics}
            adminSearch={adminSearch}
            focusedUserId=""
            operations={operations}
            usersPayload={usersPayload}
            onClose={returnToDashboard}
            onJump={goToSection}
            onOpenUser={openUser}
            onOpenResult={openResult}
            onUsersPayloadChange={setUsersPayload}
            workspaceRef={workspaceRef}
            workspaceHeadingRef={workspaceHeadingRef}
          />
        </div>
      </section>

      <AdminStickySearch
        isVisible={showFloatingSearch}
        onReturnToSearch={returnToSearch}
      />

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

function AdminCommandSearch({
  inputRef,
  search,
  toolbarRef,
  onSearch,
  onJump,
  onOpenUser,
  onOpenCircle,
  operations,
  usersPayload,
}: {
  inputRef: RefObject<HTMLInputElement | null>;
  search: string;
  toolbarRef: RefObject<HTMLElement | null>;
  onSearch: (value: string) => void;
  onJump: (sectionId: SectionId) => void;
  onOpenUser: (userId: string) => void;
  onOpenCircle: (circleId: string) => void;
  operations: AdminOperations;
  usersPayload: AdminUsersPayload;
}) {
  const results = buildSearchResults(search, usersPayload, operations);

  return (
    <section
      className="admin-command-search portal-card"
      aria-label="Admin search"
      ref={toolbarRef}
    >
      <div className="admin-command-grid">
        <label className="admin-command-input">
          <span>Admin search</span>
          <input
            ref={inputRef}
            type="search"
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search people, Circles, assessments, or content..."
          />
        </label>

        <AdminJumpSelect label="Jump to Section" onJump={onJump} />

        <label>
          <span>Quick Action</span>
          <select
            defaultValue=""
            onChange={(event) => {
              if (event.target.value) onJump(event.target.value as SectionId);
              event.target.value = "";
            }}
          >
            <option value="" disabled>
              Choose action
            </option>
            <option value="people">Manage access</option>
            <option value="diagnostics">Review alerts</option>
            <option value="assessments">View results</option>
            <option value="settings">Check settings</option>
          </select>
        </label>
      </div>

      <SearchResultGroups
        results={results}
        onJump={onJump}
        onOpenUser={onOpenUser}
        onOpenCircle={onOpenCircle}
      />
    </section>
  );
}

function AdminStickySearch({
  isVisible,
  onReturnToSearch,
}: {
  isVisible: boolean;
  onReturnToSearch: () => void;
}) {
  if (!isVisible) return null;

  return (
    <div className="admin-sticky-search">
      <button
        aria-label="Return to admin search"
        className="admin-sticky-search-button"
        type="button"
        onClick={onReturnToSearch}
      >
        <span aria-hidden="true">
          <Search size={18} strokeWidth={2} />
        </span>
      </button>
    </div>
  );
}

function AdminJumpSelect({
  label,
  onJump,
}: {
  label: string;
  onJump: (sectionId: SectionId) => void;
}) {
  return (
    <label>
      <span>{label}</span>
      <select
        defaultValue=""
        onChange={(event) => {
          if (event.target.value) onJump(event.target.value as SectionId);
          event.target.value = "";
        }}
      >
        <option value="" disabled>
          Choose section
        </option>
        {sections.map((section) => (
          <option key={section.id} value={section.id}>
            {section.title}
          </option>
        ))}
      </select>
    </label>
  );
}

function SearchResultGroups({
  results,
  onJump,
  onOpenUser,
  onOpenCircle,
}: {
  results: AdminSearchResults;
  onJump: (sectionId: SectionId) => void;
  onOpenUser: (userId: string) => void;
  onOpenCircle: (circleId: string) => void;
}) {
  const hasResults =
    results.people.length > 0 ||
    results.circles.length > 0 ||
    results.sections.length > 0;

  if (!results.query) return null;

  return (
    <div className="admin-search-results" aria-live="polite">
      {!hasResults ? (
        <div className="admin-empty">No matching admin records.</div>
      ) : (
        <>
          <SearchGroup title="People">
            {results.people.map((person) => (
              <button key={person.id} type="button" onClick={() => onOpenUser(person.id)}>
                <strong>{formatManagedUserName(person)}</strong>
                <span>{[person.email, person.organization, person.jobTitle].filter(Boolean).join(" · ")}</span>
              </button>
            ))}
          </SearchGroup>
          <SearchGroup title="Circles">
            {results.circles.map((circle) => (
              <button key={circle.id} type="button" onClick={() => onOpenCircle(circle.id)}>
                <strong>{circle.name}</strong>
                <span>{circle.detail}</span>
              </button>
            ))}
          </SearchGroup>
          <SearchGroup title="Sections">
            {results.sections.map((section) => (
              <button key={section.id} type="button" onClick={() => onJump(section.id)}>
                <strong>{section.title}</strong>
                <span>{section.description}</span>
              </button>
            ))}
          </SearchGroup>
        </>
      )}
    </div>
  );
}

function SearchGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h3>{title}</h3>
      <div>{children}</div>
    </section>
  );
}

function VisualDiagnosticsDashboard({ operations }: { operations: AdminOperations }) {
  return (
    <section className="admin-visual-dashboard" aria-label="Operational diagnostics">
      <div className="admin-visual-dashboard-head">
        <div>
          <span className="card-label">Operational Health</span>
          <h2>Network signals at a glance</h2>
        </div>
        <p>
          Circular indicators use live denominators. Totals without meaningful
          denominators are shown as stat tiles.
        </p>
      </div>

      <div className="admin-ring-grid">
        <RatioCard title="Circle Participation" ratio={operations.ratios.circleParticipation} />
        <RatioCard title="Coaching Coverage" ratio={operations.ratios.coachCoverage} />
        <RatioCard title="Profile Completion" ratio={operations.ratios.profileCompletion} />
        {operations.ratios.assessmentReach && (
          <RatioCard title="Assessment Reach" ratio={operations.ratios.assessmentReach} />
        )}
        <RatioCard
          title="Active Circle Coverage"
          ratio={operations.ratios.activeCircleCoverage}
        />
      </div>

      <div className="admin-stat-tile-grid">
        <DashboardStatTile label="Total Active Profiles" value={operations.metrics.activeUsers} />
        <DashboardStatTile label="Completed Assessments" value={operations.metrics.completedAssessments} />
        <DashboardStatTile label="Active Coaches" value={operations.metrics.activeCoaches} />
        <DashboardStatTile label="Active Circles" value={operations.metrics.activeCircles} />
        <DashboardStatTile label="Direct Individual Assignments" value={operations.metrics.activeCoachAssignments} />
      </div>
    </section>
  );
}

function DashboardStatTile({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <article className="admin-stat-tile">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function DashboardTileIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="admin-feature-mark" aria-hidden="true">
      <Icon size={25} strokeWidth={1.8} />
    </span>
  );
}

function AdminFeatureGrid({
  activeSection,
  analytics,
  gridRef,
  operations,
  usersPayload,
  onOpen,
}: {
  activeSection: SectionId;
  analytics: AdminAnalyticsPayload;
  gridRef: RefObject<HTMLElement | null>;
  operations: AdminOperations;
  usersPayload: AdminUsersPayload;
  onOpen: (sectionId: SectionId) => void;
}) {
  const tiles = buildFeatureTiles({ analytics, operations, usersPayload });

  return (
    <section
      className="admin-feature-grid-wrap"
      aria-label="Admin workspaces"
      ref={gridRef}
    >
      <div className="admin-feature-grid-head">
        <div>
          <span className="card-label">Management Workspaces</span>
          <h2>Open a section</h2>
        </div>
        <p>Tiles open into the full workspace below while keeping this dashboard available.</p>
      </div>

      <div className="admin-feature-grid">
        {tiles.map((tile) => (
          <button
            aria-expanded={activeSection === tile.id}
            className={`admin-feature-tile${activeSection === tile.id ? " active" : ""}`}
            data-admin-tile={tile.id}
            key={tile.id}
            type="button"
            onClick={() => onOpen(tile.id)}
          >
            <DashboardTileIcon icon={tile.icon} />
            <span>
              <strong>{tile.title}</strong>
              <small>{tile.description}</small>
            </span>
            <span className="admin-feature-metrics">
              {tile.metrics.map((metric) => (
                <em key={metric}>{metric}</em>
              ))}
            </span>
            <i>Open section</i>
          </button>
        ))}
      </div>
    </section>
  );
}

function AdminExpandedWorkspace({
  activeSection,
  analytics,
  adminSearch,
  focusedUserId,
  operations,
  usersPayload,
  onClose,
  onJump,
  onOpenUser,
  onOpenResult,
  onUsersPayloadChange,
  workspaceRef,
  workspaceHeadingRef,
}: {
  activeSection: SectionId;
  analytics: AdminAnalyticsPayload;
  adminSearch: string;
  focusedUserId: string;
  operations: AdminOperations;
  usersPayload: AdminUsersPayload;
  onClose: () => void;
  onJump: (sectionId: SectionId) => void;
  onOpenUser: (userId: string) => void;
  onOpenResult: (record: AdminAssessmentRecord) => void;
  onUsersPayloadChange: (payload: AdminUsersPayload) => void;
  workspaceRef: RefObject<HTMLElement | null>;
  workspaceHeadingRef: RefObject<HTMLHeadingElement | null>;
}) {
  const section = sections.find((item) => item.id === activeSection) || sections[0];

  return (
    <section
      className="admin-workspace portal-card"
      id={activeSection}
      ref={workspaceRef}
      tabIndex={-1}
    >
      <DashboardSectionHeader
        title={section.title}
        description={section.description}
        onClose={onClose}
        headingRef={workspaceHeadingRef}
      />

      {activeSection === "overview" && <AdminOverview operations={operations} />}
      {activeSection === "people" && (
        <PeopleManagementSection
          usersPayload={usersPayload}
          diagnostics={operations.diagnostics}
          focusedUserId={focusedUserId}
          onOpenUser={onOpenUser}
          onUsersPayloadChange={onUsersPayloadChange}
        />
      )}
      {activeSection === "assessments" && (
        <AssessmentsSection
          analytics={analytics}
          search={adminSearch}
          onOpenUser={onOpenUser}
          onOpenResult={onOpenResult}
        />
      )}
      {activeSection === "circles" && (
        <CirclesSection operations={operations} usersPayload={usersPayload} />
      )}
      {activeSection === "coaching" && (
        <CoachingSection
          operations={operations}
          onOpenUser={onOpenUser}
          usersPayload={usersPayload}
        />
      )}
      {activeSection === "content" && (
        <DashboardEmptyState
          title="Content Studio is ready for the next system layer."
          description="Create monthly questions, articles, videos, and resources when the content backend is connected."
        />
      )}
      {activeSection === "communications" && (
        <DashboardEmptyState
          title="Communications is ready for future delivery workflows."
          description="Prepare dashboard content for future email delivery without showing fake integration records."
        />
      )}
      {activeSection === "diagnostics" && (
        <DiagnosticsSection
          operations={operations}
          onJump={onJump}
          onOpenUser={onOpenUser}
        />
      )}
      {activeSection === "settings" && <PlatformSettingsSection />}
    </section>
  );
}

function DashboardSectionHeader({
  title,
  description,
  onClose,
  headingRef,
}: {
  title: string;
  description: string;
  onClose: () => void;
  headingRef: RefObject<HTMLHeadingElement | null>;
}) {
  return (
    <div className="admin-workspace-head">
      <div>
        <span className="card-label">Expanded Workspace</span>
        <h2 ref={headingRef} tabIndex={-1}>
          {title}
        </h2>
        <p>{description}</p>
      </div>
      <button className="btn btn-secondary" type="button" onClick={onClose}>
        Back to Dashboard
      </button>
    </div>
  );
}

function DashboardEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="admin-placeholder">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function NeedsAttention({
  alerts,
  onJump,
}: {
  alerts: AdminAlert[];
  onJump: (sectionId: SectionId) => void;
}) {
  return (
    <section className="admin-attention portal-card" aria-label="Needs attention">
      <div>
        <span className="card-label">Needs Attention</span>
        <h2>{alerts.length ? "Operational alerts" : "Everything looks steady"}</h2>
        <p>
          {alerts.length
            ? "These checks are based on live role and relationship data."
            : "No role, Circle, coaching, or profile diagnostics currently need attention."}
        </p>
      </div>

      {alerts.length > 0 && (
        <div className="admin-alert-list">
          {alerts.slice(0, 6).map((alert) => (
            <button
              key={alert.key}
              type="button"
              onClick={() => onJump(alert.section)}
            >
              <strong>{alert.count}</strong>
              <span>{alert.label}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function AdminOverview({ operations }: { operations: AdminOperations }) {
  return (
    <>
      <div className="admin-overview-grid">
        <OverviewCard label="Total Profiles" value={operations.metrics.totalProfiles} />
        <OverviewCard label="Active Users" value={operations.metrics.activeUsers} />
        <OverviewCard label="Deactivated Users" value={operations.metrics.deactivatedUsers} />
        <OverviewCard label="Archived Users" value={operations.metrics.archivedUsers} />
        <OverviewCard label="Members" value={operations.metrics.members} />
        <OverviewCard label="Circle Members" value={operations.metrics.circleMembers} />
        <OverviewCard label="Active Coaches" value={operations.metrics.activeCoaches} />
        <OverviewCard label="Active Circles" value={operations.metrics.activeCircles} />
        <OverviewCard
          label="Circles with Coaching Coverage"
          value={operations.metrics.circlesWithCoachingCoverage}
        />
        <OverviewCard
          label="Total Circle Coaches"
          value={operations.metrics.totalCircleCoaches}
        />
        <OverviewCard
          label="Shared Circle Members"
          value={operations.metrics.sharedCircleMembers}
        />
        <OverviewCard
          label="Completed Assessments"
          value={operations.metrics.completedAssessments}
        />
        <OverviewCard
          label="Direct Individual Assignments"
          value={operations.metrics.activeCoachAssignments}
          wide
        />
      </div>

      <div className="admin-ratio-grid">
        <RatioCard title="Circle Participation" ratio={operations.ratios.circleParticipation} />
        <RatioCard title="Coach Coverage" ratio={operations.ratios.coachCoverage} />
        <RatioCard title="Profile Completion" ratio={operations.ratios.profileCompletion} />
        {operations.ratios.assessmentReach && (
          <RatioCard title="Assessment Reach" ratio={operations.ratios.assessmentReach} />
        )}
      </div>

      <div className="admin-mini-chart-grid">
        <MiniBars
          title="Role Distribution"
          items={operations.roleDistribution}
        />
        <MiniBars
          title="Members per Circle"
          items={operations.membersPerCircle}
        />
        <MiniBars title="Coach Caseload by Circle" items={operations.circleCaseload} />
        <MiniBars
          title="User Growth"
          items={operations.userGrowth}
        />
      </div>
    </>
  );
}

function PeopleManagementSection({
  usersPayload,
  diagnostics,
  focusedUserId,
  onOpenUser,
  onUsersPayloadChange,
}: {
  usersPayload: AdminUsersPayload;
  diagnostics: AdminDiagnostics;
  focusedUserId: string;
  onOpenUser: (userId: string) => void;
  onUsersPayloadChange: (payload: AdminUsersPayload) => void;
}) {
  const effectiveFocusedUserId = focusedUserId;

  return (
    <div className="admin-section-stack">
      <MiniBars
        title="Role Distribution"
        items={buildRoleDistribution(
          usersPayload.users.filter((user) => user.accountStatus === "active")
        )}
      />
      <DiagnosticsList
        title="People diagnostics"
        items={[
          ["Incomplete profiles", diagnostics.incompleteProfiles],
          ["Users missing member role", diagnostics.missingMemberRole],
          ["Circle members without active Circle", diagnostics.circleRoleNoMembership],
          ["Circle members without coaching coverage", diagnostics.membersWithoutCoachingCoverage],
        ]}
        onSelectSubject={(subject) => {
          if ("firstName" in subject) onOpenUser(subject.id);
        }}
      />
      <div id="people-user-editor">
        <AdminUsersManager
          key={effectiveFocusedUserId || "people-manager"}
          embedded
          initialPayload={usersPayload}
          focusedUserId={effectiveFocusedUserId}
          onPayloadChange={onUsersPayloadChange}
        />
      </div>
    </div>
  );
}

function AssessmentsSection({
  analytics,
  search,
  onOpenUser,
  onOpenResult,
}: {
  analytics: AdminAnalyticsPayload;
  search: string;
  onOpenUser: (userId: string) => void;
  onOpenResult: (record: AdminAssessmentRecord) => void;
}) {
  const normalizedSearch = search.trim().toLowerCase();
  const records = analytics.records.filter((record) => {
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
  });

  return (
    <div className="admin-section-stack">
      <div className="admin-mini-chart-grid">
        <MiniBars
          title="Profile Results"
          items={analytics.distributions.profileTypes.map((item) => ({
            label: item.label,
            value: item.count,
          }))}
        />
        <MiniBars
          title="Assessment Activity"
          items={analytics.activity.map((item) => ({
            label: item.label,
            value: item.count,
          }))}
        />
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Profile</th>
              <th>Anchor</th>
              <th>Completed</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {records.slice(0, 80).map((record) => (
              <tr key={record.assessmentId}>
                <td>
                  <button
                    className="admin-inline-person-button"
                    type="button"
                    onClick={() => onOpenUser(record.userId)}
                  >
                    {record.userName}
                  </button>
                  <span>{record.email}</span>
                </td>
                <td>
                  <strong>{record.profileType}</strong>
                  <span>{record.profileTitle}</span>
                </td>
                <td>{record.peaceAnchor}</td>
                <td>{formatDate(record.completionDate)}</td>
                <td>
                  <button
                    className="admin-link-button"
                    type="button"
                    onClick={() => onOpenResult(record)}
                  >
                    View Result
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CirclesSection({
  operations,
  usersPayload,
}: {
  operations: AdminOperations;
  usersPayload: AdminUsersPayload;
}) {
  return (
    <div className="admin-section-stack">
      <MiniBars title="Members per Circle" items={operations.membersPerCircle} />
      <div className="admin-card-grid">
        {operations.circles.map((circle) => (
          <article className="admin-small-card" key={circle.id}>
            <span>{circle.status || "No status"}</span>
            <strong>{circle.name}</strong>
            <p>
              {circle.memberCount} active member
              {circle.memberCount === 1 ? "" : "s"} · {circle.coaches.length} inferred
              coach{circle.coaches.length === 1 ? "" : "es"}
            </p>
          </article>
        ))}
      </div>
      <CircleManagementPanel payload={usersPayload} />
      <DiagnosticsList
        title="Circle diagnostics"
        items={[
          ["Circle members without active Circle", operations.diagnostics.circleRoleNoMembership],
          ["Active memberships missing circle_member role", operations.diagnostics.membershipNoCircleRole],
          ["Circles without active coach", operations.diagnostics.circlesWithoutActiveCoach],
          ["No active Circles", operations.diagnostics.noActiveCircles],
        ]}
      />
    </div>
  );
}

function CircleManagementPanel({ payload }: { payload: AdminUsersPayload }) {
  const [circles, setCircles] = useState(payload.circles);
  const [selectedCircleId, setSelectedCircleId] = useState(
    payload.circles[0]?.id || ""
  );
  const selectedCircle =
    circles.find((circle) => circle.id === selectedCircleId) ||
    circles[0] ||
    null;
  const [memberIds, setMemberIds] = useState<string[]>(
    selectedCircle?.memberIds || []
  );
  const [saveState, setSaveState] = useState<"idle" | "saving" | "success" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");
  const inferredCoachProfiles = payload.users.filter(
    (user) =>
      memberIds.includes(user.id) &&
      user.roles.includes("coach") &&
      user.coachIds.length > 0
  );

  function selectCircle(circleId: string) {
    const nextCircle = circles.find((circle) => circle.id === circleId);

    setSelectedCircleId(circleId);
    setMemberIds(nextCircle?.memberIds || []);
    setSaveState("idle");
    setMessage("");
  }

  function toggleSelection(
    values: string[],
    value: string,
    setter: (nextValues: string[]) => void
  ) {
    setter(
      values.includes(value)
        ? values.filter((item) => item !== value)
        : [...values, value]
    );
    setSaveState("idle");
    setMessage("");
  }

  async function saveCircle() {
    if (!selectedCircle) return;

    setSaveState("saving");
    setMessage("");

    const token = await getAccessToken();

    if (!token) {
      setSaveState("error");
      setMessage("Admin session is no longer available.");
      return;
    }

    const response = await fetch(`/api/admin/circles/${selectedCircle.id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        memberIds,
      }),
    });

    const result = (await response.json().catch(() => null)) as {
      ok?: boolean;
      message?: string;
    } | null;

    if (!response.ok || !result?.ok) {
      setSaveState("error");
      setMessage(result?.message || "Circle roster could not be updated.");
      return;
    }

    setCircles((current) =>
      current.map((circle) =>
        circle.id === selectedCircle.id
          ? {
              ...circle,
              memberIds,
              coachIds: inferCircleCoachIds(memberIds, payload.users),
            }
          : circle
      )
    );
    setSaveState("success");
    setMessage(result.message || "Circle roster was updated.");
  }

  function resetCircle() {
    setMemberIds(selectedCircle?.memberIds || []);
    setSaveState("idle");
    setMessage("");
  }

  return (
    <section className="admin-circle-manager">
      <div className="admin-circle-manager-head">
        <div>
          <span className="card-label">Circle Management</span>
          <h3>Manage Circle members</h3>
          <p>
            Coaching coverage is inferred from active Circle members who have
            the coach role and an active coach assignment.
          </p>
        </div>

        <label>
          <span>Circle</span>
          <select
            value={selectedCircle?.id || ""}
            onChange={(event) => selectCircle(event.target.value)}
          >
            {circles.map((circle) => (
              <option key={circle.id} value={circle.id}>
                {circle.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!selectedCircle ? (
        <div className="admin-empty">No Circles are available.</div>
      ) : (
        <>
          {message && <div className={`admin-message ${saveState}`}>{message}</div>}

          <div className="admin-circle-roster-grid">
            <section className="admin-checkbox-section">
              <div>
                <h3>Circle Members</h3>
                <p>
                  Members belong to this specific Circle. This does not
                  automatically change role access.
                </p>
              </div>

              <div className="admin-checkbox-list">
                {payload.users.map((user) => (
                  <CircleCheckboxRow
                    key={user.id}
                    label={formatManagedUserName(user)}
                    description={formatCircleUserDescription(user)}
                    checked={memberIds.includes(user.id)}
                    onChange={() =>
                      toggleSelection(memberIds, user.id, setMemberIds)
                    }
                  />
                ))}
              </div>
            </section>

            <section className="admin-checkbox-section">
              <div>
                <h3>Inferred Coach Coverage</h3>
                <p>
                  These coach-role Circle members have an active coach
                  assignment. Self-assignment counts as valid coverage.
                </p>
              </div>

              <div className="admin-checkbox-list">
                {inferredCoachProfiles.length === 0 ? (
                  <div className="admin-empty">No inferred coach coverage.</div>
                ) : (
                  inferredCoachProfiles.map((coach) => (
                    <div
                      className="admin-checkbox-row readonly"
                      key={coach.id}
                    >
                      <span aria-hidden="true" />
                      <span>
                        <strong>{formatManagedUserName(coach)}</strong>
                        <small>{formatCircleUserDescription(coach)}</small>
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          <div className="admin-user-actions">
            <button
              className="btn btn-secondary"
              type="button"
              onClick={resetCircle}
              disabled={saveState === "saving"}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              type="button"
              onClick={saveCircle}
              disabled={saveState === "saving"}
            >
              {saveState === "saving" ? "Saving..." : "Save Circle"}
            </button>
          </div>
        </>
      )}
    </section>
  );
}

function CircleCheckboxRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="admin-checkbox-row">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span>
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
    </label>
  );
}

function CoachingSection({
  operations,
  onOpenUser,
  usersPayload,
}: {
  operations: AdminOperations;
  onOpenUser: (userId: string) => void;
  usersPayload: AdminUsersPayload;
}) {
  const [expandedCircleId, setExpandedCircleId] = useState(
    operations.circles[0]?.id || ""
  );

  return (
    <div className="admin-section-stack">
      <MiniBars title="Coach Caseload by Circle" items={operations.circleCaseload} />

      <div className="admin-coaching-circle-grid">
        {operations.circles.map((circle) => (
          <article className="admin-coaching-circle-card" key={circle.id}>
            <div>
              <span>{circle.status || "No status"}</span>
              <h3>{circle.name}</h3>
              <p>
                {formatCoachTeamLabel(circle.coaches)} · {circle.memberCount} member
                {circle.memberCount === 1 ? "" : "s"}
              </p>
            </div>

            {circle.coaches.length > 0 && (
              <div className="admin-coach-link-list" aria-label={`${circle.name} coaches`}>
                {circle.coaches.map((coach) => (
                  <button
                    key={coach.id}
                    type="button"
                    onClick={() => onOpenUser(coach.id)}
                  >
                    {coach.name}
                  </button>
                ))}
              </div>
            )}

            <button
              className="admin-link-button"
              type="button"
              onClick={() =>
                setExpandedCircleId(
                  expandedCircleId === circle.id ? "" : circle.id
                )
              }
            >
              {expandedCircleId === circle.id
                ? "Hide Shared Caseload"
                : "View Shared Caseload"}
            </button>

            {expandedCircleId === circle.id && (
              <SharedCaseload
                circle={circle}
                users={usersPayload.users}
                onSelectUser={onOpenUser}
              />
            )}
          </article>
        ))}
      </div>

      <DiagnosticsList
        title="Coaching diagnostics"
        items={[
          ["Members with individual coach assignments", operations.diagnostics.membersWithIndividualCoaching],
          ["Members covered through a Circle coach", operations.diagnostics.membersCoveredThroughCircleCoach],
          ["Members without either coaching coverage", operations.diagnostics.membersWithoutCoachingCoverage],
          ["Circles without active coach", operations.diagnostics.circlesWithoutActiveCoach],
          ["Coach self-assigned without active Circle", operations.diagnostics.selfAssignedCoachesWithoutCircle],
        ]}
      />

    </div>
  );
}

function SharedCaseload({
  circle,
  users,
  onSelectUser,
}: {
  circle: AdminOperations["circles"][number];
  users: AdminManagedProfile[];
  onSelectUser: (userId: string) => void;
}) {
  return (
    <div className="admin-shared-caseload">
      <div className="admin-shared-caseload-head">
        <strong>Shared Circle Caseload</strong>
        <span>{circle.members.length} active member{circle.members.length === 1 ? "" : "s"}</span>
      </div>

      {circle.members.length === 0 ? (
        <div className="admin-empty">No active members in this Circle.</div>
      ) : (
        <div className="admin-shared-member-list">
          {circle.members.map((member) => (
            <button
              key={member.id}
              type="button"
              onClick={() => onSelectUser(member.id)}
            >
              <strong>
                {member.name}
                {member.isCircleCoach ? " · Circle coach" : ""}
              </strong>
              <span>{member.email || "No email available"}</span>
              <small>
                {member.roles.map(formatRoleName).join(", ") || "No roles"} · Active
              </small>
              <small>
                Direct Individual Assignments:{" "}
                {formatDirectCoachNames(member.coachIds, users)}
              </small>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DiagnosticsSection({
  operations,
  onJump,
  onOpenUser,
}: {
  operations: AdminOperations;
  onJump: (sectionId: SectionId) => void;
  onOpenUser: (userId: string) => void;
}) {
  return (
    <div className="admin-section-stack">
      <DiagnosticsList
        title="Operational diagnostics"
        items={[
          ["Profiles without member role", operations.diagnostics.missingMemberRole],
          ["circle_member role without active Circle", operations.diagnostics.circleRoleNoMembership],
          ["Active Circle membership without circle_member role", operations.diagnostics.membershipNoCircleRole],
          ["Incomplete profiles", operations.diagnostics.incompleteProfiles],
          ["Self-assigned coaches without active Circle", operations.diagnostics.selfAssignedCoachesWithoutCircle],
          ["Circle members without coaching coverage", operations.diagnostics.membersWithoutCoachingCoverage],
          ["Circles without active coach", operations.diagnostics.circlesWithoutActiveCoach],
        ]}
        onSelectSubject={(subject) => {
          if ("firstName" in subject) onOpenUser(subject.id);
        }}
      />
      <div className="admin-alert-list">
        {operations.alerts.map((alert) => (
          <button key={alert.key} type="button" onClick={() => onJump(alert.section)}>
            <strong>{alert.count}</strong>
            <span>{alert.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function PlatformSettingsSection() {
  return (
    <div className="admin-card-grid">
      <article className="admin-small-card">
        <span>Supabase Admin Client</span>
        <strong>Configured server-side</strong>
        <p>Secret values are intentionally hidden.</p>
      </article>
      <article className="admin-small-card">
        <span>Admin Gate</span>
        <strong>Email allowlist</strong>
        <p>Temporary authorization remains backed by environment configuration.</p>
      </article>
      <article className="admin-small-card">
        <span>Email Provider</span>
        <strong>Not configured here</strong>
        <p>No email delivery integration is connected in this portal code yet.</p>
      </article>
    </div>
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

function RatioCard({ title, ratio }: { title: string; ratio: AdminRatio }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const percent = ratio.denominator
    ? Math.round((ratio.numerator / ratio.denominator) * 100)
    : 0;
  const dash = (percent / 100) * circumference;

  return (
    <article className="admin-ratio-card">
      <svg viewBox="0 0 100 100" role="img" aria-label={`${title}: ${percent}%`}>
        <circle cx="50" cy="50" r={radius} />
        <circle
          cx="50"
          cy="50"
          r={radius}
          strokeDasharray={`${dash} ${circumference - dash}`}
        />
      </svg>
      <div>
        <strong>{percent}%</strong>
        <span>{title}</span>
        <small>
          {ratio.numerator} of {ratio.denominator}
        </small>
      </div>
    </article>
  );
}

function MiniBars({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; value: number }>;
}) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <section className="admin-chart-card">
      <div className="admin-chart-heading">
        <h2>{title}</h2>
      </div>
      <div className="admin-bars">
        {items.length === 0 ? (
          <div className="admin-empty">No data available.</div>
        ) : (
          items.map((item) => (
            <div className="admin-bar-row readonly" key={item.label}>
              <span className="admin-bar-label">{item.label}</span>
              <span className="admin-bar-track" aria-hidden="true">
                <span
                  className="admin-bar-fill"
                  style={{ width: `${(item.value / max) * 100}%` }}
                />
              </span>
              <span className="admin-bar-value">{item.value}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function DiagnosticsList({
  title,
  items,
  onSelectSubject,
}: {
  title: string;
  items: Array<[string, AdminDiagnosticSubject[]]>;
  onSelectSubject?: (subject: AdminDiagnosticSubject) => void;
}) {
  return (
    <section className="admin-diagnostics-list">
      <h3>{title}</h3>
      <div>
        {items.map(([label, profiles]) => (
          <details key={label}>
            <summary>
              <span>{label}</span>
              <strong>{profiles.length}</strong>
            </summary>
            {profiles.length === 0 ? (
              <p>No matching profiles.</p>
            ) : (
              <ul>
                {profiles.slice(0, 30).map((subject) => (
                  <li key={subject.id}>
                    {onSelectSubject && "firstName" in subject ? (
                      <button
                        className="admin-diagnostic-subject-button"
                        type="button"
                        onClick={() => onSelectSubject(subject)}
                      >
                        {formatDiagnosticSubject(subject)}
                      </button>
                    ) : (
                      formatDiagnosticSubject(subject)
                    )}
                  </li>
                ))}
              </ul>
            )}
          </details>
        ))}
      </div>
    </section>
  );
}

function AdminState({
  label,
  title,
  message,
  onAction,
}: {
  label: string;
  title: string;
  message: string;
  onAction: () => void;
}) {
  return (
    <section className="admin-shell">
      <div className="container">
        <div className="admin-state portal-card">
          <span className="card-label">{label}</span>
          <h1>{title}</h1>
          <p>{message}</p>
          <button className="btn btn-primary" type="button" onClick={onAction}>
            Return to Dashboard
          </button>
        </div>
      </div>
    </section>
  );
}

type AdminRatio = {
  numerator: number;
  denominator: number;
};

type AdminAlert = {
  key: string;
  label: string;
  count: number;
  section: SectionId;
};

type AdminSearchResults = {
  query: string;
  people: AdminManagedProfile[];
  circles: Array<{ id: string; name: string; detail: string }>;
  sections: AdminSection[];
};

type AdminFeatureTile = {
  id: Exclude<SectionId, "overview">;
  icon: LucideIcon;
  title: string;
  description: string;
  metrics: string[];
};

type AdminCircleDiagnostic = {
  id: string;
  name: string;
  detail: string;
};

type AdminDiagnosticSubject = AdminManagedProfile | AdminCircleDiagnostic;

type AdminDiagnostics = {
  incompleteProfiles: AdminManagedProfile[];
  missingMemberRole: AdminManagedProfile[];
  circleRoleNoMembership: AdminManagedProfile[];
  membershipNoCircleRole: AdminManagedProfile[];
  membersWithIndividualCoaching: AdminManagedProfile[];
  membersCoveredThroughCircleCoach: AdminManagedProfile[];
  membersWithoutCoachingCoverage: AdminManagedProfile[];
  circlesWithoutActiveCoach: AdminCircleDiagnostic[];
  selfAssignedCoachesWithoutCircle: AdminManagedProfile[];
  noActiveCircles: AdminCircleDiagnostic[];
};

type AdminCircleMember = {
  id: string;
  name: string;
  email: string;
  roles: string[];
  coachIds: string[];
  isCircleCoach: boolean;
};

type AdminCircleCoach = {
  id: string;
  name: string;
};

type AdminOperations = {
  metrics: {
    totalProfiles: number;
    activeUsers: number;
    deactivatedUsers: number;
    archivedUsers: number;
    members: number;
    circleMembers: number;
    activeCoaches: number;
    activeCircles: number;
    completedAssessments: number;
    circlesWithCoachingCoverage: number;
    totalCircleCoaches: number;
    sharedCircleMembers: number;
    activeCoachAssignments: number;
  };
  ratios: {
    circleParticipation: AdminRatio;
    coachCoverage: AdminRatio;
    profileCompletion: AdminRatio;
    assessmentReach: AdminRatio | null;
    activeCircleCoverage: AdminRatio;
  };
  roleDistribution: Array<{ label: string; value: number }>;
  membersPerCircle: Array<{ label: string; value: number }>;
  circleCaseload: Array<{ label: string; value: number }>;
  userGrowth: Array<{ label: string; value: number }>;
  circles: Array<{
    id: string;
    name: string;
    status: string;
    memberCount: number;
    coaches: AdminCircleCoach[];
    members: AdminCircleMember[];
  }>;
  diagnostics: AdminDiagnostics;
  alerts: AdminAlert[];
  peopleAlertCount: number;
  circleAlertCount: number;
  coachingAlertCount: number;
};

function buildOperations(
  analytics: AdminAnalyticsPayload,
  payload: AdminUsersPayload
): AdminOperations {
  const users = payload.users;
  const activeUsers = users.filter((user) => user.accountStatus === "active");
  const deactivatedUsers = users.filter(
    (user) => user.accountStatus === "deactivated"
  );
  const archivedUsers = users.filter((user) => user.accountStatus === "archived");
  const members = activeUsers.filter((user) => user.roles.includes("member"));
  const circleMembers = activeUsers.filter((user) =>
    user.roles.includes("circle_member")
  );
  const coaches = activeUsers.filter((user) => user.roles.includes("coach"));
  const activeCircles = payload.circles.filter(
    (circle) => circle.status === "active"
  );
  const activeCoachIds = new Set(coaches.map((coach) => coach.id));
  const activeCoachAssignments = activeUsers.reduce(
    (total, user) =>
      total + user.coachIds.filter((coachId) => activeCoachIds.has(coachId)).length,
    0
  );
  const activeCircleDetails = activeCircles.map((circle) =>
    buildCircleOperation(circle, activeUsers)
  );
  const assessedUserIds = new Set(analytics.records.map((record) => record.userId));
  const completedProfiles = activeUsers.filter(isProfileComplete);
  const diagnostics = buildDiagnostics(activeUsers, activeCircles, coaches);
  const alerts = buildAlerts(diagnostics);
  const coveredCircleMembers = circleMembers.filter((user) =>
    hasCoachingCoverage(user, activeCircles, activeCoachIds)
  );
  const circlesWithCoachingCoverage = activeCircleDetails.filter(
    (circle) => circle.coaches.length > 0
  ).length;
  const totalCircleCoaches = activeCircleDetails.reduce(
    (total, circle) => total + circle.coaches.length,
    0
  );
  const sharedCircleMembers = activeCircleDetails.reduce(
    (total, circle) => total + circle.memberCount,
    0
  );

  return {
    metrics: {
      totalProfiles: users.length,
      activeUsers: activeUsers.length,
      deactivatedUsers: deactivatedUsers.length,
      archivedUsers: archivedUsers.length,
      members: members.length,
      circleMembers: circleMembers.length,
      activeCoaches: coaches.length,
      activeCircles: activeCircles.length,
      completedAssessments: analytics.overview.completedAssessments,
      circlesWithCoachingCoverage,
      totalCircleCoaches,
      sharedCircleMembers,
      activeCoachAssignments,
    },
    ratios: {
      circleParticipation: {
        numerator: circleMembers.length,
        denominator: members.length,
      },
      coachCoverage: {
        numerator: coveredCircleMembers.length,
        denominator: circleMembers.length,
      },
      profileCompletion: {
        numerator: completedProfiles.length,
        denominator: activeUsers.length,
      },
      assessmentReach: members.length
        ? {
            numerator: members.filter((user) => assessedUserIds.has(user.id)).length,
            denominator: members.length,
          }
        : null,
      activeCircleCoverage: {
        numerator: circlesWithCoachingCoverage,
        denominator: activeCircles.length,
      },
    },
    roleDistribution: buildRoleDistribution(activeUsers),
    membersPerCircle: payload.circles.map((circle) => ({
      label: circle.name,
      value: activeUsers.filter((user) => user.circleIds.includes(circle.id)).length,
    })),
    circleCaseload: activeCircleDetails.map((circle) => ({
      label: `${circle.name} - ${formatCoachNames(circle.coaches)}`,
      value: circle.memberCount,
    })),
    userGrowth: buildUserGrowth(activeUsers),
    circles: activeCircleDetails,
    diagnostics,
    alerts,
    peopleAlertCount:
      diagnostics.incompleteProfiles.length +
      diagnostics.missingMemberRole.length,
    circleAlertCount:
      diagnostics.circleRoleNoMembership.length +
      diagnostics.membershipNoCircleRole.length +
      diagnostics.circlesWithoutActiveCoach.length +
      diagnostics.noActiveCircles.length,
    coachingAlertCount:
      diagnostics.membersWithoutCoachingCoverage.length +
      diagnostics.selfAssignedCoachesWithoutCircle.length,
  };
}

function buildFeatureTiles({
  analytics,
  operations,
  usersPayload,
}: {
  analytics: AdminAnalyticsPayload;
  operations: AdminOperations;
  usersPayload: AdminUsersPayload;
}): AdminFeatureTile[] {
  return [
    {
      id: "people",
      icon: Users,
      title: "People & Access",
      description: "Manage profiles, roles, Circle placement, and coaching relationships.",
      metrics: [
        `${operations.metrics.activeUsers} active profiles`,
        `${operations.metrics.activeCoaches} coaches`,
      ],
    },
    {
      id: "assessments",
      icon: ClipboardCheck,
      title: "Assessments",
      description: "Review completion, results, trends, and profile distributions.",
      metrics: [
        `${analytics.overview.completedAssessments} completed`,
        `${analytics.overview.usersWithCompletedAssessment} users assessed`,
      ],
    },
    {
      id: "circles",
      icon: Users,
      title: "Circles",
      description: "Manage Circles, membership, participation, and coaching coverage.",
      metrics: [
        `${operations.metrics.activeCircles} active Circles`,
        `${operations.metrics.circleMembers} participants`,
      ],
    },
    {
      id: "coaching",
      icon: Compass,
      title: "Coaching",
      description: "See coaching teams, shared Circle caseloads, and direct assignments.",
      metrics: [
        `${operations.metrics.totalCircleCoaches} Circle coaches`,
        `${operations.metrics.sharedCircleMembers} shared members`,
      ],
    },
    {
      id: "content",
      icon: FileText,
      title: "Content Studio",
      description: "Create monthly questions, articles, videos, and resources.",
      metrics: ["Setup ready", "No content backend"],
    },
    {
      id: "communications",
      icon: Mail,
      title: "Communications",
      description: "Prepare dashboard content for future email delivery.",
      metrics: ["No email integration", "Design-ready"],
    },
    {
      id: "diagnostics",
      icon: Activity,
      title: "Diagnostics",
      description: "Review data alignment, incomplete records, and operational health.",
      metrics: [`${operations.alerts.length} alerts`, `${operations.metrics.activeUsers} active users`],
    },
    {
      id: "settings",
      icon: Settings,
      title: "Platform Settings",
      description: "Manage integrations, storage, permissions, and platform configuration.",
      metrics: [`${usersPayload.roleOptions.length} roles`, "Secrets hidden"],
    },
  ];
}

function buildSearchResults(
  search: string,
  usersPayload: AdminUsersPayload,
  operations: AdminOperations
): AdminSearchResults {
  const query = search.trim().toLowerCase();

  if (!query) {
    return {
      query: "",
      people: [],
      circles: [],
      sections: [],
    };
  }

  return {
    query,
    people: usersPayload.users
      .filter((user) =>
        [
          user.firstName,
          user.lastName,
          user.email,
          user.organization,
          user.jobTitle,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query)
      )
      .slice(0, 8),
    circles: operations.circles
      .filter((circle) => circle.name.toLowerCase().includes(query))
      .map((circle) => ({
        id: circle.id,
        name: circle.name,
        detail: `${circle.memberCount} members · ${formatCoachNames(circle.coaches)}`,
      }))
      .slice(0, 6),
    sections: sections
      .filter((section) =>
        [section.title, section.description].join(" ").toLowerCase().includes(query)
      )
      .slice(0, 6),
  };
}

function buildDiagnostics(
  users: AdminManagedProfile[],
  activeCircles: AdminUsersPayload["circles"],
  coaches: AdminManagedProfile[]
): AdminDiagnostics {
  const activeCircleIds = new Set(activeCircles.map((circle) => circle.id));
  const activeCoachIds = new Set(coaches.map((coach) => coach.id));
  const usersWithActiveCircle = users.filter((user) =>
    user.circleIds.some((circleId) => activeCircleIds.has(circleId))
  );
  const circleMembers = users.filter((user) =>
    user.roles.includes("circle_member")
  );

  return {
    incompleteProfiles: users.filter((user) => !isProfileComplete(user)),
    missingMemberRole: users.filter((user) => !user.roles.includes("member")),
    circleRoleNoMembership: users.filter(
      (user) =>
        user.roles.includes("circle_member") &&
        !user.circleIds.some((circleId) => activeCircleIds.has(circleId))
    ),
    membershipNoCircleRole: usersWithActiveCircle.filter(
      (user) => !user.roles.includes("circle_member")
    ),
    membersWithIndividualCoaching: circleMembers.filter(
      (user) => user.coachIds.length > 0
    ),
    membersCoveredThroughCircleCoach: circleMembers.filter((user) =>
      hasCircleCoachCoverage(user, activeCircles, activeCoachIds)
    ),
    membersWithoutCoachingCoverage: circleMembers.filter(
      (user) => !hasCoachingCoverage(user, activeCircles, activeCoachIds)
    ),
    circlesWithoutActiveCoach: activeCircles
      .filter(
        (circle) => !circle.coachIds.some((coachId) => activeCoachIds.has(coachId))
      )
      .map((circle) => ({
        id: circle.id,
        name: circle.name,
        detail: circle.status || "No status",
      })),
    selfAssignedCoachesWithoutCircle: coaches.filter(
      (coach) =>
        coach.coachIds.includes(coach.id) &&
        !coach.circleIds.some((circleId) => activeCircleIds.has(circleId))
    ),
    noActiveCircles:
      activeCircles.length === 0
        ? [
            {
              id: "no-active-circles",
              name: "No active Circles",
              detail: "Create or reactivate a Circle to place active members.",
            },
          ]
        : [],
  };
}

function buildCircleOperation(
  circle: AdminUsersPayload["circles"][number],
  users: AdminManagedProfile[]
): AdminOperations["circles"][number] {
  const uniqueMemberIds = Array.from(new Set(circle.memberIds));
  const uniqueCoachIds = Array.from(new Set(circle.coachIds));
  const members = uniqueMemberIds
    .map((memberId) => users.find((user) => user.id === memberId))
    .filter(isManagedProfile)
    .map((user) => ({
      id: user.id,
      name: formatManagedUserName(user),
      email: user.email,
      roles: user.roles,
      coachIds: user.coachIds,
      isCircleCoach: uniqueCoachIds.includes(user.id),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const coaches = uniqueCoachIds
    .map((coachId) => users.find((user) => user.id === coachId))
    .filter(isManagedProfile)
    .map((coach) => ({
      id: coach.id,
      name: formatManagedUserName(coach),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    id: circle.id,
    name: circle.name,
    status: circle.status,
    memberCount: members.length,
    coaches,
    members,
  };
}

function buildAlerts(diagnostics: AdminDiagnostics): AdminAlert[] {
  const alerts: AdminAlert[] = [
    {
      key: "members-without-coaching-coverage",
      label: "Circle members without coaching coverage",
      count: diagnostics.membersWithoutCoachingCoverage.length,
      section: "coaching",
    },
    {
      key: "circles-without-active-coach",
      label: "Circles without an active coach",
      count: diagnostics.circlesWithoutActiveCoach.length,
      section: "circles",
    },
    {
      key: "coaches-without-assignments",
      label: "Self-assigned coaches without active Circle",
      count: diagnostics.selfAssignedCoachesWithoutCircle.length,
      section: "coaching",
    },
    {
      key: "incomplete-profiles",
      label: "Users with incomplete profiles",
      count: diagnostics.incompleteProfiles.length,
      section: "people",
    },
    {
      key: "missing-member-role",
      label: "Users missing member role",
      count: diagnostics.missingMemberRole.length,
      section: "people",
    },
    {
      key: "circle-role-no-membership",
      label: "Circle members without an active Circle",
      count: diagnostics.circleRoleNoMembership.length,
      section: "circles",
    },
    {
      key: "membership-no-circle-role",
      label: "Active Circle memberships missing circle_member role",
      count: diagnostics.membershipNoCircleRole.length,
      section: "circles",
    },
    {
      key: "no-active-circles",
      label: "No active Circles",
      count: diagnostics.noActiveCircles.length ? 1 : 0,
      section: "circles",
    },
  ];

  return alerts.filter((alert) => alert.count > 0);
}

function buildRoleDistribution(users: AdminManagedProfile[]) {
  const roles = ["member", "circle_member", "coach", "admin"] as const;

  return roles.map((role) => ({
    label: formatRoleName(role),
    value: users.filter((user) => user.roles.includes(role)).length,
  }));
}

function buildUserGrowth(users: AdminManagedProfile[]) {
  const counts = new Map<string, number>();

  users.forEach((user) => {
    if (!user.createdAt) return;
    const date = new Date(user.createdAt);
    const key = `${date.getUTCFullYear()}-${String(
      date.getUTCMonth() + 1
    ).padStart(2, "0")}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  return Array.from(counts.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([key, value]) => ({
      label: formatMonth(key),
      value,
    }));
}

function hasCoachingCoverage(
  user: AdminManagedProfile,
  activeCircles: AdminUsersPayload["circles"],
  activeCoachIds: Set<string>
) {
  return (
    user.coachIds.some((coachId) => activeCoachIds.has(coachId)) ||
    hasCircleCoachCoverage(user, activeCircles, activeCoachIds)
  );
}

function hasCircleCoachCoverage(
  user: AdminManagedProfile,
  activeCircles: AdminUsersPayload["circles"],
  activeCoachIds: Set<string>
) {
  return user.circleIds.some((circleId) => {
    const circle = activeCircles.find((item) => item.id === circleId);

    return Boolean(
      circle && circle.coachIds.some((coachId) => activeCoachIds.has(coachId))
    );
  });
}

function inferCircleCoachIds(
  memberIds: string[],
  users: AdminManagedProfile[]
) {
  return users
    .filter(
      (user) =>
        memberIds.includes(user.id) &&
        user.roles.includes("coach") &&
        user.coachIds.length > 0
    )
    .map((user) => user.id);
}

async function getAccessToken() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.access_token || "";
}

function formatRoleName(role: string) {
  return role
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatManagedUserName(user: AdminManagedProfile) {
  const name = [user.firstName, user.lastName]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");

  return name || user.email || "Unnamed profile";
}

function formatCircleUserDescription(user: AdminManagedProfile) {
  return [
    user.email,
    user.organization,
    user.roles.map(formatRoleName).join(", "),
  ]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" · ");
}

function formatCoachTeamLabel(coaches: AdminCircleCoach[]) {
  const names = formatCoachNames(coaches);

  return `${coaches.length === 1 ? "Coach" : "Coaches"}: ${names}`;
}

function formatCoachNames(coaches: AdminCircleCoach[]) {
  if (coaches.length === 0) return "No coach";

  return coaches.map((coach) => coach.name).join(" + ");
}

function formatDirectCoachNames(
  coachIds: string[],
  users: AdminManagedProfile[]
) {
  if (coachIds.length === 0) return "None";

  return coachIds
    .map((coachId) => users.find((user) => user.id === coachId))
    .filter(isManagedProfile)
    .map(formatManagedUserName)
    .sort((a, b) => a.localeCompare(b))
    .join(" + ");
}

function formatDiagnosticSubject(subject: AdminDiagnosticSubject) {
  if ("firstName" in subject) {
    const missingFields = getMissingProfileCompletionFields(subject);

    return `${formatManagedUserName(subject)}${
      subject.email ? ` · ${subject.email}` : ""
    }${missingFields.length > 0 ? ` · Missing: ${missingFields.join(", ")}` : ""}`;
  }

  return `${subject.name}${subject.detail ? ` · ${subject.detail}` : ""}`;
}

function isManagedProfile(
  value: AdminManagedProfile | undefined
): value is AdminManagedProfile {
  return Boolean(value);
}

function formatDate(value: string | null) {
  if (!value) return "No date";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatMonth(key: string) {
  const [year, month] = key.split("-");
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, 1));

  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
