"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode, RefObject } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Archive,
  BookOpen,
  CheckCircle,
  ClipboardCheck,
  Compass,
  Copy,
  Eye,
  FileText,
  GraduationCap,
  Library,
  Mail,
  Search,
  Settings,
  Trash2,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

import ResultModal from "../assessment/ResultModal";
import { requestConfirmation, showFeedback } from "../ui/FeedbackCenter";
import AdminUsersManager from "./AdminUsersManager";
import { supabase } from "../../lib/supabase";
import { routes } from "../../lib/navigation";
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
type ContentStatus = "draft" | "published" | "archived";
type ContentStudioTab = "monthly-questions" | "resources" | "trainings";
type CommunicationStatus = "draft" | "published" | "archived";
type CommunicationFormat =
  | "email"
  | "blog_article"
  | "announcement"
  | "newsletter"
  | "dashboard_message"
  | "circle_update";
type AssignmentContentType = "monthly_question" | "resource" | "training";
type AssignmentAudienceType =
  | "coach_library"
  | "all_members"
  | "all_circle_members"
  | "all_coaches"
  | "selected_circle"
  | "selected_member"
  | "selected_coach";
type AssignmentPlacement =
  | "my_dashboard"
  | "coach_dashboard_library"
  | "circle_dashboard"
  | "resources_area"
  | "trainings_area"
  | "featured_dashboard";

const RESOURCE_TYPE_ORDER = [
  "video",
  "audio",
  "article",
  "blog",
  "reflection",
  "case_study",
  "downloadable_tool",
  "worksheet",
  "guide",
  "pdf",
  "document",
  "image",
  "link",
  "other",
];

type SectionId =
  | "people"
  | "circles"
  | "coaches"
  | "assessments"
  | "content-studio"
  | "communications"
  | "reports"
  | "system-settings";

type AdminSection = {
  id: SectionId;
  title: string;
  description: string;
};

type AdminMonthlyQuestion = {
  id: string;
  title: string;
  openingReflection: string;
  questionText: string;
  guidance: string;
  discussionPrompts: string[];
  status: ContentStatus;
  category: string;
  theme: string;
  questionNumber: string;
  assignedCircleCount: number;
  currentUseCount: number;
  publishedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type AdminResource = {
  id: string;
  title: string;
  description: string;
  resourceType: string;
  provider: string;
  externalUrl: string;
  embedUrl: string;
  storagePath: string;
  thumbnailUrl: string;
  coverImagePath: string;
  coverImageUrl: string;
  bodyContent: string;
  fileName: string;
  fileSize: number | null;
  mimeType: string;
  category: string;
  tags: string[];
  status: ContentStatus;
  publishedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type AdminTraining = {
  id: string;
  title: string;
  description: string;
  coverImageUrl: string;
  category: string;
  estimatedDuration: string;
  status: ContentStatus;
  publishedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type AdminCommunication = {
  id: string;
  format: CommunicationFormat;
  title: string;
  subject: string;
  previewText: string;
  summary: string;
  bodyContent: string;
  communicationType: string;
  channel: string;
  dashboardPresentation: string;
  audienceScope: string;
  senderId: string;
  senderName: string;
  replyToEmail: string;
  visibleAuthorName: string;
  headerImagePath: string;
  headerImageUrl: string;
  thumbnailImagePath: string;
  thumbnailImageUrl: string;
  imageAltText: string;
  category: string;
  tags: string[];
  visibleFrom: string | null;
  visibleUntil: string | null;
  links: Array<{
    id: string;
    label: string;
    url: string;
    linkStyle: "text" | "button" | "featured";
    sortOrder: number;
  }>;
  channels: string[];
  audienceTargets: Array<{
    id: string;
    audienceType: string;
    circleId: string;
    profileId: string;
  }>;
  newsletterSections: Array<{
    id: string;
    heading: string;
    bodyContent: string;
    sortOrder: number;
  }>;
  resourceId: string;
  status: CommunicationStatus;
  publishedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type AdminCommunicationSender = {
  id: string;
  displayName: string;
  verifiedFromEmail: string;
  replyToEmail: string;
  senderType: string;
  profileId: string;
  isDefault: boolean;
};

type AdminContentAssignment = {
  id: string;
  contentType: AssignmentContentType;
  contentId: string;
  audienceType: AssignmentAudienceType;
  circleId: string;
  profileId: string;
  placement: AssignmentPlacement;
  assignmentStatus: "active" | "archived";
  visibleFrom: string | null;
  visibleUntil: string | null;
  assignedBy: string;
  createdAt: string | null;
  updatedAt: string | null;
};

type AdminContentStudioPayload = {
  ok: true;
  monthlyQuestions: AdminMonthlyQuestion[];
  resources: AdminResource[];
  trainings: AdminTraining[];
  communications: AdminCommunication[];
  communicationSenders: AdminCommunicationSender[];
  assignments: AdminContentAssignment[];
};

type ContentMessage = {
  type: "success" | "error";
  text: string;
} | null;

const sections: AdminSection[] = [
  {
    id: "people",
    title: "People",
    description: "Manage roles, Circle memberships, and coach assignments.",
  },
  {
    id: "circles",
    title: "Circles",
    description: "Inspect Circle health and membership coverage.",
  },
  {
    id: "coaches",
    title: "Coaches",
    description: "Review coach capacity and active assignments.",
  },
  {
    id: "assessments",
    title: "Assessments",
    description: "Review completion patterns and profile distributions.",
  },
  {
    id: "content-studio",
    title: "Content Studio",
    description: "Create monthly questions, resources, and trainings.",
  },
  {
    id: "communications",
    title: "Communications",
    description:
      "Create messages, announcements, articles, and campaigns for PeaceWorks members.",
  },
  {
    id: "reports",
    title: "Reports",
    description: "Review operational health, alerts, and data diagnostics.",
  },
  {
    id: "system-settings",
    title: "System Settings",
    description: "Review safe configuration status.",
  },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [state, setState] = useState<LoadState>("loading");
  const [analytics, setAnalytics] = useState<AdminAnalyticsPayload | null>(null);
  const [usersPayload, setUsersPayload] = useState<AdminUsersPayload | null>(null);
  const [openSection, setOpenSection] = useState<SectionId>("people");
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
  const lastOpenedSectionRef = useRef<SectionId>("people");
  const shouldScrollWorkspaceRef = useRef(false);
  const shouldScrollDashboardRef = useRef(false);

  useEffect(() => {
    async function loadAdminData() {
      const token = await getAccessToken();

      if (!token) {
        router.replace(routes.myDashboard);
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
        router.replace(routes.login);
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
    function openUrlWorkspace() {
      const params = new URLSearchParams(window.location.search);
      const workspace = normalizeSectionId(
        params.get("workspace") || window.location.hash.replace("#", "")
      );

      if (!workspace) return;

      shouldScrollWorkspaceRef.current = true;
      setOpenSection(workspace);
    }

    openUrlWorkspace();
    window.addEventListener("popstate", openUrlWorkspace);
    window.addEventListener("hashchange", openUrlWorkspace);

    return () => {
      window.removeEventListener("popstate", openUrlWorkspace);
      window.removeEventListener("hashchange", openUrlWorkspace);
    };
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
      router.replace(routes.login);
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
    const params = new URLSearchParams(window.location.search);
    params.set("workspace", sectionId);
    window.history.replaceState(null, "", `${window.location.pathname}?${params}`);
  }

  function openUser(userId: string) {
    router.push(`/admin/people/${userId}`);
  }

  function openCircle() {
    goToSection("circles");
  }

  function returnToDashboard() {
    shouldScrollDashboardRef.current = true;
    window.history.replaceState(null, "", `${window.location.pathname}?workspace=people`);
    setOpenSection("people");
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
        onAction={() => router.push(routes.myDashboard)}
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
              <div className="eyebrow">Admin Dashboard</div>
              <h1>Admin Dashboard</h1>
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
            <option value="reports">Review alerts</option>
            <option value="assessments">View results</option>
            <option value="system-settings">Check settings</option>
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
      {activeSection === "coaches" && (
        <CoachingSection
          operations={operations}
          onOpenUser={onOpenUser}
          usersPayload={usersPayload}
        />
      )}
      {activeSection === "content-studio" && (
        <ContentStudioSection usersPayload={usersPayload} />
      )}
      {activeSection === "communications" && <CommunicationsSection />}
      {activeSection === "reports" && (
        <ReportsSection
          operations={operations}
          onJump={onJump}
          onOpenUser={onOpenUser}
        />
      )}
      {activeSection === "system-settings" && <PlatformSettingsSection />}
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
      <div className="admin-card-grid">
        <article className="admin-small-card">
          <span>Published</span>
          <strong>Peace Assessment</strong>
          <p>
            {analytics.overview.completedAssessments} completed result
            {analytics.overview.completedAssessments === 1 ? "" : "s"} ·{" "}
            {analytics.overview.usersWithCompletedAssessment} participant
            {analytics.overview.usersWithCompletedAssessment === 1 ? "" : "s"}
          </p>
        </article>
        <article className="admin-small-card">
          <span>Assessment Assignments</span>
          <strong>Audience planning</strong>
          <p>
            Organize assessment availability for members, Circles, selected
            users, and date-based participation windows.
          </p>
        </article>
      </div>
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
              {circle.memberCount === 1 ? "" : "s"} · {circle.coaches.length} active
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
  const [coachIds, setCoachIds] = useState<string[]>(
    selectedCircle?.coachIds || []
  );
  const [saveState, setSaveState] = useState<"idle" | "saving" | "success" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");
  const availableCircleCoaches = payload.users.filter(
    (user) =>
      user.roles.includes("coach") &&
      (user.accountStatus === "active" || coachIds.includes(user.id))
  );

  function selectCircle(circleId: string) {
    const nextCircle = circles.find((circle) => circle.id === circleId);

    setSelectedCircleId(circleId);
    setMemberIds(nextCircle?.memberIds || []);
    setCoachIds(nextCircle?.coachIds || []);
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
        coachIds,
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
              coachIds,
            }
          : circle
      )
    );
    setSaveState("success");
    setMessage(result.message || "Circle roster was updated.");
  }

  function resetCircle() {
    setMemberIds(selectedCircle?.memberIds || []);
    setCoachIds(selectedCircle?.coachIds || []);
    setSaveState("idle");
    setMessage("");
  }

  return (
    <section className="admin-circle-manager">
      <div className="admin-circle-manager-head">
        <div>
          <span className="card-label">Circle Management</span>
          <h3>Manage Circle members and coaches</h3>
          <p>
            Circle participation and Circle coaching are managed as separate
            relationships.
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
                <h3>Circle Coaches</h3>
                <p>
                  Active coach-role profiles assigned to coach this Circle.
                  Coaches do not need a Circle membership.
                </p>
              </div>

              <div className="admin-checkbox-list">
                {availableCircleCoaches.length === 0 ? (
                  <div className="admin-empty">No Circle coaches are available.</div>
                ) : (
                  availableCircleCoaches.map((coach) => (
                    <CircleCheckboxRow
                      key={coach.id}
                      label={formatManagedUserName(coach)}
                      description={formatCircleUserDescription(coach)}
                      checked={coachIds.includes(coach.id)}
                      onChange={() =>
                        toggleSelection(coachIds, coach.id, setCoachIds)
                      }
                    />
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
          ["Coaches without an active coaching relationship", operations.diagnostics.coachesWithoutActiveRelationship],
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

function ContentStudioSection({ usersPayload }: { usersPayload: AdminUsersPayload }) {
  const [activeTab, setActiveTab] = useState<ContentStudioTab>("monthly-questions");
  const [payload, setPayload] = useState<AdminContentStudioPayload | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
    "loading"
  );
  const [message, setMessage] = useState<ContentMessage>(null);

  async function loadContent() {
    setLoadState("loading");
    setMessage(null);

    const token = await getAccessToken();

    if (!token) {
      setLoadState("error");
      setMessage({ type: "error", text: "Admin session is no longer available." });
      return;
    }

    const response = await fetch("/api/admin/content/monthly-questions", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = (await response.json().catch(() => null)) as
      | AdminContentStudioPayload
      | { ok?: false; message?: string }
      | null;

    if (!response.ok || !result || result.ok !== true) {
      setLoadState("error");
      setMessage({
        type: "error",
        text:
          result && "message" in result && result.message
            ? result.message
            : "Content library could not be loaded.",
      });
      return;
    }

    setPayload(result);
    setLoadState("ready");
  }

  useEffect(() => {
    void Promise.resolve().then(loadContent);
  }, []);

  const tabs: Array<{
    id: ContentStudioTab;
    title: string;
    description: string;
    count: number;
    icon: LucideIcon;
  }> = [
    {
      id: "monthly-questions",
      title: "Monthly Questions",
      description: "Create the shared monthly prompts coaches assign to Circles.",
      count: payload?.monthlyQuestions.length || 0,
      icon: BookOpen,
    },
    {
      id: "resources",
      title: "Resource Library",
      description: "Save links and references for future Circle resource sharing.",
      count: payload?.resources.length || 0,
      icon: Library,
    },
    {
      id: "trainings",
      title: "Training Library",
      description: "Maintain training records for future learning experiences.",
      count: payload?.trainings.length || 0,
      icon: GraduationCap,
    },
  ];

  return (
    <div className="admin-section-stack">
      {message && <div className={`admin-message ${message.type}`}>{message.text}</div>}

      <div className="admin-content-card-grid">
        {tabs.map((tab) => (
          <button
            className={`admin-content-card${activeTab === tab.id ? " active" : ""}`}
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
          >
            <DashboardTileIcon icon={tab.icon} />
            <span>
              <strong>{tab.title}</strong>
              <small>{tab.description}</small>
            </span>
            <em>{tab.count}</em>
          </button>
        ))}
      </div>

      {loadState === "loading" && (
        <div className="admin-empty">Loading Content Studio...</div>
      )}

      {loadState === "error" && (
        <DashboardEmptyState
          title="Content Studio could not be loaded."
          description="Please check the content library setup and try again."
        />
      )}

      {loadState === "ready" && payload && (
        <>
          {activeTab === "monthly-questions" && (
            <MonthlyQuestionLibrary
              assignments={payload.assignments}
              questions={payload.monthlyQuestions}
              usersPayload={usersPayload}
              onMessage={setMessage}
              onRefresh={loadContent}
            />
          )}
          {activeTab === "resources" && (
            <ResourceLibrary
              assignments={payload.assignments}
              resources={payload.resources}
              usersPayload={usersPayload}
              onMessage={setMessage}
              onRefresh={loadContent}
            />
          )}
          {activeTab === "trainings" && (
            <TrainingLibrary
              assignments={payload.assignments}
              trainings={payload.trainings}
              usersPayload={usersPayload}
              onMessage={setMessage}
              onRefresh={loadContent}
            />
          )}
        </>
      )}
    </div>
  );
}

function MonthlyQuestionLibrary({
  assignments,
  questions,
  usersPayload,
  onMessage,
  onRefresh,
}: {
  assignments: AdminContentAssignment[];
  questions: AdminMonthlyQuestion[];
  usersPayload: AdminUsersPayload;
  onMessage: (message: ContentMessage) => void;
  onRefresh: () => Promise<void>;
}) {
  const emptyForm = {
    id: "",
    title: "",
    category: "",
    theme: "",
    questionNumber: "",
    openingReflection: "",
    questionText: "",
    guidance: "",
    discussionPrompts: "",
  };
  const [form, setForm] = useState(emptyForm);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ContentStatus | "all">("all");
  const [saving, setSaving] = useState(false);
  const [assigningQuestion, setAssigningQuestion] =
    useState<AdminMonthlyQuestion | null>(null);
  const filtered = questions.filter((question) => {
    const haystack = [
      question.title,
      question.category,
      question.theme,
      question.questionText,
    ]
      .join(" ")
      .toLowerCase();

    return (
      (status === "all" || question.status === status) &&
      haystack.includes(query.trim().toLowerCase())
    );
  });

  function editQuestion(question: AdminMonthlyQuestion) {
    setForm({
      id: question.id,
      title: question.title,
      category: question.category,
      theme: question.theme,
      questionNumber: question.questionNumber,
      openingReflection: question.openingReflection,
      questionText: question.questionText,
      guidance: question.guidance,
      discussionPrompts: question.discussionPrompts.join("\n"),
    });
  }

  async function saveQuestion() {
    setSaving(true);
    onMessage(null);

    const result = await adminContentRequest(
      form.id
        ? `/api/admin/content/monthly-questions/${form.id}`
        : "/api/admin/content/monthly-questions",
      {
        method: form.id ? "PATCH" : "POST",
        body: {
          title: form.title,
          category: form.category,
          theme: form.theme,
          questionNumber: form.questionNumber,
          openingReflection: form.openingReflection,
          questionText: form.questionText,
          guidance: form.guidance,
          discussionPrompts: form.discussionPrompts
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean),
        },
      }
    );

    setSaving(false);

    if (!result.ok) {
      onMessage({ type: "error", text: result.message });
      return;
    }

    setForm(emptyForm);
    onMessage({ type: "success", text: "Monthly question was saved." });
    await onRefresh();
  }

  return (
    <div className="admin-content-workspace">
      <ContentLibraryTools
        search={query}
        status={status}
        searchLabel="Search monthly questions"
        onSearch={setQuery}
        onStatusChange={setStatus}
      />

      <section className="admin-content-editor">
        <div className="admin-content-editor-head">
          <div>
            <span className="card-label">Monthly Question Library</span>
            <h3>{form.id ? "Edit monthly question" : "Create monthly question"}</h3>
          </div>
          {form.id && (
            <button className="admin-link-button" type="button" onClick={() => setForm(emptyForm)}>
              New Question
            </button>
          )}
        </div>

        <div className="admin-content-form-grid">
          <ContentInput label="Title" value={form.title} onChange={(title) => setForm({ ...form, title })} />
          <ContentInput label="Category" value={form.category} onChange={(category) => setForm({ ...form, category })} />
          <ContentInput label="Theme" value={form.theme} onChange={(theme) => setForm({ ...form, theme })} />
          <ContentInput
            label="Question Number (optional, e.g. Question 1 or Question 2A)"
            value={form.questionNumber}
            onChange={(questionNumber) =>
              setForm({ ...form, questionNumber })
            }
          />
          <ContentTextarea label="Opening Reflection" value={form.openingReflection} onChange={(openingReflection) => setForm({ ...form, openingReflection })} />
          <ContentTextarea label="Question" value={form.questionText} onChange={(questionText) => setForm({ ...form, questionText })} />
          <ContentTextarea label="Guidance" value={form.guidance} onChange={(guidance) => setForm({ ...form, guidance })} />
          <ContentTextarea label="Discussion Prompts" value={form.discussionPrompts} onChange={(discussionPrompts) => setForm({ ...form, discussionPrompts })} />
        </div>

        <button className="btn btn-primary" type="button" onClick={saveQuestion} disabled={saving}>
          {saving ? "Saving..." : "Save Question"}
        </button>
      </section>

      <div className="admin-content-list">
        {filtered.length === 0 ? (
          <div className="admin-empty">No monthly questions match this view.</div>
        ) : (
          filtered.map((question) => (
            <MonthlyQuestionCard
              key={question.id}
              question={question}
              assignments={assignments.filter(
                (assignment) =>
                  assignment.contentType === "monthly_question" &&
                  assignment.contentId === question.id
              )}
              onEdit={() => editQuestion(question)}
              onAssign={() => setAssigningQuestion(question)}
              onMessage={onMessage}
              onRefresh={onRefresh}
            />
          ))
        )}
      </div>

      {assigningQuestion && (
        <ContentAssignmentPanel
          content={{
            id: assigningQuestion.id,
            title: assigningQuestion.title,
            type: "monthly_question",
            status: assigningQuestion.status,
          }}
          assignments={assignments.filter(
            (assignment) =>
              assignment.contentType === "monthly_question" &&
              assignment.contentId === assigningQuestion.id
          )}
          usersPayload={usersPayload}
          onClose={() => setAssigningQuestion(null)}
          onMessage={onMessage}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
}

function MonthlyQuestionCard({
  assignments,
  question,
  onEdit,
  onAssign,
  onMessage,
  onRefresh,
}: {
  assignments: AdminContentAssignment[];
  question: AdminMonthlyQuestion;
  onEdit: () => void;
  onAssign: () => void;
  onMessage: (message: ContentMessage) => void;
  onRefresh: () => Promise<void>;
}) {
  async function runAction(action: "publish" | "archive" | "delete" | "duplicate") {
    if (
      action === "delete" &&
      !(await requestConfirmation({
        title: "Delete this draft monthly question?",
        description:
          "This permanently deletes the draft. Assigned questions should be archived instead.",
        confirmLabel: "Delete Draft",
        tone: "danger",
      }))
    ) {
      return;
    }

    const status = action === "publish" ? "published" : action === "archive" ? "archived" : null;
    const result = await adminContentRequest(
      action === "duplicate"
        ? `/api/admin/content/monthly-questions/${question.id}/duplicate`
        : `/api/admin/content/monthly-questions/${question.id}`,
      {
        method: action === "delete" ? "DELETE" : action === "duplicate" ? "POST" : "PATCH",
        body: status ? { status } : undefined,
      }
    );

    if (!result.ok) {
      onMessage({ type: "error", text: result.message });
      return;
    }

    onMessage({ type: "success", text: "Monthly question library was updated." });
    await onRefresh();
  }

  return (
    <article className="admin-content-item">
      <div>
        <span>{formatContentStatus(question.status)}</span>
        <h3>{question.title}</h3>
        <p>{question.questionText || "No question text yet."}</p>
        <small>
          {[
            question.questionNumber,
            question.category,
            question.theme,
          ]
            .filter(Boolean)
            .join(" · ") || "No category"}{" "}
          ·{" "}
          {question.assignedCircleCount} assigned · {question.currentUseCount} current
        </small>
      </div>
      <div className="admin-content-actions">
        <button className="admin-link-button" type="button" onClick={onEdit}>
          <FileText size={15} /> Edit
        </button>
        <button className="admin-link-button" type="button" onClick={() => runAction("duplicate")}>
          <Copy size={15} /> Duplicate
        </button>
        {question.status !== "published" && (
          <button className="admin-link-button" type="button" onClick={() => runAction("publish")}>
            <CheckCircle size={15} /> Publish
          </button>
        )}
        {question.status !== "archived" && (
          <button className="admin-link-button" type="button" onClick={() => runAction("archive")}>
            <Archive size={15} /> Archive
          </button>
        )}
        {question.status === "published" && (
          <button className="admin-link-button" type="button" onClick={onAssign}>
            <Compass size={15} /> Assign Content
          </button>
        )}
        {question.assignedCircleCount === 0 && (
          <button className="admin-link-button danger" type="button" onClick={() => runAction("delete")}>
            <Trash2 size={15} /> Delete
          </button>
        )}
      </div>
      <AssignmentSummary assignments={assignments} />
    </article>
  );
}

function ResourceLibrary({
  assignments,
  resources,
  usersPayload,
  onMessage,
  onRefresh,
}: {
  assignments: AdminContentAssignment[];
  resources: AdminResource[];
  usersPayload: AdminUsersPayload;
  onMessage: (message: ContentMessage) => void;
  onRefresh: () => Promise<void>;
}) {
  const emptyForm = {
    id: "",
    title: "",
    description: "",
    resourceType: "link",
    provider: "",
    externalUrl: "",
    embedUrl: "",
    storagePath: "",
    thumbnailUrl: "",
    coverImagePath: "",
    coverImageUrl: "",
    bodyContent: "",
    fileName: "",
    fileSize: null as number | null,
    mimeType: "",
    category: "",
    tags: "",
  };
  const [form, setForm] = useState(emptyForm);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ContentStatus | "all">("all");
  const [assigningResource, setAssigningResource] = useState<AdminResource | null>(null);
  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);
  const [creatingResource, setCreatingResource] = useState(false);
  const filtered = resources.filter((resource) =>
    (status === "all" || resource.status === status) &&
    [resource.title, resource.description, resource.category, resource.tags.join(" ")]
      .join(" ")
      .toLowerCase()
      .includes(query.trim().toLowerCase())
  );

  const isUploadedType = isUploadedResourceType(form.resourceType);
  const isHostedType = form.resourceType === "video" || form.resourceType === "audio";

  async function saveResource() {
    const result = await adminContentRequest(
      form.id
        ? `/api/admin/content/resources/${form.id}`
        : "/api/admin/content/resources",
      {
        method: form.id ? "PATCH" : "POST",
        body: {
          ...form,
          tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
        },
      }
    );

    if (!result.ok) {
      onMessage({ type: "error", text: result.message });
      return;
    }

    setForm(emptyForm);
    setCreatingResource(false);
    setEditingResourceId(null);
    onMessage({ type: "success", text: "Resource was saved." });
    await onRefresh();
  }

  async function uploadResourceFile(file: File | null) {
    if (!file) return;

    const token = await getAccessToken();

    if (!token) {
      onMessage({ type: "error", text: "Admin session is no longer available." });
      return;
    }

    const formData = new FormData();
    formData.set("resourceType", form.resourceType);
    formData.set("file", file);

    const response = await fetch("/api/admin/content/resources/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    const result = (await response.json().catch(() => null)) as
      | {
          ok?: boolean;
          message?: string;
          upload?: {
            storagePath: string;
            fileName: string;
            fileSize: number;
            mimeType: string;
          };
        }
      | null;

    if (!response.ok || !result?.ok || !result.upload) {
      onMessage({
        type: "error",
        text: result?.message || "Resource file could not be uploaded.",
      });
      return;
    }

    setForm({
      ...form,
      storagePath: result.upload.storagePath,
      coverImagePath:
        form.resourceType === "image" && !form.coverImagePath
          ? result.upload.storagePath
          : form.coverImagePath,
      fileName: result.upload.fileName,
      fileSize: result.upload.fileSize,
      mimeType: result.upload.mimeType,
    });
    onMessage({ type: "success", text: "Resource file was uploaded." });
  }

  async function uploadCoverImage(file: File | null) {
    if (!file) return;

    const token = await getAccessToken();

    if (!token) {
      onMessage({ type: "error", text: "Admin session is no longer available." });
      return;
    }

    const formData = new FormData();
    formData.set("resourceType", form.resourceType);
    formData.set("uploadKind", "cover");
    formData.set("file", file);

    const response = await fetch("/api/admin/content/resources/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    const result = (await response.json().catch(() => null)) as
      | {
          ok?: boolean;
          message?: string;
          upload?: {
            storagePath: string;
            fileName: string;
          };
        }
      | null;

    if (!response.ok || !result?.ok || !result.upload) {
      onMessage({
        type: "error",
        text: result?.message || "Cover image could not be uploaded.",
      });
      return;
    }

    setForm({
      ...form,
      coverImagePath: result.upload.storagePath,
      thumbnailUrl: "",
    });
    onMessage({ type: "success", text: "Cover image was uploaded." });
  }

  const resourceForm = (
    <>
      <ContentInput label="Title" value={form.title} onChange={(title) => setForm({ ...form, title })} />
      <ContentSelect
        label="Type"
        value={form.resourceType}
        options={[
          ["link", "Link"],
          ["video", "Video"],
          ["audio", "Audio"],
          ["pdf", "PDF"],
          ["image", "Image"],
          ["document", "Document"],
          ["worksheet", "Worksheet"],
          ["guide", "Guide"],
          ["article", "Article"],
          ["blog", "Blog"],
          ["reflection", "Reflection"],
          ["case_study", "Case Study"],
          ["downloadable_tool", "Downloadable Tool"],
          ["other", "Other"],
        ]}
        onChange={(resourceType) =>
          setForm({
            ...form,
            resourceType,
            externalUrl: "",
            embedUrl: "",
            provider: "",
            storagePath: "",
            coverImagePath: "",
            coverImageUrl: "",
            bodyContent: "",
            fileName: "",
            fileSize: null,
            mimeType: "",
          })
        }
      />
      {!isUploadedType && (
        <ContentInput
          label={form.resourceType === "video" ? "Video URL" : form.resourceType === "audio" ? "Audio or Podcast URL" : "URL"}
          value={form.externalUrl}
          onChange={(externalUrl) => setForm({ ...form, externalUrl })}
        />
      )}
      {isHostedType && (
        <ContentInput label="Approved Image URL" value={form.thumbnailUrl} onChange={(thumbnailUrl) => setForm({ ...form, thumbnailUrl })} />
      )}
      {isUploadedType && (
        <label>
          <span>{getPrimaryUploadLabel(form.resourceType)}</span>
          <input
            type="file"
            accept={getResourceFileAccept(form.resourceType)}
            onChange={(event) => uploadResourceFile(event.target.files?.[0] || null)}
          />
          {form.fileName && <small>{form.fileName} · {formatFileSize(form.fileSize)}</small>}
        </label>
      )}
      <label>
        <span>Thumbnail or Cover Image</span>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
          onChange={(event) => uploadCoverImage(event.target.files?.[0] || null)}
        />
        <small>Upload an optional image to represent this resource in the library and on member dashboards.</small>
        {form.coverImagePath && (
          <button
            className="admin-link-button"
            type="button"
            onClick={() => setForm({ ...form, coverImagePath: "", coverImageUrl: "", thumbnailUrl: "" })}
          >
            Remove Image
          </button>
        )}
      </label>
      {isWrittenResourceType(form.resourceType) && (
        <ContentTextarea label="Body Content" value={form.bodyContent} onChange={(bodyContent) => setForm({ ...form, bodyContent })} />
      )}
      <ContentInput label="Category" value={form.category} onChange={(category) => setForm({ ...form, category })} />
      <ContentInput label="Tags" value={form.tags} onChange={(tags) => setForm({ ...form, tags })} />
      <ContentTextarea label="Description" value={form.description} onChange={(description) => setForm({ ...form, description })} />
    </>
  );

  const groupedResources = RESOURCE_TYPE_ORDER.map((resourceType) => ({
    resourceType,
    resources: filtered.filter((resource) => resource.resourceType === resourceType),
  })).filter((group) => group.resources.length > 0);
  const uncategorizedResources = filtered.filter(
    (resource) => !RESOURCE_TYPE_ORDER.includes(resource.resourceType)
  );
  if (uncategorizedResources.length > 0) {
    groupedResources.push({ resourceType: "uncategorized", resources: uncategorizedResources });
  }

  function beginCreate() {
    setForm(emptyForm);
    setAssigningResource(null);
    setEditingResourceId(null);
    setCreatingResource(true);
  }

  function beginEdit(resource: AdminResource) {
    setAssigningResource(null);
    setCreatingResource(false);
    setEditingResourceId(resource.id);
    setForm({
      id: resource.id,
      title: resource.title,
      description: resource.description,
      resourceType: resource.resourceType,
      provider: resource.provider,
      externalUrl: resource.externalUrl,
      embedUrl: resource.embedUrl,
      storagePath: resource.storagePath,
      thumbnailUrl: resource.thumbnailUrl,
      coverImagePath: resource.coverImagePath,
      coverImageUrl: resource.coverImageUrl,
      bodyContent: resource.bodyContent,
      fileName: resource.fileName,
      fileSize: resource.fileSize,
      mimeType: resource.mimeType,
      category: resource.category,
      tags: resource.tags.join(", "),
    });
  }

  return (
    <div className="admin-content-workspace admin-resource-library">
      <div className="admin-resource-library-head">
        <div>
          <span className="card-label">Resource Library</span>
          <h3>Manage the resources available across PeaceWorks.</h3>
        </div>
        <button className="btn btn-primary" type="button" onClick={beginCreate}>
          Add Resource
        </button>
      </div>
      {creatingResource && (
        <section className="admin-content-editor admin-resource-action-panel">
          <div className="admin-content-editor-head">
            <div><span className="card-label">New Resource</span><h3>Add Resource</h3></div>
            <button className="admin-link-button" type="button" onClick={() => setCreatingResource(false)}>Close</button>
          </div>
          <div className="admin-content-form-grid">{resourceForm}</div>
          <button className="btn btn-primary" type="button" onClick={saveResource}>Save</button>
        </section>
      )}
      <ContentLibraryTools
        search={query}
        status={status}
        searchLabel="Search resource library"
        onSearch={(value) => {
          setQuery(value);
          setEditingResourceId(null);
          setAssigningResource(null);
        }}
        onStatusChange={(value) => {
          setStatus(value);
          setEditingResourceId(null);
          setAssigningResource(null);
        }}
      />
      {groupedResources.map((group) => (
        <section className="admin-resource-type-section" key={group.resourceType}>
          <div className="admin-resource-type-head">
            <h3>{formatResourceTypeSection(group.resourceType)}</h3>
            <span>{group.resources.length} {group.resources.length === 1 ? "resource" : "resources"}</span>
          </div>
          <div className="admin-resource-grid">
          {group.resources.map((resource) => (
            <div className="admin-resource-grid-entry" key={resource.id}>
            <ContentRecordCard
          title={resource.title}
          detail={resource.description}
          status={resource.status}
          meta={[
            resource.resourceType,
            resource.provider,
            resource.category,
            resource.fileName,
            resource.tags.join(", "),
          ]}
          externalUrl={resource.externalUrl}
          fileOpenEndpoint={
            resource.storagePath
              ? `/api/admin/content/resources/${resource.id}/open`
              : ""
          }
          coverImageUrl={resource.coverImageUrl || resource.thumbnailUrl}
          resourceTile
          selected={editingResourceId === resource.id || assigningResource?.id === resource.id}
          assignments={assignments.filter(
            (assignment) =>
              assignment.contentType === "resource" &&
              assignment.contentId === resource.id
          )}
          onEdit={() => beginEdit(resource)}
          onStatus={(nextStatus) =>
            updateContentStatus(
              `/api/admin/content/resources/${resource.id}`,
              nextStatus,
              onMessage,
              onRefresh
            )
          }
          onDuplicate={() =>
            duplicateContentRecord(
              `/api/admin/content/resources/${resource.id}/duplicate`,
              onMessage,
              onRefresh
            )
          }
          onAssign={() => {
            setCreatingResource(false);
            setEditingResourceId(null);
            setAssigningResource(resource);
          }}
          onDelete={() =>
            deleteContentRecord(
              `/api/admin/content/resources/${resource.id}`,
              "Delete this resource?",
              onMessage,
              onRefresh
            )
          }
            />
            {editingResourceId === resource.id && (
              <section className="admin-content-editor admin-resource-action-panel">
                <div className="admin-content-editor-head">
                  <div><span className="card-label">Edit Resource</span><h3>{resource.title}</h3></div>
                  <button className="admin-link-button" type="button" onClick={() => setEditingResourceId(null)}>Close</button>
                </div>
                <div className="admin-content-form-grid">{resourceForm}</div>
                <button className="btn btn-primary" type="button" onClick={saveResource}>Save</button>
              </section>
            )}
            {assigningResource?.id === resource.id && (
              <div className="admin-resource-action-panel">
                <ContentAssignmentPanel
                  content={{
                    id: assigningResource.id,
                    title: assigningResource.title,
                    type: "resource",
                    status: assigningResource.status,
                  }}
                  assignments={assignments.filter(
                    (assignment) =>
                      assignment.contentType === "resource" &&
                      assignment.contentId === assigningResource.id
                  )}
                  usersPayload={usersPayload}
                  onClose={() => setAssigningResource(null)}
                  onMessage={onMessage}
                  onRefresh={onRefresh}
                />
              </div>
            )}
            </div>
          ))}
          </div>
        </section>
      ))}
      {filtered.length === 0 && <div className="admin-empty">No resources match these filters.</div>}
    </div>
  );
}

function TrainingLibrary({
  assignments,
  trainings,
  usersPayload,
  onMessage,
  onRefresh,
}: {
  assignments: AdminContentAssignment[];
  trainings: AdminTraining[];
  usersPayload: AdminUsersPayload;
  onMessage: (message: ContentMessage) => void;
  onRefresh: () => Promise<void>;
}) {
  const emptyForm = {
    id: "",
    title: "",
    description: "",
    coverImageUrl: "",
    category: "",
    estimatedDuration: "",
  };
  const [form, setForm] = useState(emptyForm);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ContentStatus | "all">("all");
  const [assigningTraining, setAssigningTraining] = useState<AdminTraining | null>(null);
  const filtered = trainings.filter((training) =>
    (status === "all" || training.status === status) &&
    [training.title, training.description, training.category]
      .join(" ")
      .toLowerCase()
      .includes(query.trim().toLowerCase())
  );

  async function saveTraining() {
    const result = await adminContentRequest(
      form.id
        ? `/api/admin/content/trainings/${form.id}`
        : "/api/admin/content/trainings",
      {
        method: form.id ? "PATCH" : "POST",
        body: form,
      }
    );

    if (!result.ok) {
      onMessage({ type: "error", text: result.message });
      return;
    }

    setForm(emptyForm);
    onMessage({ type: "success", text: "Training was saved." });
    await onRefresh();
  }

  return (
    <ContentRecordLibrary
      title="Training Library"
      subtitle="Maintain training records for future learning paths."
      search={query}
      status={status}
      onSearch={setQuery}
      onStatusChange={setStatus}
      form={
        <>
          <ContentInput label="Title" value={form.title} onChange={(title) => setForm({ ...form, title })} />
          <ContentInput label="Category" value={form.category} onChange={(category) => setForm({ ...form, category })} />
          <ContentInput label="Estimated Duration" value={form.estimatedDuration} onChange={(estimatedDuration) => setForm({ ...form, estimatedDuration })} />
          <ContentInput label="Cover Image Reference" value={form.coverImageUrl} onChange={(coverImageUrl) => setForm({ ...form, coverImageUrl })} />
          <ContentTextarea label="Description" value={form.description} onChange={(description) => setForm({ ...form, description })} />
        </>
      }
      onSave={saveTraining}
    >
      {filtered.map((training) => (
        <ContentRecordCard
          key={training.id}
          title={training.title}
          detail={training.description}
          status={training.status}
          meta={[training.category, training.estimatedDuration]}
          assignments={assignments.filter(
            (assignment) =>
              assignment.contentType === "training" &&
              assignment.contentId === training.id
          )}
          onEdit={() =>
            setForm({
              id: training.id,
              title: training.title,
              description: training.description,
              coverImageUrl: training.coverImageUrl,
              category: training.category,
              estimatedDuration: training.estimatedDuration,
            })
          }
          onStatus={(nextStatus) =>
            updateContentStatus(
              `/api/admin/content/trainings/${training.id}`,
              nextStatus,
              onMessage,
              onRefresh
            )
          }
          onDuplicate={() =>
            duplicateContentRecord(
              `/api/admin/content/trainings/${training.id}/duplicate`,
              onMessage,
              onRefresh
            )
          }
          onAssign={() => setAssigningTraining(training)}
          onDelete={() =>
            deleteContentRecord(
              `/api/admin/content/trainings/${training.id}`,
              "Delete this training?",
              onMessage,
              onRefresh
            )
          }
        />
      ))}
      {assigningTraining && (
        <ContentAssignmentPanel
          content={{
            id: assigningTraining.id,
            title: assigningTraining.title,
            type: "training",
            status: assigningTraining.status,
          }}
          assignments={assignments.filter(
            (assignment) =>
              assignment.contentType === "training" &&
              assignment.contentId === assigningTraining.id
          )}
          usersPayload={usersPayload}
          onClose={() => setAssigningTraining(null)}
          onMessage={onMessage}
          onRefresh={onRefresh}
        />
      )}
    </ContentRecordLibrary>
  );
}

function CommunicationsSection() {
  const emptyForm = {
    id: "",
    format: "announcement" as CommunicationFormat,
    title: "",
    subject: "",
    previewText: "",
    summary: "",
    bodyContent: "",
    communicationType: "announcement",
    channel: "dashboard",
    dashboardPresentation: "standard",
    audienceScope: "all_members",
    senderId: "",
    replyToEmail: "",
    visibleAuthorName: "",
    headerImagePath: "",
    headerImageUrl: "",
    thumbnailImagePath: "",
    thumbnailImageUrl: "",
    useHeaderAsThumbnail: false,
    imageAltText: "",
    category: "",
    tags: [] as string[],
    visibleFrom: "",
    visibleUntil: "",
    links: [] as Array<{ label: string; url: string; linkStyle: string; sortOrder: number }>,
    channels: ["my_dashboard"] as string[],
    circleIds: [] as string[],
    profileIds: [] as string[],
    newsletterSections: [] as Array<{ heading: string; bodyContent: string; sortOrder: number }>,
    addToResourceLibrary: false,
    resourceTitle: "",
    resourceSummary: "",
    resourceType: "article",
    resourceCategory: "",
    resourceTags: [] as string[],
    resourceStatus: "draft",
  };
  const [communications, setCommunications] = useState<AdminCommunication[]>([]);
  const [senders, setSenders] = useState<AdminCommunicationSender[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<CommunicationStatus | "all">("all");
  const [message, setMessage] = useState<ContentMessage>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
    "loading"
  );

  async function loadCommunications() {
    setLoadState("loading");
    const token = await getAccessToken();

    if (!token) {
      setLoadState("error");
      setMessage({ type: "error", text: "Admin session is no longer available." });
      return;
    }

    const response = await fetch("/api/admin/content/communications", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = (await response.json().catch(() => null)) as
      | AdminContentStudioPayload
      | { ok?: false; message?: string }
      | null;

    if (!response.ok || !result || result.ok !== true) {
      setLoadState("error");
      setMessage({
        type: "error",
        text:
          result && "message" in result && result.message
            ? result.message
            : "Communications could not be loaded.",
      });
      return;
    }

    setCommunications(result.communications);
    setSenders(result.communicationSenders || []);
    setLoadState("ready");
  }

  useEffect(() => {
    void Promise.resolve().then(loadCommunications);
  }, []);

  const filtered = communications.filter((communication) =>
    (status === "all" || communication.status === status) &&
    [
      communication.title,
      communication.subject,
      communication.summary,
      communication.visibleAuthorName,
      communication.communicationType,
      communication.channel,
      communication.audienceScope,
      communication.channels.join(" "),
    ]
      .join(" ")
      .toLowerCase()
      .includes(query.trim().toLowerCase())
  );

  async function saveCommunication() {
    const result = await adminContentRequest(
      form.id
        ? `/api/admin/content/communications/${form.id}`
        : "/api/admin/content/communications",
      {
        method: form.id ? "PATCH" : "POST",
        body: form,
      }
    );

    if (!result.ok) {
      setMessage({ type: "error", text: result.message });
      return;
    }

    setForm(emptyForm);
    setMessage({ type: "success", text: "Communication was saved." });
    await loadCommunications();
  }

  async function sendTestEmail() {
    const result = await adminContentRequest(
      "/api/admin/content/communications/test-email",
      {
        method: "POST",
        body: {
          title: form.title,
          message: form.bodyContent || form.summary,
        },
      }
    );

    setMessage(
      result.ok
        ? { type: "success", text: result.message || "Test email accepted for sending." }
        : { type: "error", text: result.message }
    );
  }

  const formatOptions: Array<[CommunicationFormat, string]> = [
    ["email", "Email"],
    ["blog_article", "Blog / Article"],
    ["announcement", "Announcement"],
    ["newsletter", "Newsletter"],
    ["dashboard_message", "Dashboard Message"],
    ["circle_update", "Circle Update"],
  ];
  const selectedSender = senders.find((sender) => sender.id === form.senderId);
  const needsSender =
    form.format === "email" ||
    form.format === "newsletter" ||
    form.channels.includes("email");
  const showArticleFields = form.format === "blog_article";
  const showNewsletterSections = form.format === "newsletter";
  const showDashboardPresentation =
    form.format === "announcement" || form.format === "dashboard_message";
  const showMedia =
    form.format !== "email" ||
    form.channels.includes("my_dashboard") ||
    form.channels.includes("resource_library");
  const compatibleChannels = getCommunicationChannelOptions(form.format);
  const requiresCircleTargets = form.audienceScope === "selected_circles";
  const requiresProfileTargets =
    form.audienceScope === "selected_members" || form.audienceScope === "selected_coaches";

  function updateFormat(format: CommunicationFormat) {
    const nextChannels = getDefaultCommunicationChannels(format);
    setForm({
      ...form,
      format,
      communicationType: format,
      channels: nextChannels,
      channel: nextChannels.includes("email")
        ? nextChannels.length > 1
          ? "both"
          : "email"
        : "dashboard",
      dashboardPresentation:
        format === "blog_article" ? "article" : form.dashboardPresentation,
      audienceScope:
        format === "circle_update" ? "selected_circles" : form.audienceScope,
    });
  }

  function toggleChannel(channel: string) {
    const next = form.channels.includes(channel)
      ? form.channels.filter((item) => item !== channel)
      : [...form.channels, channel];
    const safeNext = next.length > 0 ? next : getDefaultCommunicationChannels(form.format);

    setForm({
      ...form,
      channels: safeNext,
      channel: safeNext.includes("email")
        ? safeNext.length > 1
          ? "both"
          : "email"
        : "dashboard",
    });
  }

  function updateLink(index: number, patch: Partial<(typeof form.links)[number]>) {
    setForm({
      ...form,
      links: form.links.map((link, itemIndex) =>
        itemIndex === index ? { ...link, ...patch } : link
      ),
    });
  }

  function updateNewsletterSection(
    index: number,
    patch: Partial<(typeof form.newsletterSections)[number]>
  ) {
    setForm({
      ...form,
      newsletterSections: form.newsletterSections.map((section, itemIndex) =>
        itemIndex === index ? { ...section, ...patch } : section
      ),
    });
  }

  async function uploadCommunicationImage(
    file: File | undefined,
    uploadKind: "header" | "thumbnail"
  ) {
    if (!file) return;

    const token = await getAccessToken();

    if (!token) {
      setMessage({ type: "error", text: "Admin session is no longer available." });
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("uploadKind", uploadKind);

    const response = await fetch("/api/admin/content/communications/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const result = (await response.json().catch(() => null)) as
      | { ok?: boolean; message?: string; upload?: { storagePath?: string } }
      | null;

    if (!response.ok || !result?.ok || !result.upload?.storagePath) {
      setMessage({
        type: "error",
        text: result?.message || "Communication image could not be uploaded.",
      });
      return;
    }

    if (uploadKind === "header") {
      setForm({
        ...form,
        headerImagePath: result.upload.storagePath,
        headerImageUrl: "",
        thumbnailImagePath: form.useHeaderAsThumbnail
          ? result.upload.storagePath
          : form.thumbnailImagePath,
      });
    } else {
      setForm({
        ...form,
        thumbnailImagePath: result.upload.storagePath,
        thumbnailImageUrl: "",
        useHeaderAsThumbnail: false,
      });
    }

    setMessage({ type: "success", text: "Image uploaded." });
  }

  return (
    <div className="admin-section-stack">
      {message && <div className={`admin-message ${message.type}`}>{message.text}</div>}
      <div className="admin-feature-grid-head">
        <div>
          <span className="card-label">Communications</span>
          <h2>Create and share messages, articles, announcements, and campaigns across the PeaceWorks community.</h2>
        </div>
        <p>
          Choose the communication format first, then select audience and
          distribution separately. Published Email and Both communications are
          submitted securely through Resend.
        </p>
      </div>

      <ContentLibraryTools
        search={query}
        status={status}
        searchLabel="Search communications"
        onSearch={setQuery}
        onStatusChange={(value) => setStatus(value as CommunicationStatus | "all")}
      />

      <section className="admin-content-editor">
        <div className="admin-content-editor-head">
          <div>
            <span className="card-label">Communication Record</span>
            <h3>{form.id ? "Edit communication" : "Create communication"}</h3>
          </div>
          {form.id && (
            <button className="admin-link-button" type="button" onClick={() => setForm(emptyForm)}>
              New Communication
            </button>
          )}
        </div>
        <CommunicationComposerBlock title="Choose a Format">
          <div className="admin-communication-format-grid">
            {formatOptions.map(([format, label]) => (
              <button
                key={format}
                className={`admin-content-card ${form.format === format ? "active" : ""}`}
                type="button"
                onClick={() => updateFormat(format)}
              >
                <strong>{label}</strong>
                <small>{getCommunicationFormatDescription(format)}</small>
              </button>
            ))}
          </div>
        </CommunicationComposerBlock>

        <CommunicationComposerBlock title="Compose">
          <div className="admin-content-form-grid">
            <ContentInput
              label={form.format === "announcement" ? "Headline" : "Title"}
              value={form.title}
              onChange={(title) => setForm({ ...form, title })}
            />
            {(form.format === "email" || form.format === "newsletter") && (
              <>
                <ContentInput
                  label="Subject"
                  value={form.subject}
                  onChange={(subject) => setForm({ ...form, subject })}
                />
                <ContentInput
                  label="Preview Text"
                  value={form.previewText}
                  onChange={(previewText) => setForm({ ...form, previewText })}
                />
              </>
            )}
            {showArticleFields && (
              <>
                <ContentInput
                  label="Author"
                  value={form.visibleAuthorName}
                  onChange={(visibleAuthorName) => setForm({ ...form, visibleAuthorName })}
                />
                <ContentInput
                  label="Category"
                  value={form.category}
                  onChange={(category) => setForm({ ...form, category })}
                />
                <ContentInput
                  label="Tags"
                  value={form.tags.join(", ")}
                  onChange={(value) => setForm({ ...form, tags: splitTags(value) })}
                />
              </>
            )}
            {showDashboardPresentation && (
              <ContentSelect
                label="Dashboard Presentation"
                value={form.dashboardPresentation}
                options={[
                  ["standard", "Standard"],
                  ["featured", "Featured"],
                  ["banner", "Banner"],
                ]}
                onChange={(dashboardPresentation) =>
                  setForm({ ...form, dashboardPresentation })
                }
              />
            )}
            <ContentTextarea
              label={form.format === "announcement" ? "Short Message" : "Summary"}
              value={form.summary}
              onChange={(summary) => setForm({ ...form, summary })}
            />
            <ContentTextarea
              label={form.format === "email" ? "Email Body" : "Body Content"}
              value={form.bodyContent}
              onChange={(bodyContent) => setForm({ ...form, bodyContent })}
            />
          </div>
        </CommunicationComposerBlock>

        {showNewsletterSections && (
          <CommunicationComposerBlock title="Newsletter Sections">
            <div className="admin-repeatable-list">
              {form.newsletterSections.map((section, index) => (
                <div className="admin-repeatable-row" key={index}>
                  <ContentInput
                    label="Section Heading"
                    value={section.heading}
                    onChange={(heading) => updateNewsletterSection(index, { heading })}
                  />
                  <ContentTextarea
                    label="Section Content"
                    value={section.bodyContent}
                    onChange={(bodyContent) =>
                      updateNewsletterSection(index, { bodyContent })
                    }
                  />
                  <button
                    className="admin-link-button"
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        newsletterSections: form.newsletterSections.filter(
                          (_, itemIndex) => itemIndex !== index
                        ),
                      })
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                className="admin-link-button"
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    newsletterSections: [
                      ...form.newsletterSections,
                      { heading: "", bodyContent: "", sortOrder: form.newsletterSections.length },
                    ],
                  })
                }
              >
                Add Section
              </button>
            </div>
          </CommunicationComposerBlock>
        )}

        {needsSender && (
          <CommunicationComposerBlock title="Sender">
            <div className="admin-content-form-grid">
              <ContentSelect
                label="From"
                value={form.senderId}
                options={[
                  ["", "Choose sender"],
                  ...senders.map((sender) => [
                    sender.id,
                    `${sender.displayName} (${sender.verifiedFromEmail})`,
                  ] as [string, string]),
                ]}
                onChange={(senderId) => {
                  const sender = senders.find((item) => item.id === senderId);
                  setForm({
                    ...form,
                    senderId,
                    replyToEmail: sender?.replyToEmail || "",
                  });
                }}
              />
              <ContentInput
                label="Reply-To"
                value={form.replyToEmail}
                onChange={(replyToEmail) => setForm({ ...form, replyToEmail })}
              />
            </div>
            {selectedSender && (
              <p className="admin-muted-copy">
                From address and Reply-To are stored separately for future email delivery.
              </p>
            )}
          </CommunicationComposerBlock>
        )}

        {showMedia && (
          <CommunicationComposerBlock title="Media">
            <div className="admin-content-form-grid">
              <label>
                <span>Header Image</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) =>
                    void uploadCommunicationImage(event.target.files?.[0], "header")
                  }
                />
              </label>
              <label>
                <span>Thumbnail</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) =>
                    void uploadCommunicationImage(event.target.files?.[0], "thumbnail")
                  }
                />
              </label>
              <ContentInput
                label="Image Alt Text"
                value={form.imageAltText}
                onChange={(imageAltText) => setForm({ ...form, imageAltText })}
              />
            </div>
            <div className="admin-content-actions">
              {form.headerImagePath && (
                <button
                  className="admin-link-button"
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      thumbnailImagePath: form.headerImagePath,
                      useHeaderAsThumbnail: true,
                    })
                  }
                >
                  Use Header Image as Thumbnail
                </button>
              )}
              {(form.headerImagePath || form.thumbnailImagePath) && (
                <button
                  className="admin-link-button"
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      headerImagePath: "",
                      headerImageUrl: "",
                      thumbnailImagePath: "",
                      thumbnailImageUrl: "",
                      useHeaderAsThumbnail: false,
                    })
                  }
                >
                  Remove Images
                </button>
              )}
            </div>
          </CommunicationComposerBlock>
        )}

        <CommunicationComposerBlock title="Links and Actions">
          <div className="admin-repeatable-list">
            {form.links.map((link, index) => (
              <div className="admin-repeatable-row" key={index}>
                <ContentInput
                  label="Link Label"
                  value={link.label}
                  onChange={(label) => updateLink(index, { label })}
                />
                <ContentInput
                  label="URL"
                  value={link.url}
                  onChange={(url) => updateLink(index, { url })}
                />
                <ContentSelect
                  label="Display Style"
                  value={link.linkStyle}
                  options={[
                    ["text", "Text"],
                    ["button", "Button"],
                    ["featured", "Featured"],
                  ]}
                  onChange={(linkStyle) => updateLink(index, { linkStyle })}
                />
                {link.url && (
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    Open Link
                  </a>
                )}
                <button
                  className="admin-link-button"
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      links: form.links.filter((_, itemIndex) => itemIndex !== index),
                    })
                  }
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              className="admin-link-button"
              type="button"
              onClick={() =>
                setForm({
                  ...form,
                  links: [
                    ...form.links,
                    { label: "", url: "", linkStyle: "text", sortOrder: form.links.length },
                  ],
                })
              }
            >
              Add Another Link
            </button>
          </div>
        </CommunicationComposerBlock>

        <CommunicationComposerBlock title="Audience">
          <div className="admin-content-form-grid">
            <ContentSelect
              label="Audience"
              value={form.audienceScope}
              options={getCommunicationAudienceOptions(form.format)}
              onChange={(audienceScope) => setForm({ ...form, audienceScope })}
            />
            {(requiresCircleTargets || requiresProfileTargets) && (
              <ContentInput
                label={requiresCircleTargets ? "Selected Circle IDs" : "Selected Profile IDs"}
                value={(requiresCircleTargets ? form.circleIds : form.profileIds).join(", ")}
                onChange={(value) =>
                  requiresCircleTargets
                    ? setForm({ ...form, circleIds: splitIds(value) })
                    : setForm({ ...form, profileIds: splitIds(value) })
                }
              />
            )}
            <ContentInput
              label="Visible From"
              value={form.visibleFrom}
              onChange={(visibleFrom) => setForm({ ...form, visibleFrom })}
            />
            <ContentInput
              label="Visible Until"
              value={form.visibleUntil}
              onChange={(visibleUntil) => setForm({ ...form, visibleUntil })}
            />
          </div>
        </CommunicationComposerBlock>

        <CommunicationComposerBlock title="Publish & Distribute">
          <div className="admin-checkbox-list">
            {compatibleChannels.map(([channel, label]) => (
              <CircleCheckboxRow
                key={channel}
                label={label}
                description={
                  channel === "email"
                    ? "Email will be submitted to eligible recipients when this Communication is published."
                    : channel === "my_dashboard"
                      ? "Site message will appear in the PeaceWorks portal when this Communication is published."
                      : "Create a reusable distribution placement for this Communication."
                }
                checked={form.channels.includes(channel)}
                onChange={() => toggleChannel(channel)}
              />
            ))}
          </div>
        </CommunicationComposerBlock>

        <CommunicationComposerBlock title="Add to Resource Library">
          <CircleCheckboxRow
            label="Add to Resource Library"
            description="Create a linked reusable Resource without duplicating the source Communication."
            checked={form.addToResourceLibrary}
            onChange={() =>
              setForm({ ...form, addToResourceLibrary: !form.addToResourceLibrary })
            }
          />
          {form.addToResourceLibrary && (
            <div className="admin-content-form-grid">
              <ContentInput
                label="Resource Title"
                value={form.resourceTitle || form.title}
                onChange={(resourceTitle) => setForm({ ...form, resourceTitle })}
              />
              <ContentTextarea
                label="Resource Summary"
                value={form.resourceSummary || form.summary}
                onChange={(resourceSummary) => setForm({ ...form, resourceSummary })}
              />
              <ContentSelect
                label="Resource Type"
                value={form.resourceType}
                options={[
                  ["article", "Article"],
                  ["blog", "Blog"],
                  ["reflection", "Reflection"],
                  ["guide", "Guide"],
                  ["other", "Other"],
                ]}
                onChange={(resourceType) => setForm({ ...form, resourceType })}
              />
              <ContentInput
                label="Category"
                value={form.resourceCategory || form.category}
                onChange={(resourceCategory) => setForm({ ...form, resourceCategory })}
              />
              <ContentInput
                label="Tags"
                value={(form.resourceTags.length ? form.resourceTags : form.tags).join(", ")}
                onChange={(value) => setForm({ ...form, resourceTags: splitTags(value) })}
              />
              <ContentSelect
                label="Publication Status"
                value={form.resourceStatus}
                options={[
                  ["draft", "Draft"],
                  ["published", "Published"],
                ]}
                onChange={(resourceStatus) => setForm({ ...form, resourceStatus })}
              />
            </div>
          )}
        </CommunicationComposerBlock>

        <CommunicationPreview communication={form} />

        <div className="admin-content-actions">
          <button className="btn btn-primary" type="button" onClick={saveCommunication}>
            Save Draft
          </button>
          {(form.format === "email" || form.channels.includes("email")) && (
            <button className="btn btn-secondary" type="button" onClick={sendTestEmail}>
              Send test email to me
            </button>
          )}
        </div>
      </section>

      {loadState === "loading" && <div className="admin-empty">Loading communications...</div>}
      {loadState === "error" && (
        <DashboardEmptyState
          title="Communications could not be loaded."
          description="Please check the communication setup and try again."
        />
      )}
      {loadState === "ready" && (
        <div className="admin-content-list">
          {filtered.length === 0 ? (
            <div className="admin-empty">No communications match this view.</div>
          ) : (
            filtered.map((communication) => (
              <ContentRecordCard
                key={communication.id}
                title={communication.title}
                detail={communication.summary || communication.bodyContent}
                status={communication.status}
                meta={[
                  communication.communicationType,
                  communication.channel,
                  communication.audienceScope,
                ]}
                onEdit={() =>
                  setForm({
                    id: communication.id,
                    title: communication.title,
                    format: communication.format,
                    subject: communication.subject,
                    previewText: communication.previewText,
                    summary: communication.summary,
                    bodyContent: communication.bodyContent,
                    communicationType: communication.communicationType,
                    channel: communication.channel,
                    dashboardPresentation: communication.dashboardPresentation,
                    audienceScope: communication.audienceScope,
                    senderId: communication.senderId,
                    replyToEmail: communication.replyToEmail,
                    visibleAuthorName: communication.visibleAuthorName,
                    headerImagePath: communication.headerImagePath,
                    headerImageUrl: communication.headerImageUrl,
                    thumbnailImagePath: communication.thumbnailImagePath,
                    thumbnailImageUrl: communication.thumbnailImageUrl,
                    useHeaderAsThumbnail:
                      communication.thumbnailImagePath === communication.headerImagePath,
                    imageAltText: communication.imageAltText,
                    category: communication.category,
                    tags: communication.tags,
                    visibleFrom: communication.visibleFrom || "",
                    visibleUntil: communication.visibleUntil || "",
                    links: communication.links.map((link) => ({
                      label: link.label,
                      url: link.url,
                      linkStyle: link.linkStyle,
                      sortOrder: link.sortOrder,
                    })),
                    channels: communication.channels,
                    circleIds: communication.audienceTargets
                      .map((target) => target.circleId)
                      .filter(Boolean),
                    profileIds: communication.audienceTargets
                      .map((target) => target.profileId)
                      .filter(Boolean),
                    newsletterSections: communication.newsletterSections.map((section) => ({
                      heading: section.heading,
                      bodyContent: section.bodyContent,
                      sortOrder: section.sortOrder,
                    })),
                    addToResourceLibrary: Boolean(communication.resourceId),
                    resourceTitle: communication.title,
                    resourceSummary: communication.summary,
                    resourceType: "article",
                    resourceCategory: communication.category,
                    resourceTags: communication.tags,
                    resourceStatus: "draft",
                  })
                }
                onStatus={(nextStatus) =>
                  updateContentStatus(
                    `/api/admin/content/communications/${communication.id}`,
                    nextStatus,
                    setMessage,
                    loadCommunications
                  )
                }
                onDelete={() =>
                  deleteContentRecord(
                    `/api/admin/content/communications/${communication.id}`,
                    "Delete this communication?",
                    setMessage,
                    loadCommunications
                  )
                }
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function CommunicationComposerBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="admin-communication-block">
      <h4>{title}</h4>
      {children}
    </section>
  );
}

function CommunicationPreview({
  communication,
}: {
  communication: {
    format: CommunicationFormat;
    title: string;
    subject: string;
    previewText: string;
    summary: string;
    bodyContent: string;
    senderId: string;
    visibleAuthorName: string;
    links: Array<{ label: string; url: string; linkStyle: string }>;
    channels: string[];
    addToResourceLibrary: boolean;
  };
}) {
  return (
    <CommunicationComposerBlock title="Preview Communication">
      <div className="admin-communication-preview-grid">
        {communication.channels.includes("email") && (
          <article className="admin-communication-preview">
            <span>Email Preview</span>
            <h4>{communication.subject || communication.title || "Subject"}</h4>
            <p>{communication.previewText || "Preview text will appear here."}</p>
            <div>{communication.bodyContent || communication.summary || "Email body preview"}</div>
          </article>
        )}
        {communication.channels.some((channel) => channel.includes("dashboard")) && (
          <article className="admin-communication-preview">
            <span>Dashboard Card Preview</span>
            <h4>{communication.title || "Dashboard title"}</h4>
            <p>{communication.summary || "Dashboard summary will appear here."}</p>
          </article>
        )}
        {communication.format === "blog_article" && (
          <article className="admin-communication-preview">
            <span>Dashboard Article Preview</span>
            <h4>{communication.title || "Article title"}</h4>
            <p>{communication.visibleAuthorName || "Author"}</p>
            <div>{communication.bodyContent || "Article body preview"}</div>
          </article>
        )}
        {communication.addToResourceLibrary && (
          <article className="admin-communication-preview">
            <span>Resource Card Preview</span>
            <h4>{communication.title || "Resource title"}</h4>
            <p>{communication.summary || "Resource summary will appear here."}</p>
          </article>
        )}
        {communication.links.length > 0 && (
          <div className="admin-communication-preview-links">
            {communication.links
              .filter((link) => link.url)
              .map((link, index) => (
                <a
                  key={`${link.url}-${index}`}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.label || link.url}
                </a>
              ))}
          </div>
        )}
      </div>
    </CommunicationComposerBlock>
  );
}

function ContentAssignmentPanel({
  content,
  assignments,
  usersPayload,
  onClose,
  onMessage,
  onRefresh,
}: {
  content: {
    id: string;
    title: string;
    type: AssignmentContentType;
    status: ContentStatus;
  };
  assignments: AdminContentAssignment[];
  usersPayload: AdminUsersPayload;
  onClose: () => void;
  onMessage: (message: ContentMessage) => void;
  onRefresh: () => Promise<void>;
}) {
  const [audienceType, setAudienceType] =
    useState<AssignmentAudienceType>("coach_library");
  const [placement, setPlacement] = useState<AssignmentPlacement>(
    getDefaultPlacement(content.type, "coach_library")
  );
  const [circleIds, setCircleIds] = useState<string[]>([]);
  const [profileIds, setProfileIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [visibleFrom, setVisibleFrom] = useState("");
  const [visibleUntil, setVisibleUntil] = useState("");
  const activeCircles = usersPayload.circles.filter(
    (circle) => circle.status === "active"
  );
  const activeProfiles = usersPayload.users.filter(
    (user) => user.accountStatus === "active"
  );
  const targetProfiles =
    audienceType === "selected_coach"
      ? activeProfiles.filter((user) => user.roles.includes("coach"))
      : activeProfiles;
  const targetQuery = search.trim().toLowerCase();
  const visibleProfiles = targetProfiles.filter((user) =>
    [
      formatManagedUserName(user),
      user.email,
      user.organization,
      user.roles.join(" "),
    ]
      .join(" ")
      .toLowerCase()
      .includes(targetQuery)
  );
  const visibleCircles = activeCircles.filter((circle) =>
    circle.name.toLowerCase().includes(targetQuery)
  );
  const validPlacements = getValidAssignmentPlacements(content.type, audienceType);
  const needsCircles = audienceType === "selected_circle";
  const needsProfiles =
    audienceType === "selected_member" || audienceType === "selected_coach";

  async function assignContent() {
    const result = await adminContentRequest("/api/admin/content/assignments", {
      method: "POST",
      body: {
        contentType: content.type,
        contentId: content.id,
        audienceType,
        placement,
        circleIds,
        profileIds,
        visibleFrom,
        visibleUntil,
      },
    });

    if (!result.ok) {
      onMessage({ type: "error", text: result.message });
      return;
    }

    onMessage({
      type: "success",
      text:
        audienceType === "selected_member"
          ? "Content assignment was saved. This will appear on the selected member’s My Dashboard."
          : audienceType === "selected_circle" || audienceType === "all_circle_members"
            ? "Content assignment was saved. This will appear on the dashboards of eligible active Circle members."
            : audienceType === "all_members"
              ? "Content assignment was saved. This will appear on eligible members’ My Dashboards."
              : "Content assignment was saved.",
    });
    await onRefresh();
  }

  async function unassignContent(assignmentId: string) {
    const result = await adminContentRequest(
      `/api/admin/content/assignments/${assignmentId}`,
      {
        method: "PATCH",
      }
    );

    if (!result.ok) {
      onMessage({ type: "error", text: result.message });
      return;
    }

    onMessage({ type: "success", text: "Content was unassigned from this audience." });
    showFeedback({
      kind: "success",
      message: "Content unassigned from this audience.",
      actionLabel: "Undo",
      onAction: async () => {
        const restored = await adminContentRequest(
          `/api/admin/content/assignments/${assignmentId}/restore`,
          { method: "POST" }
        );
        if (!restored.ok) throw new Error(restored.message);
        await onRefresh();
      },
    });
    await onRefresh();
  }

  async function restoreAssignment(assignmentId: string) {
    const result = await adminContentRequest(
      `/api/admin/content/assignments/${assignmentId}/restore`,
      {
        method: "POST",
      }
    );

    if (!result.ok) {
      onMessage({ type: "error", text: result.message });
      return;
    }

    onMessage({ type: "success", text: "Content assignment was restored." });
    await onRefresh();
  }

  function duplicateAssignment(assignment: AdminContentAssignment) {
    setAudienceType(assignment.audienceType);
    setPlacement(assignment.placement);
    setCircleIds(assignment.circleId ? [assignment.circleId] : []);
    setProfileIds(assignment.profileId ? [assignment.profileId] : []);
    setVisibleFrom(assignment.visibleFrom || "");
    setVisibleUntil(assignment.visibleUntil || "");
    onMessage({
      type: "success",
      text: "Assignment settings copied. Adjust the target or dates, then assign content.",
    });
  }

  function toggleValue(values: string[], value: string, setter: (next: string[]) => void) {
    setter(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  }

  return (
    <section className="admin-content-assignment-panel">
      <div className="admin-content-editor-head">
        <div>
          <span className="card-label">Assign Content</span>
          <h3>{content.title}</h3>
          <p>Choose who receives this content and where it should appear.</p>
        </div>
        <button className="admin-link-button" type="button" onClick={onClose}>
          Close
        </button>
      </div>

      {["all_members", "all_circle_members", "selected_member", "selected_circle"].includes(
        audienceType
      ) && (
        <p className="admin-form-help">
          This assignment will appear on eligible members’ My Dashboards while it is
          active, published, and within its visibility window.
        </p>
      )}

      {content.status !== "published" ? (
        <div className="admin-empty">Publish this content before assigning it.</div>
      ) : (
        <>
          <div className="admin-content-form-grid">
            <ContentSelect
              label="Who should receive this?"
              value={audienceType}
              options={getAudienceOptions(content.type)}
              onChange={(value) => {
                const nextAudience = value as AssignmentAudienceType;
                setAudienceType(nextAudience);
                setCircleIds([]);
                setProfileIds([]);
                const nextPlacement = getDefaultPlacement(content.type, nextAudience);
                setPlacement(nextPlacement);
              }}
            />
            <ContentSelect
              label="Where should this appear?"
              value={placement}
              options={validPlacements.map((item) => [item, formatPlacement(item)])}
              onChange={(value) => setPlacement(value as AssignmentPlacement)}
            />
            <ContentInput
              label="Start Date"
              value={visibleFrom}
              onChange={setVisibleFrom}
            />
            <ContentInput
              label="Optional End Date"
              value={visibleUntil}
              onChange={setVisibleUntil}
            />
          </div>

          {(needsCircles || needsProfiles) && (
            <div className="admin-assignment-selector">
              <div className="admin-table-tools">
                <label>
                  <span>Search Targets</span>
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by name, email, Circle, or role"
                  />
                </label>
                {needsCircles && (
                  <div className="admin-content-actions">
                    <button className="admin-link-button" type="button" onClick={() => setCircleIds(activeCircles.map((circle) => circle.id))}>
                      Select All
                    </button>
                    <button className="admin-link-button" type="button" onClick={() => setCircleIds([])}>
                      Clear Selection
                    </button>
                  </div>
                )}
              </div>

              <div className="admin-checkbox-list">
                {needsCircles &&
                  visibleCircles.map((circle) => (
                    <CircleCheckboxRow
                      key={circle.id}
                      label={circle.name}
                      description={`${circle.status} Circle`}
                      checked={circleIds.includes(circle.id)}
                      onChange={() => toggleValue(circleIds, circle.id, setCircleIds)}
                    />
                  ))}
                {needsProfiles &&
                  visibleProfiles.slice(0, 80).map((profile) => (
                    <CircleCheckboxRow
                      key={profile.id}
                      label={formatManagedUserName(profile)}
                      description={[
                        profile.email,
                        profile.organization,
                        profile.roles.map(formatRoleName).join(", "),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                      checked={profileIds.includes(profile.id)}
                      onChange={() => toggleValue(profileIds, profile.id, setProfileIds)}
                    />
                  ))}
              </div>

              <p className="admin-assignment-count">
                {needsCircles
                  ? `${circleIds.length} Circle${circleIds.length === 1 ? "" : "s"} selected`
                  : `${profileIds.length} person${profileIds.length === 1 ? "" : "s"} selected`}
              </p>
            </div>
          )}

          <button className="btn btn-primary" type="button" onClick={assignContent}>
            Assign Content
          </button>
        </>
      )}

      <AssignmentSummary
        assignments={assignments}
        detailed
        onArchive={unassignContent}
        onDuplicate={duplicateAssignment}
        onRestore={restoreAssignment}
      />
    </section>
  );
}

function AssignmentSummary({
  assignments,
  detailed = false,
  onArchive,
  onDuplicate,
  onRestore,
}: {
  assignments: AdminContentAssignment[];
  detailed?: boolean;
  onArchive?: (assignmentId: string) => void;
  onDuplicate?: (assignment: AdminContentAssignment) => void;
  onRestore?: (assignmentId: string) => void;
}) {
  const activeAssignments = assignments.filter(
    (assignment) => assignment.assignmentStatus === "active"
  );

  if (assignments.length === 0) {
    return detailed ? (
      <div className="admin-empty">No current assignments.</div>
    ) : null;
  }

  return (
    <div className="admin-assignment-summary">
      <strong>Current Assignments</strong>
      <div>
        {assignments.slice(0, detailed ? 100 : 3).map((assignment) => (
          <span key={assignment.id}>
            <span>
              {formatAudienceType(assignment.audienceType)} ·{" "}
              {formatPlacement(assignment.placement)} ·{" "}
              {formatAssignmentStatus(assignment.assignmentStatus)}
            </span>
            {detailed && (onArchive || onDuplicate || onRestore) && (
              <span className="admin-assignment-actions">
                {assignment.assignmentStatus === "active" && onArchive && (
                  <button
                    className="admin-link-button"
                    type="button"
                    onClick={() => onArchive(assignment.id)}
                  >
                    Unassign
                  </button>
                )}
                {onDuplicate && (
                  <button
                    className="admin-link-button"
                    type="button"
                    onClick={() => onDuplicate(assignment)}
                  >
                    Duplicate
                  </button>
                )}
                {assignment.assignmentStatus === "archived" && onRestore && (
                  <button
                    className="admin-link-button"
                    type="button"
                    onClick={() => onRestore(assignment.id)}
                  >
                    Restore
                  </button>
                )}
              </span>
            )}
          </span>
        ))}
      </div>
      {!detailed && assignments.length > 3 && <small>{assignments.length - 3} more</small>}
      {detailed && <small>{activeAssignments.length} active assignment{activeAssignments.length === 1 ? "" : "s"}</small>}
    </div>
  );
}

function ContentRecordLibrary({
  title,
  subtitle,
  search,
  status,
  form,
  children,
  onSearch,
  onStatusChange,
  onSave,
}: {
  title: string;
  subtitle: string;
  search: string;
  status: ContentStatus | "all";
  form: ReactNode;
  children: ReactNode;
  onSearch: (value: string) => void;
  onStatusChange: (value: ContentStatus | "all") => void;
  onSave: () => void;
}) {
  return (
    <div className="admin-content-workspace">
      <ContentLibraryTools
        search={search}
        status={status}
        searchLabel={`Search ${title.toLowerCase()}`}
        onSearch={onSearch}
        onStatusChange={onStatusChange}
      />
      <section className="admin-content-editor">
        <div className="admin-content-editor-head">
          <div>
            <span className="card-label">{title}</span>
            <h3>{subtitle}</h3>
          </div>
        </div>
        <div className="admin-content-form-grid">{form}</div>
        <button className="btn btn-primary" type="button" onClick={onSave}>
          Save
        </button>
      </section>
      <div className="admin-content-list">{children}</div>
    </div>
  );
}

function ContentRecordCard({
  title,
  detail,
  status,
  meta,
  externalUrl,
  fileOpenEndpoint,
  coverImageUrl,
  assignments = [],
  resourceTile = false,
  selected = false,
  onEdit,
  onStatus,
  onDuplicate,
  onAssign,
  onDelete,
}: {
  title: string;
  detail: string;
  status: ContentStatus;
  meta: string[];
  externalUrl?: string;
  fileOpenEndpoint?: string;
  coverImageUrl?: string;
  assignments?: AdminContentAssignment[];
  resourceTile?: boolean;
  selected?: boolean;
  onEdit: () => void;
  onStatus: (status: ContentStatus) => void;
  onDuplicate?: () => void;
  onAssign?: () => void;
  onDelete: () => void;
}) {
  async function openStoredResource() {
    if (!fileOpenEndpoint) return;

    const result = await adminContentRequest(fileOpenEndpoint, { method: "POST" });

    if (!result.ok || !("url" in result)) return;

    window.open(result.url, "_blank", "noopener,noreferrer");
  }

  return (
    <article className={`admin-content-item${resourceTile ? " admin-resource-tile" : ""}${selected ? " is-selected" : ""}`}>
      <div
        className="admin-resource-cover"
        aria-hidden="true"
        style={coverImageUrl ? { backgroundImage: `url(${coverImageUrl})` } : undefined}
      >
        {!coverImageUrl && (
          <FileText size={24} strokeWidth={1.8} />
        )}
      </div>
      <div>
        <span>{formatContentStatus(status)}</span>
        <h3>{title}</h3>
        <p>{detail || "No description yet."}</p>
        <small>{meta.filter(Boolean).join(" · ") || "No category"}</small>
      </div>
      <div className="admin-content-actions">
        {externalUrl && (
          <a className="admin-link-button" href={externalUrl} target="_blank" rel="noopener noreferrer">
            <Eye size={15} /> Open
          </a>
        )}
        {fileOpenEndpoint && (
          <button className="admin-link-button" type="button" onClick={openStoredResource}>
            <Eye size={15} /> Open File
          </button>
        )}
        <button className="admin-link-button" type="button" onClick={onEdit}>
          <FileText size={15} /> Edit
        </button>
        {onDuplicate && (
          <button className="admin-link-button" type="button" onClick={onDuplicate}>
            <Copy size={15} /> Duplicate
          </button>
        )}
        {status !== "published" && (
          <button className="admin-link-button" type="button" onClick={() => onStatus("published")}>
            <CheckCircle size={15} /> Publish
          </button>
        )}
        {status !== "archived" && (
          <button className="admin-link-button" type="button" onClick={() => onStatus("archived")}>
            <Archive size={15} /> Archive
          </button>
        )}
        {status === "published" && onAssign && (
          <button className="admin-link-button" type="button" onClick={onAssign}>
            <Compass size={15} /> Assign Content
          </button>
        )}
        <button className="admin-link-button danger" type="button" onClick={onDelete}>
          <Trash2 size={15} /> Delete
        </button>
      </div>
      <AssignmentSummary assignments={assignments} />
    </article>
  );
}

function ContentLibraryTools({
  search,
  status,
  searchLabel,
  onSearch,
  onStatusChange,
}: {
  search: string;
  status: ContentStatus | "all";
  searchLabel: string;
  onSearch: (value: string) => void;
  onStatusChange: (value: ContentStatus | "all") => void;
}) {
  return (
    <div className="admin-table-tools">
      <label>
        <span>{searchLabel}</span>
        <input
          type="search"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search by title, category, or text"
        />
      </label>
      <label>
        <span>Status</span>
        <select
          value={status}
          onChange={(event) => onStatusChange(event.target.value as ContentStatus | "all")}
        >
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </label>
    </div>
  );
}

function ContentInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function ContentSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<[string, string]>;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function ContentTextarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span>{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

async function updateContentStatus(
  url: string,
  status: ContentStatus,
  onMessage: (message: ContentMessage) => void,
  onRefresh: () => Promise<void>
) {
  const result = await adminContentRequest(url, {
    method: "PATCH",
    body: { status },
  });

  if (!result.ok) {
    onMessage({ type: "error", text: result.message });
    return;
  }

  onMessage({
    type: "success",
    text:
      url.includes("/communications/") && status === "published"
        ? result.message || "Communication was published."
        : "Library item was updated.",
  });
  await onRefresh();
}

async function duplicateContentRecord(
  url: string,
  onMessage: (message: ContentMessage) => void,
  onRefresh: () => Promise<void>
) {
  const result = await adminContentRequest(url, { method: "POST" });

  if (!result.ok) {
    onMessage({ type: "error", text: result.message });
    return;
  }

  onMessage({ type: "success", text: "Library item was duplicated as a draft." });
  await onRefresh();
}

async function deleteContentRecord(
  url: string,
  confirmation: string,
  onMessage: (message: ContentMessage) => void,
  onRefresh: () => Promise<void>
) {
  const itemType = confirmation.toLowerCase().includes("resource")
    ? "Resource"
    : confirmation.toLowerCase().includes("training")
      ? "Training"
      : "Communication";
  const confirmed = await requestConfirmation({
    title: `Delete this ${itemType.toLowerCase()} for everyone?`,
    description: `This permanently deletes the shared ${itemType.toLowerCase()} and cannot be undone.`,
    confirmLabel: `Delete ${itemType}`,
    tone: "danger",
  });
  if (!confirmed) return;

  const result = await adminContentRequest(url, { method: "DELETE" });

  if (!result.ok) {
    onMessage({ type: "error", text: result.message });
    return;
  }

  onMessage({ type: "success", text: "Library item was deleted." });
  await onRefresh();
}

async function adminContentRequest(
  url: string,
  options: { method: string; body?: unknown }
): Promise<
  | { ok: true; url?: string; message?: string }
  | { ok: false; message: string }
> {
  const token = await getAccessToken();

  if (!token) return { ok: false, message: "Admin session is no longer available." };

  const response = await fetch(url, {
    method: options.method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const result = (await response.json().catch(() => null)) as
    | { ok?: boolean; message?: string; url?: string }
    | null;

  if (!response.ok || !result?.ok) {
    return {
      ok: false,
      message: result?.message || "The request could not be completed.",
    };
  }

  return {
    ok: true,
    url: typeof result.url === "string" ? result.url : undefined,
    message: typeof result.message === "string" ? result.message : undefined,
  };
}

function ReportsSection({
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
      <VisualDiagnosticsDashboard operations={operations} />
      <NeedsAttention alerts={operations.alerts} onJump={onJump} />
      <AdminOverview operations={operations} />
      <DiagnosticsList
        title="Operational diagnostics"
        items={[
          ["Profiles without member role", operations.diagnostics.missingMemberRole],
          ["circle_member role without active Circle", operations.diagnostics.circleRoleNoMembership],
          ["Active Circle membership without circle_member role", operations.diagnostics.membershipNoCircleRole],
          ["Incomplete profiles", operations.diagnostics.incompleteProfiles],
          ["Coaches without an active coaching relationship", operations.diagnostics.coachesWithoutActiveRelationship],
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
  id: SectionId;
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
  coachesWithoutActiveRelationship: AdminManagedProfile[];
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
      diagnostics.coachesWithoutActiveRelationship.length,
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
      icon: UserRound,
      title: "People & Access",
      description: "Manage profiles, roles, Circle placement, and coaching relationships.",
      metrics: [
        `${operations.metrics.activeUsers} active profiles`,
        `${operations.metrics.activeCoaches} coaches`,
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
      id: "coaches",
      icon: Compass,
      title: "Coaches",
      description: "See coaching teams, shared Circle caseloads, and direct assignments.",
      metrics: [
        `${operations.metrics.totalCircleCoaches} Circle coaches`,
        `${operations.metrics.sharedCircleMembers} shared members`,
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
      id: "content-studio",
      icon: FileText,
      title: "Content Studio",
      description: "Create monthly questions, resources, and trainings.",
      metrics: ["Monthly questions", "Resources + trainings"],
    },
    {
      id: "communications",
      icon: Mail,
      title: "Communications",
      description: "Create messages, announcements, and campaigns.",
      metrics: ["Draft + publish", "Dashboard/email model"],
    },
    {
      id: "reports",
      icon: Activity,
      title: "Reports",
      description: "Review data alignment, incomplete records, and operational health.",
      metrics: [`${operations.alerts.length} alerts`, `${operations.metrics.activeUsers} active users`],
    },
    {
      id: "system-settings",
      icon: Settings,
      title: "System Settings",
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
    coachesWithoutActiveRelationship: coaches.filter((coach) => {
      const coachesActiveCircle = activeCircles.some((circle) =>
        circle.coachIds.includes(coach.id)
      );
      const hasDirectMember = users.some(
        (user) => user.id !== coach.id && user.coachIds.includes(coach.id)
      );

      return !coachesActiveCircle && !hasDirectMember;
    }),
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
      section: "coaches",
    },
    {
      key: "circles-without-active-coach",
      label: "Circles without an active coach",
      count: diagnostics.circlesWithoutActiveCoach.length,
      section: "circles",
    },
    {
      key: "coaches-without-relationships",
      label: "Coaches without an active coaching relationship",
      count: diagnostics.coachesWithoutActiveRelationship.length,
      section: "coaches",
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
  const roles = ["member", "circle_member", "coach", "project_manager", "admin"] as const;

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

function normalizeSectionId(value: string | null): SectionId | null {
  const legacyMap: Record<string, SectionId> = {
    overview: "reports",
    coaching: "coaches",
    content: "content-studio",
    communications: "content-studio",
    diagnostics: "reports",
    settings: "system-settings",
  };
  const normalized = (value || "").trim();
  const candidate = legacyMap[normalized] || normalized;

  return sections.some((section) => section.id === candidate)
    ? (candidate as SectionId)
    : null;
}

function formatContentStatus(status: ContentStatus) {
  if (status === "published") return "Published";
  if (status === "archived") return "Archived";

  return "Draft";
}

function getCommunicationFormatDescription(format: CommunicationFormat) {
  const descriptions: Record<CommunicationFormat, string> = {
    email: "Subject, preview text, sender, and email body.",
    blog_article: "Article title, author, category, tags, and body.",
    announcement: "Short message with optional image and display style.",
    newsletter: "Sender, subject, intro, and repeatable sections.",
    dashboard_message: "Dashboard card or featured message.",
    circle_update: "Update for selected Circle dashboards.",
  };

  return descriptions[format];
}

function getDefaultCommunicationChannels(format: CommunicationFormat) {
  if (format === "email" || format === "newsletter") return ["email"];
  if (format === "circle_update") return ["circle_dashboards"];

  return ["my_dashboard"];
}

function getCommunicationChannelOptions(format: CommunicationFormat): Array<[string, string]> {
  const email: Array<[string, string]> = [["email", "Email"]];
  const dashboard: Array<[string, string]> = [
    ["my_dashboard", "PeaceWorks Site Message"],
  ];
  const circle: Array<[string, string]> = [["circle_dashboards", "Selected Circle Dashboards"]];
  const coach: Array<[string, string]> = [["coach_dashboards", "Coach Dashboards"]];

  if (format === "email") return [...email, ...dashboard];
  if (format === "newsletter") return [...email, ...dashboard];
  if (format === "blog_article") return [...dashboard, ...circle, ...coach, ...email];
  if (format === "announcement") return [...dashboard, ...circle, ...coach, ...email];
  if (format === "circle_update") return [...circle, ...dashboard, ...email];

  return [...dashboard, ...circle, ...coach];
}

function getCommunicationAudienceOptions(format: CommunicationFormat): Array<[string, string]> {
  const base: Array<[string, string]> = [
    ["all_members", "All Members"],
    ["all_circle_members", "All Circle Members"],
    ["all_coaches", "All Coaches"],
    ["selected_circles", "Selected Circles"],
    ["selected_members", "Selected Members"],
    ["selected_coaches", "Selected Coaches"],
    ["admins", "Admins"],
  ];

  if (format === "circle_update") {
    return [["selected_circles", "Selected Circles"]];
  }

  return base;
}

function splitTags(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitIds(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatAssignmentStatus(status: AdminContentAssignment["assignmentStatus"]) {
  if (status === "archived") return "Archived";

  return "Active";
}

function getAudienceOptions(contentType: AssignmentContentType): Array<[string, string]> {
  const common: Array<[string, string]> = [
    ["coach_library", "Available to Coaches"],
    ["selected_circle", "Assign to Circles"],
    ["selected_member", "Assign to Members"],
    ["all_coaches", "All Coaches"],
    ["selected_coach", "Selected Coaches"],
  ];

  if (contentType === "monthly_question") return common;

  return [
    ...common,
    ["all_members", "All Members"],
    ["all_circle_members", "All Circle Members"],
  ];
}

function getValidAssignmentPlacements(
  contentType: AssignmentContentType,
  audienceType?: AssignmentAudienceType
): AssignmentPlacement[] {
  if (audienceType === "coach_library") {
    return ["coach_dashboard_library"];
  }

  if (audienceType === "selected_circle") {
    if (contentType === "monthly_question") return ["circle_dashboard"];
    if (contentType === "training") return ["trainings_area", "featured_dashboard"];

    return ["resources_area", "featured_dashboard"];
  }

  if (contentType === "monthly_question") {
    return ["my_dashboard", "coach_dashboard_library", "circle_dashboard"];
  }

  if (contentType === "training") {
    return ["my_dashboard", "trainings_area", "featured_dashboard", "coach_dashboard_library"];
  }

  return ["my_dashboard", "resources_area", "featured_dashboard", "coach_dashboard_library"];
}

function getDefaultPlacement(
  contentType: AssignmentContentType,
  audienceType: AssignmentAudienceType
): AssignmentPlacement {
  if (audienceType === "coach_library") return "coach_dashboard_library";
  if (contentType === "monthly_question" && audienceType === "selected_circle") return "circle_dashboard";
  if (contentType === "training") return "trainings_area";
  if (contentType === "resource") return "resources_area";

  return "my_dashboard";
}

function formatAudienceType(audienceType: AssignmentAudienceType) {
  const labels: Record<AssignmentAudienceType, string> = {
    coach_library: "Available to Coaches",
    all_members: "All Members",
    all_circle_members: "All Circle Members",
    all_coaches: "All Coaches",
    selected_circle: "Selected Circles",
    selected_member: "Selected Members",
    selected_coach: "Selected Coaches",
  };

  return labels[audienceType];
}

function formatPlacement(placement: AssignmentPlacement) {
  const labels: Record<AssignmentPlacement, string> = {
    my_dashboard: "My Dashboard",
    coach_dashboard_library: "Coach Dashboard Library",
    circle_dashboard: "Circle Dashboard",
    resources_area: "Resources Area",
    trainings_area: "Trainings Area",
    featured_dashboard: "Featured Dashboard",
  };

  return labels[placement];
}

function isUploadedResourceType(resourceType: string) {
  return ["pdf", "image", "document", "worksheet", "guide", "downloadable_tool"].includes(resourceType);
}

function formatResourceTypeSection(resourceType: string) {
  const labels: Record<string, string> = {
    video: "Videos",
    audio: "Podcasts & Audio",
    article: "Articles",
    blog: "Blogs",
    reflection: "Reflections",
    case_study: "Case Studies",
    downloadable_tool: "Downloadable Tools",
    worksheet: "Worksheets",
    guide: "Guides",
    pdf: "PDFs",
    document: "Documents",
    image: "Images",
    link: "Links",
    other: "Other",
    uncategorized: "Uncategorized",
  };

  return labels[resourceType] || resourceType.replaceAll("_", " ");
}

function isWrittenResourceType(resourceType: string) {
  return ["article", "blog", "reflection", "case_study"].includes(resourceType);
}

function getPrimaryUploadLabel(resourceType: string) {
  if (resourceType === "pdf") return "PDF File";
  if (resourceType === "image") return "Image File";
  if (resourceType === "worksheet") return "Worksheet File";
  if (resourceType === "guide") return "Guide File";
  if (resourceType === "downloadable_tool") return "Downloadable Tool File";

  return "Document File";
}

function getResourceFileAccept(resourceType: string) {
  if (resourceType === "pdf") return "application/pdf,.pdf";
  if (resourceType === "image") return "image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp";

  return ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
}

function formatFileSize(value: number | null) {
  if (!value) return "Size unavailable";

  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
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
