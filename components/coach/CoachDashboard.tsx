"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode, RefObject } from "react";
import {
  BookOpen,
  ChevronDown,
  ClipboardCheck,
  ExternalLink,
  FileText,
  GraduationCap,
  MessageCircle,
  Plus,
  Search,
  Target,
  Trash2,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import ResultModal from "../assessment/ResultModal";
import { requestConfirmation, showFeedback } from "../ui/FeedbackCenter";
import { supabase } from "../../lib/supabase";
import { routes } from "../../lib/navigation";
import type { PeaceAssessmentResult } from "../../lib/peaceAssessmentScoring";
import type {
  CoachCircleMemberCard,
  CoachCircleNote,
  CoachCircleNoteLink,
  CoachCirclePayload,
  CoachGrowthStatus,
  CoachProfileNote,
  CoachMemberPayload,
  CoachOverviewPayload,
  CoachRatio,
} from "../../lib/coach/dashboard";
import type {
  CoachMonthlyQuestionAssignment,
  CoachMonthlyQuestionAssignmentInput,
  CoachMonthlyQuestion,
  CoachMonthlyQuestionsPayload,
} from "../../lib/coach/monthlyQuestions";
import {
  formatMonthlyQuestionPeriod,
  monthlyQuestionMonths,
} from "../../lib/monthlyQuestionPeriod";
import type {
  CoachResource,
  CoachResourceAssignment,
  CoachResourcesPayload,
} from "../../lib/coach/resources";

type LoadState = "loading" | "ready" | "denied" | "error";
type CoachWorkspaceId =
  | "members"
  | "assessments"
  | "progress"
  | "circle-notes"
  | "monthly-questions"
  | "resources"
  | "trainings"
  | "messages";

const coachWorkspaceIds: CoachWorkspaceId[] = [
  "members",
  "assessments",
  "progress",
  "circle-notes",
  "monthly-questions",
  "resources",
  "trainings",
  "messages",
];

type CoachApiError = {
  ok: false;
  error?: string;
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

type CoachApiErrorSnapshot = {
  url: string;
  method: string;
  status: number;
  statusText: string;
  rawText: string;
  json: CoachApiError | null;
};

type CircleNoteFormState = {
  noteType: string;
  body: string;
  visibility: string;
  audienceType: string;
  recipientIds: string[];
  links: CircleNoteLinkFormState[];
  meetingDate: string;
  followUpAt: string;
};

type CircleNoteLinkFormState = {
  id?: string;
  label: string;
  url: string;
  sortOrder: number;
};

type ProfileNoteFormState = {
  noteType: string;
  body: string;
  visibility: string;
};

type GrowthFormState = {
  processStage: string;
  engagementStatus: string;
  currentFocus: string;
  nextStep: string;
  lastContactAt: string;
  nextFollowUpAt: string;
  followUpStatus: string;
  followUpCompletedAt: string;
  growthSummary: string;
  supportNeeds: string;
};

type MonthlyQuestionFormState = CoachMonthlyQuestionAssignmentInput;
type ResourceAssignmentFormState = {
  resourceId: string;
  audienceType: "circle" | "members";
  memberIds: string[];
};
type CoachAssessmentTypeId = "peace-assessment";

type CoachAssessmentTypeConfig = {
  id: CoachAssessmentTypeId;
  name: string;
  description: string;
};

type CoachAssessmentTypeSummary = {
  config: CoachAssessmentTypeConfig;
  isAvailable: boolean;
  totalMembers: number;
  completedMembers: CoachCircleMemberCard[];
  inProgressMembers: CoachCircleMemberCard[];
  notStartedMembers: CoachCircleMemberCard[];
  completionPercentage: number;
  latestCompletionDate: string | null;
};

const circleNoteTypeOptions = [
  { value: "general", label: "General" },
  { value: "meeting_recap", label: "Meeting Recap" },
  { value: "group_dynamics", label: "Group Dynamics" },
  { value: "facilitation", label: "Facilitation" },
  { value: "follow_up", label: "Follow-up" },
  { value: "care", label: "Care" },
  { value: "prayer", label: "Prayer" },
  { value: "administrative", label: "Administrative" },
];

const profileNoteTypeOptions = [
  { value: "general", label: "General" },
  { value: "coaching", label: "Coaching" },
  { value: "growth", label: "Growth" },
  { value: "follow_up", label: "Follow-up" },
  { value: "care", label: "Care" },
  { value: "assessment", label: "Assessment" },
  { value: "prayer", label: "Prayer" },
];

const circleNoteFilterOptions = circleNoteTypeOptions;
const profileNoteFilterOptions = profileNoteTypeOptions;
const circleAudienceOptions = [
  { value: "all_circle_members", label: "All Circle Members" },
  { value: "selected_members", label: "Selected Circle Members" },
];
const profileVisibilityOptions = [
  { value: "circle_coaches", label: "Circle Coaches" },
  { value: "assigned_coaches", label: "Assigned Coaches" },
];
const processStageOptions = [
  { value: "new", label: "New" },
  { value: "assessment_completed", label: "Assessment Completed" },
  { value: "onboarding", label: "Onboarding" },
  { value: "active_circle", label: "Active Circle" },
  { value: "active_coaching", label: "Active Coaching" },
  { value: "paused", label: "Paused" },
  { value: "completed", label: "Completed" },
];
const engagementStatusOptions = [
  { value: "unknown", label: "Unknown" },
  { value: "beginning", label: "Beginning" },
  { value: "engaged", label: "Engaged" },
  { value: "growing", label: "Growing" },
  { value: "needs_attention", label: "Needs Attention" },
  { value: "paused", label: "Paused" },
  { value: "completed", label: "Completed" },
];
const followUpStatusOptions = [
  { value: "none", label: "None" },
  { value: "planned", label: "Planned" },
  { value: "due", label: "Due" },
  { value: "completed", label: "Completed" },
  { value: "deferred", label: "Deferred" },
];
const coachAssessmentTypes: CoachAssessmentTypeConfig[] = [
  {
    id: "peace-assessment",
    name: "Peace Assessment",
    description:
      "Assessment participation for this Circle, including each member's latest completed Peace profile.",
  },
];

export default function CoachDashboard() {
  const router = useRouter();
  const workspaceRef = useRef<HTMLElement | null>(null);
  const workspaceContentRef = useRef<HTMLDivElement | null>(null);
  const memberDetailRef = useRef<HTMLElement | null>(null);
  const searchToolbarRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [overview, setOverview] = useState<CoachOverviewPayload | null>(null);
  const [selectedCircleId, setSelectedCircleId] = useState("");
  const [circlePayload, setCirclePayload] = useState<CoachCirclePayload | null>(
    null
  );
  const [memberPayload, setMemberPayload] = useState<CoachMemberPayload | null>(
    null
  );
  const [monthlyPayload, setMonthlyPayload] =
    useState<CoachMonthlyQuestionsPayload | null>(null);
  const [monthlyQuestionsMessage, setMonthlyQuestionsMessage] = useState("");
  const [resourcesPayload, setResourcesPayload] =
    useState<CoachResourcesPayload | null>(null);
  const [resourcesMessage, setResourcesMessage] = useState("");
  const [activeWorkspace, setActiveWorkspace] = useState<CoachWorkspaceId | null>(null);
  const [search, setSearch] = useState("");
  const [showFloatingSearch, setShowFloatingSearch] = useState(false);
  const [modalResult, setModalResult] = useState<PeaceAssessmentResult | null>(
    null
  );
  const [message, setMessage] = useState("");

  const refreshResources = useCallback(
    async (circleId: string, providedToken = "") => {
      if (!circleId) {
        setResourcesPayload(null);
        return;
      }

      const token = providedToken || (await getAccessToken());

      if (!token) {
        router.replace(routes.login);
        return;
      }

      const response = await fetch(`/api/coach/circles/${circleId}/resources`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const snapshot = await logCoachApiError(
          "Coach resources request failed",
          response
        );
        setResourcesPayload(null);
        setResourcesMessage(
          snapshot.json?.message || "Resources could not be loaded."
        );
        return;
      }

      setResourcesMessage("");
      setResourcesPayload((await response.json()) as CoachResourcesPayload);
    },
    [router]
  );

  const selectCircle = useCallback(
    async (circleId: string, shouldScroll = true, providedToken = "") => {
      const token = providedToken || (await getAccessToken());

      if (!token) {
        router.replace(routes.login);
        return;
      }

      if (document.querySelector(".coach-note-form")) {
        const discard = await requestConfirmation({
          title: "Discard unsaved changes?",
          description: "Your unsaved note or form changes will be lost.",
          confirmLabel: "Discard Changes",
          tone: "danger",
        });
        if (!discard) return;
      }

      setSelectedCircleId(circleId);
      setCirclePayload(null);
      setMemberPayload(null);
      setResourcesPayload(null);
      setMessage("");
      updateCoachUrl(circleId, getWorkspaceFromUrl());

      const response = await fetch(`/api/coach/circles/${circleId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        await logCoachApiError("Coach Circle request failed", response);
        setMessage("This Circle could not be loaded.");
        return;
      }

      const payload = (await response.json()) as CoachCirclePayload;
      setCirclePayload(payload);
      await refreshResources(circleId, token);

      if (shouldScroll) {
        requestAnimationFrame(() => {
          workspaceRef.current?.scrollIntoView({
            behavior: prefersReducedMotion() ? "auto" : "smooth",
            block: "start",
          });
        });
      }
    },
    [refreshResources, router]
  );

  const refreshMonthlyQuestions = useCallback(async (providedToken = "") => {
    const token = providedToken || (await getAccessToken());

    if (!token) {
      router.replace(routes.login);
      return;
    }

    const response = await fetch("/api/coach/monthly-questions", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const snapshot = await readCoachApiError(response);
      const code = snapshot.json?.code || snapshot.json?.error || "";
      const isSchemaPending = code === "monthly_questions_schema_unavailable";

      if (isSchemaPending) {
        console.warn("Coach monthly questions unavailable", {
          url: response.url,
          status: response.status,
          code,
          message: snapshot.json?.message,
          details: snapshot.json?.details,
        });
        setMonthlyQuestionsMessage(
          "Monthly Questions are ready to draft here. If saving is unavailable, your work will stay open so you can try again."
        );
        setMonthlyPayload({
          ok: true,
          circles: [],
          questions: [],
          assignments: [],
          currentByCircle: [],
        });
        return;
      }

      await logCoachApiError("Coach monthly questions request failed", response);
      setMonthlyQuestionsMessage("Monthly questions could not be loaded.");
      return;
    }

    setMonthlyQuestionsMessage("");
    setMonthlyPayload((await response.json()) as CoachMonthlyQuestionsPayload);
  }, [router]);

  const loadOverview = useCallback(async () => {
    setState("loading");
    setMessage("");

    const token = await getAccessToken();

    if (!token) {
      router.replace(routes.login);
      return;
    }

    const response = await fetch("/api/coach/overview", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      router.replace(routes.login);
      return;
    }

    if (response.status === 403) {
      await logCoachApiError("Coach overview access denied", response);
      setState("denied");
      return;
    }

    if (!response.ok) {
      await logCoachApiError("Coach overview request failed", response);
      setState("error");
      return;
    }

    const payload = (await response.json()) as CoachOverviewPayload;
    const requestedCircleId = getCircleFromUrl();
    const initialCircleId =
      payload.circles.find((circle) => circle.id === requestedCircleId)?.id ||
      payload.circles[0]?.id ||
      "";

    setOverview(payload);
    setState("ready");
    await refreshMonthlyQuestions(token);
    setActiveWorkspace(getWorkspaceFromUrl());

    if (initialCircleId) {
      await selectCircle(initialCircleId, false, token);
    }
  }, [refreshMonthlyQuestions, router, selectCircle, setActiveWorkspace]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadOverview();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadOverview]);

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
    function handleLocationChange() {
      const circleId = getCircleFromUrl();

      if (!circleId || circleId === selectedCircleId) return;
      if (!overview?.circles.some((circle) => circle.id === circleId)) return;

      void selectCircle(circleId, false);
    }

    window.addEventListener("hashchange", handleLocationChange);
    window.addEventListener("popstate", handleLocationChange);

    return () => {
      window.removeEventListener("hashchange", handleLocationChange);
      window.removeEventListener("popstate", handleLocationChange);
    };
  }, [overview, selectedCircleId, selectCircle]);

  const openCoachWorkspace = useCallback(
    (workspaceId: CoachWorkspaceId) => {
      setActiveWorkspace(workspaceId);
      updateCoachUrl(selectedCircleId, workspaceId);
      requestAnimationFrame(() => {
        workspaceContentRef.current?.scrollIntoView({
          behavior: prefersReducedMotion() ? "auto" : "smooth",
          block: "start",
        });
        workspaceContentRef.current?.focus({ preventScroll: true });
      });
    },
    [selectedCircleId, setActiveWorkspace]
  );

  const searchResults = useMemo(() => {
    if (!overview) return [];

    const query = search.trim().toLowerCase();

    if (!query) return [];

    return overview.memberSearchIndex
      .filter((member) =>
        [member.name, member.email, member.circleNames.join(" ")]
          .join(" ")
          .toLowerCase()
          .includes(query)
      )
      .slice(0, 8);
  }, [overview, search]);
  const coachSearchSuggestions = useMemo(() => {
    if (!overview) return [];

    const query = search.trim().toLowerCase();

    if (!query) return [];

    const suggestions: Array<{
      key: string;
      title: string;
      detail: string;
      type: "circle" | "workspace";
      targetId: string;
    }> = [];

    overview.circles
      .filter((circle) => circle.name.toLowerCase().includes(query))
      .slice(0, 3)
      .forEach((circle) => {
        suggestions.push({
          key: `circle-${circle.id}`,
          title: circle.name,
          detail: "Open Circle workspace",
          type: "circle",
          targetId: circle.id,
        });
      });

    if (
      ["peace assessment", "assessment", "completed", "not started"].some((term) =>
        term.includes(query)
      )
    ) {
      suggestions.push({
        key: "assessment-peace",
        title: "Peace Assessment",
        detail: "Review assessment participation for the selected Circle",
        type: "workspace",
        targetId: "assessments",
      });
    }

    (monthlyPayload?.questions || [])
      .filter((question) =>
        [
          question.title,
          question.questionText,
          question.assignedCircles.map((circle) => circle.name).join(" "),
        ]
          .join(" ")
          .toLowerCase()
          .includes(query)
      )
      .slice(0, 3)
      .forEach((question) => {
        suggestions.push({
          key: `monthly-${question.id}`,
          title: question.title || shorten(question.questionText, 64),
          detail: "Open Monthly Questions",
          type: "workspace",
          targetId: "monthly-questions",
        });
      });

    return suggestions.slice(0, 6);
  }, [monthlyPayload, overview, search]);

  function openCoachSearchSuggestion(item: {
    type: "circle" | "workspace";
    targetId: string;
  }) {
    if (item.type === "circle") {
      void selectCircle(item.targetId);
      return;
    }

    if (isCoachWorkspaceId(item.targetId)) {
      openCoachWorkspace(item.targetId);
    }
  }

  async function openMember(memberId: string, circleId = selectedCircleId) {
    if (circleId && circleId !== selectedCircleId) {
      await selectCircle(circleId, false);
    }

    const token = await getAccessToken();

    if (!token) {
      router.replace(routes.login);
      return;
    }

    const response = await fetch(`/api/coach/members/${memberId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      await logCoachApiError("Coach member request failed", response);
      setMessage("This member is not available in your coaching workspace.");
      return;
    }

    const payload = (await response.json()) as CoachMemberPayload;
    setMemberPayload(payload);

    requestAnimationFrame(() => {
      memberDetailRef.current?.scrollIntoView({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        block: "start",
      });
    });
  }

  async function openAssessment(assessmentId: string) {
    const token = await getAccessToken();

    if (!token) {
      router.replace(routes.login);
      return;
    }

    const response = await fetch(`/api/coach/assessments/${assessmentId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      await logCoachApiError("Coach assessment request failed", response);
      setMessage("That assessment result is not available.");
      return;
    }

    const payload = (await response.json()) as {
      ok: true;
      result: PeaceAssessmentResult;
    };

    setModalResult(payload.result);
  }

  function returnToSearch() {
    searchToolbarRef.current?.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "start",
    });

    requestAnimationFrame(() => searchInputRef.current?.focus());
  }

  async function saveCircleNote(
    values: CircleNoteFormState,
    noteId: string | null = null
  ) {
    if (!selectedCircleId) return false;

    const token = await getAccessToken();

    if (!token) {
      router.replace(routes.login);
      return false;
    }

    const response = await fetch(
      noteId
        ? `/api/coach/circles/${selectedCircleId}/notes/${noteId}`
        : `/api/coach/circles/${selectedCircleId}/notes`,
      {
        method: noteId ? "PATCH" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      }
    );

    if (!response.ok) {
      const errorSnapshot = await logCoachApiError(
        "Coach Circle note save failed",
        response,
        noteId ? "PATCH" : "POST"
      );
      setMessage(errorSnapshot.json?.message || "Circle note could not be saved.");
      return false;
    }

    const payload = (await response.json()) as {
      ok: true;
      message?: string;
      note?: CoachCircleNote;
    };

    const savedNote = payload.note;

    if (savedNote) {
      setCirclePayload((current) =>
        current
          ? {
              ...current,
              notes: upsertCircleNote(current.notes, savedNote),
            }
          : current
      );
    } else {
      await selectCircle(selectedCircleId, false, token);
    }

    setMessage(
      payload.message || (noteId ? "Circle note was updated." : "Circle note was added.")
    );
    return true;
  }

  async function deleteCircleNote(noteId: string) {
    if (!selectedCircleId) return false;

    const token = await getAccessToken();

    if (!token) {
      router.replace(routes.login);
      return false;
    }

    const response = await fetch(
      `/api/coach/circles/${selectedCircleId}/notes/${noteId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorSnapshot = await logCoachApiError(
        "Coach Circle note delete failed",
        response,
        "DELETE"
      );
      setMessage(errorSnapshot.json?.message || "Circle note could not be deleted.");
      return false;
    }

    const payload = (await response.json().catch(() => null)) as {
      ok?: true;
      message?: string;
    } | null;

    setCirclePayload((current) =>
      current
        ? {
            ...current,
            notes: current.notes.filter((note) => note.id !== noteId),
          }
        : current
    );
    setMessage(payload?.message || "Circle note was deleted.");
    return true;
  }

  async function saveMonthlyQuestion(values: MonthlyQuestionFormState) {
    const token = await getAccessToken();

    if (!token) {
      router.replace(routes.login);
      return false;
    }

    const response = await fetch("/api/coach/monthly-questions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const errorSnapshot = await logCoachApiError(
        "Coach monthly question assignment failed",
        response,
        "POST"
      );
      setMessage(errorSnapshot.json?.message || "Monthly Question could not be assigned.");
      return false;
    }

    const payload = (await response.json()) as {
      ok: true;
      message?: string;
    };

    setMessage(payload.message || "Monthly Question assigned to Circle.");
    await refreshMonthlyQuestions(token);
    return true;
  }

  async function runMonthlyQuestionAction(
    assignment: CoachMonthlyQuestionAssignment,
    action: "archive"
  ) {
    const token = await getAccessToken();

    if (!token) {
      router.replace(routes.login);
      return false;
    }

    const response = await fetch(
      `/api/coach/circles/${assignment.circle.id}/monthly-question-assignments/${assignment.id}/archive`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorSnapshot = await logCoachApiError(
        `Coach monthly question assignment ${action} failed`,
        response,
        "POST"
      );
      setMessage(errorSnapshot.json?.message || "Monthly Question assignment could not be updated.");
      return false;
    }

    const payload = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;

    const successMessage = payload?.message || "Monthly Question unassigned from this Circle.";
    setMessage(successMessage);
    showFeedback({ kind: "success", message: successMessage });
    await refreshMonthlyQuestions(token);
    return true;
  }

  async function saveResourceAssignment(values: ResourceAssignmentFormState) {
    if (!selectedCircleId) return false;

    const token = await getAccessToken();

    if (!token) {
      router.replace(routes.login);
      return false;
    }

    const response = await fetch(
      `/api/coach/circles/${selectedCircleId}/resources`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      }
    );

    if (!response.ok) {
      const errorSnapshot = await logCoachApiError(
        "Coach resource assignment failed",
        response,
        "POST"
      );
      setMessage(errorSnapshot.json?.message || "Resource could not be assigned.");
      return false;
    }

    const payload = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;

    setMessage(payload?.message || "Resource assigned.");
    await refreshResources(selectedCircleId, token);
    return true;
  }

  async function unassignResourceAssignment(assignmentId: string) {
    if (!selectedCircleId) return false;
    const token = await getAccessToken();
    if (!token) {
      router.replace(routes.login);
      return false;
    }

    const response = await fetch(`/api/coach/circles/${selectedCircleId}/resources`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ assignmentId }),
    });
    const payload = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    if (!response.ok) {
      setMessage(payload?.message || "Resource assignment could not be updated.");
      return false;
    }

    const successMessage = payload?.message || "Resource was unassigned.";
    setMessage(successMessage);
    showFeedback({ kind: "success", message: successMessage });
    await refreshResources(selectedCircleId, token);
    return true;
  }

  async function saveMemberNote(
    profileId: string,
    values: ProfileNoteFormState,
    noteId: string | null = null
  ) {
    const token = await getAccessToken();

    if (!token) {
      router.replace(routes.login);
      return;
    }

    const response = await fetch(
      noteId
        ? `/api/coach/members/${profileId}/notes/${noteId}`
        : `/api/coach/members/${profileId}/notes`,
      {
        method: noteId ? "PATCH" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      }
    );

    if (!response.ok) {
      await logCoachApiError("Coach member note save failed", response);
      setMessage("Member note could not be saved.");
      return;
    }

    setMessage(noteId ? "Member note was updated." : "Member note was added.");
    await refreshMember(profileId, token);
  }

  async function deleteMemberNote(profileId: string, noteId: string) {
    const confirmed = await requestConfirmation({
      title: "Delete this member note?",
      description: "This permanently deletes the note and cannot be undone.",
      confirmLabel: "Delete Note",
      tone: "danger",
    });
    if (!confirmed) return;

    const token = await getAccessToken();

    if (!token) {
      router.replace(routes.login);
      return;
    }

    const response = await fetch(`/api/coach/members/${profileId}/notes/${noteId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      await logCoachApiError("Coach member note delete failed", response);
      setMessage("Member note could not be deleted.");
      return;
    }

    setMessage("Member note was deleted.");
    await refreshMember(profileId, token);
  }

  async function saveGrowthStatus(profileId: string, values: GrowthFormState) {
    const token = await getAccessToken();

    if (!token) {
      router.replace(routes.login);
      return;
    }

    const response = await fetch(`/api/coach/members/${profileId}/growth`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      await logCoachApiError("Coach growth status save failed", response);
      setMessage("Growth status could not be saved.");
      return;
    }

    setMessage("Growth status was saved.");
    await refreshMember(profileId, token);

    if (selectedCircleId) {
      await selectCircle(selectedCircleId, false, token);
    }
  }

  async function refreshMember(profileId: string, token: string) {
    const response = await fetch(`/api/coach/members/${profileId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      await logCoachApiError("Coach member refresh failed", response);
      return;
    }

    setMemberPayload((await response.json()) as CoachMemberPayload);
  }

  if (state === "loading") {
    return (
      <section className="coach-shell">
        <div className="container">
          <div className="admin-loading portal-card">Loading coach dashboard...</div>
        </div>
      </section>
    );
  }

  if (state === "denied") {
    return (
      <CoachState
        title="Coach access required"
        message="This workspace is available to approved PeaceWorks coaches and administrators."
        onAction={() => router.push(routes.myDashboard)}
      />
    );
  }

  if (state === "error" || !overview) {
    return (
      <CoachState
        title="Coach dashboard unavailable"
        message="The coaching workspace could not be loaded. Please try again later."
        onAction={loadOverview}
      />
    );
  }

  return (
    <>
      <section className="coach-shell">
        <div className="container">
          <div className="coach-hero portal-card">
            <div>
              <div className="eyebrow">PeaceWorks Coaches</div>
              <h1>Coach Dashboard</h1>
              <p>
                Welcome, {overview.currentCoach.name}. Review your coached
                Circles, open member profiles, and keep the relational picture
                clear without exposing administrative controls.
              </p>
            </div>
            <div className="coach-hero-badge">
              <span>{overview.isAdmin ? "Admin view" : "Coach view"}</span>
              <strong>{overview.metrics.circlesCoached}</strong>
              <small>coached Circles</small>
            </div>
          </div>

          <div className="coach-search portal-card" ref={searchToolbarRef}>
            <label>
              <span>
                <Search size={17} aria-hidden="true" />
                Search your coached members
              </span>
              <input
                ref={searchInputRef}
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, email, or Circle"
              />
            </label>
            {searchResults.length > 0 && (
              <div className="coach-search-results">
                {searchResults.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() =>
                      openMember(member.id, member.circleIds[0] || selectedCircleId)
                    }
                  >
                    <strong>{member.name}</strong>
                    <span>{member.circleNames.join(" + ")}</span>
                  </button>
                ))}
              </div>
            )}
            {coachSearchSuggestions.length > 0 && (
              <div className="coach-search-results">
                {coachSearchSuggestions.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => openCoachSearchSuggestion(item)}
                  >
                    <strong>{item.title}</strong>
                    <span>{item.detail}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {message && <div className="admin-message error">{message}</div>}

          {overview.circles.length === 0 ? (
            <div className="portal-card coach-empty-state">
              No coached Circles are currently assigned.
            </div>
          ) : (
            <>
              <CoachMetrics overview={overview} />
              <CircleSelector
                circles={overview.circles}
                selectedCircleId={selectedCircleId}
                onSelect={selectCircle}
              />
              {selectedCircleId && !circlePayload ? (
                <section className="coach-workspace portal-card" ref={workspaceRef}>
                  <div className="coach-empty-state">
                    {getWorkspaceLoadingMessage(activeWorkspace)}
                  </div>
                </section>
              ) : (
                <CircleWorkspace
                  activeWorkspace={activeWorkspace}
                  circlePayload={circlePayload}
                  monthlyQuestionsMessage={monthlyQuestionsMessage}
                  monthlyQuestionsPayload={monthlyPayload}
                  resourcesMessage={resourcesMessage}
                  resourcesPayload={resourcesPayload}
                  memberPayload={memberPayload}
                  memberDetailRef={memberDetailRef}
                  workspaceRef={workspaceRef}
                  workspaceContentRef={workspaceContentRef}
                  onDeleteCircleNote={deleteCircleNote}
                  onDeleteMemberNote={deleteMemberNote}
                  onOpenAssessment={openAssessment}
                  onOpenMember={openMember}
                  onSaveCircleNote={saveCircleNote}
                  onSaveGrowthStatus={saveGrowthStatus}
                  onSaveMemberNote={saveMemberNote}
                  onSaveMonthlyQuestion={saveMonthlyQuestion}
                  onSaveResourceAssignment={saveResourceAssignment}
                  onUnassignResourceAssignment={unassignResourceAssignment}
                  onMonthlyQuestionAction={runMonthlyQuestionAction}
                  onWorkspaceChange={openCoachWorkspace}
                />
              )}
            </>
          )}
        </div>
      </section>

      <CoachStickySearch
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

function CoachMetrics({ overview }: { overview: CoachOverviewPayload }) {
  return (
    <section className="coach-overview-grid" aria-label="Coach overview">
      <div className="coach-ratio-grid">
        <RatioCard title="Assessment Completion" ratio={overview.ratios.assessmentCompletion} />
        <RatioCard title="Growth Documentation" ratio={overview.ratios.growthDocumentation} />
        <RatioCard title="Follow-ups Scheduled" ratio={overview.ratios.followUpScheduling} />
      </div>
      <div className="coach-stat-grid">
        <StatTile
          helpText="Across your authorized Circle caseload"
          label="Unique Active Members"
          value={overview.metrics.uniqueActiveMembers}
        />
        <StatTile
          helpText={`${overview.metrics.followUpsOverdue} overdue · ${overview.metrics.followUpsDueSoon} due soon`}
          label="Upcoming Follow-ups"
          value={overview.metrics.upcomingFollowUps}
        />
      </div>
    </section>
  );
}

function CoachStickySearch({
  isVisible,
  onReturnToSearch,
}: {
  isVisible: boolean;
  onReturnToSearch: () => void;
}) {
  if (!isVisible) return null;

  return (
    <div className="admin-sticky-search coach-sticky-search">
      <button
        aria-label="Search Coach Dashboard"
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

function MonthlyQuestionsBoard({
  circles,
  currentByCircle,
  defaultCircleId = "",
  focusedCircleId = "",
  message,
  questions,
  assignments,
  onAction,
  onSave,
}: {
  circles: CoachMonthlyQuestionsPayload["circles"];
  currentByCircle: CoachMonthlyQuestionsPayload["currentByCircle"];
  defaultCircleId?: string;
  focusedCircleId?: string;
  message: string;
  questions: CoachMonthlyQuestion[];
  assignments: CoachMonthlyQuestionAssignment[];
  onAction: (
    assignment: CoachMonthlyQuestionAssignment,
    action: "archive"
  ) => Promise<boolean>;
  onSave: (
    values: MonthlyQuestionFormState,
    questionId?: string | null
  ) => Promise<boolean>;
}) {
  const [search, setSearch] = useState("");
  const [selectedQuestion, setSelectedQuestion] =
    useState<CoachMonthlyQuestion | null>(null);
  const [assigningQuestion, setAssigningQuestion] =
    useState<CoachMonthlyQuestion | null>(null);
  const circleAssignments = assignments.filter(
    (assignment) => !focusedCircleId || assignment.circle.id === focusedCircleId
  );
  const currentAssignment = currentByCircle[0]?.assignment || null;
  const history = circleAssignments.filter(
    (assignment) => assignment.id !== currentAssignment?.id
  );
  const filteredQuestions = filterMonthlyQuestionLibrary(questions, search);

  return (
    <section className="coach-monthly-board portal-card">
      <div className="coach-section-head">
        <span className="card-label">Monthly Questions</span>
        <div>
          <h2>Monthly Questions</h2>
          <p>
            Choose a question from the PeaceWorks Monthly Question Library and
            share it with this Circle.
          </p>
        </div>
        <button
          className="btn btn-secondary"
          type="button"
          onClick={() => setAssigningQuestion(null)}
        >
          <Plus size={16} aria-hidden="true" />
          Select Monthly Question
        </button>
      </div>

      {message && <div className="coach-empty-state">{message}</div>}

      <div className="coach-current-question-grid">
        {currentByCircle.length === 0 ? (
          <div className="coach-empty-state">No coached Circles are currently available.</div>
        ) : (
          currentByCircle.map(({ circle, assignment }) => (
            <article className="coach-current-question-card" key={circle.id}>
              <span>{circle.name}</span>
              <strong>
                {assignment
                  ? assignment.question.title ||
                    shorten(assignment.question.questionText, 64)
                  : "No current question"}
              </strong>
              <small>
                {assignment
                  ? `Current Question · Assigned ${formatDate(assignment.assignedAt)}`
                  : "Select a question from the library when this Circle is ready."}
              </small>
              {assignment && (
                <div className="coach-note-actions">
                  <button
                    className="admin-link-button"
                    type="button"
                    onClick={() => setSelectedQuestion(assignment.question)}
                  >
                    View Details
                  </button>
                  <button
                    className="admin-link-button"
                    type="button"
                    onClick={() => void onAction(assignment, "archive")}
                  >
                    Unassign from Circle
                  </button>
                </div>
              )}
            </article>
          ))
        )}
      </div>

      <div className="coach-note-filters">
        <Field label="Search Monthly Question Library" value={search} onChange={setSearch} />
      </div>

      {filteredQuestions.length === 0 ? (
        <div className="coach-empty-state">
          {questions.length === 0
            ? "No Monthly Questions are currently available. PeaceWorks Monthly Questions will appear here when they are published to the shared library."
            : "No Monthly Questions match this search."}
        </div>
      ) : (
        <div className="coach-monthly-question-grid">
          {filteredQuestions.map((question) => (
            <MonthlyQuestionTile
              key={question.id}
              question={question}
              onPreview={() => setSelectedQuestion(question)}
              onSelect={() => setAssigningQuestion(question)}
            />
          ))}
        </div>
      )}

      <div className="coach-section-head">
        <span className="card-label">Question History</span>
        <h3>Question History</h3>
      </div>
      {history.length === 0 ? (
        <div className="coach-empty-state">No previous Monthly Questions for this Circle yet.</div>
      ) : (
        <div className="coach-monthly-question-grid">
          {history.map((assignment) => (
            <MonthlyQuestionAssignmentTile
              assignment={assignment}
              key={assignment.id}
              onArchive={() => void onAction(assignment, "archive")}
              onPreview={() => setSelectedQuestion(assignment.question)}
              onReassign={() => setAssigningQuestion(assignment.question)}
            />
          ))}
        </div>
      )}

      {assigningQuestion && (
        <MonthlyQuestionAssignmentForm
          circles={circles}
          defaultCircleId={defaultCircleId}
          question={assigningQuestion}
          onCancel={() => setAssigningQuestion(null)}
          onSave={async (values) => {
            const saved = await onSave(values);
            if (saved) setAssigningQuestion(null);
            return saved;
          }}
        />
      )}

      {selectedQuestion && (
        <MonthlyQuestionPreview
          question={selectedQuestion}
          onClose={() => setSelectedQuestion(null)}
          onSelect={() => {
            setAssigningQuestion(selectedQuestion);
            setSelectedQuestion(null);
          }}
        />
      )}
    </section>
  );
}

function MonthlyQuestionTile({
  question,
  onPreview,
  onSelect,
}: {
  question: CoachMonthlyQuestion;
  onPreview: () => void;
  onSelect: () => void;
}) {
  return (
    <article className={`coach-monthly-question-tile ${question.status}`}>
      <div>
        <span>Published</span>
        <small>
          {question.questionNumber ||
            question.category ||
            question.theme ||
            question.author.name ||
            "PeaceWorks"}
        </small>
      </div>
      <strong>{question.title || shorten(question.questionText, 78)}</strong>
      {question.openingReflection && <p>{shorten(question.openingReflection, 140)}</p>}
      <blockquote>{question.questionText}</blockquote>
      {question.discussionPrompts.length > 0 && (
        <small>{question.discussionPrompts.length} discussion prompt{question.discussionPrompts.length === 1 ? "" : "s"}</small>
      )}
      <footer>
        <small>
          Published {formatDate(question.publishedAt)} · Monthly Question Library
        </small>
        <div className="coach-note-actions">
          <button className="admin-link-button" type="button" onClick={onPreview}>
            Preview Question
          </button>
          <button className="admin-link-button" type="button" onClick={onSelect}>
            Select
          </button>
        </div>
      </footer>
    </article>
  );
}

function MonthlyQuestionAssignmentTile({
  assignment,
  onArchive,
  onPreview,
  onReassign,
}: {
  assignment: CoachMonthlyQuestionAssignment;
  onArchive: () => void;
  onPreview: () => void;
  onReassign: () => void;
}) {
  return (
    <article className={`coach-monthly-question-tile ${assignment.assignmentStatus}`}>
      <div>
        <span>{assignment.assignmentStatus === "archived" ? "Archived" : "Assigned"}</span>
        <small>{assignment.circle.name}</small>
      </div>
      <strong>{assignment.question.title || shorten(assignment.question.questionText, 78)}</strong>
      {formatMonthlyQuestionPeriod(
        assignment.questionMonth,
        assignment.questionYear
      ) && (
        <small>
          {formatMonthlyQuestionPeriod(
            assignment.questionMonth,
            assignment.questionYear
          )}
        </small>
      )}
      <blockquote>{assignment.question.questionText}</blockquote>
      <footer>
        <small>
          Assigned {formatDate(assignment.assignedAt)} by {assignment.assignedBy.name}
          {assignment.archivedAt ? ` · Archived ${formatDate(assignment.archivedAt)}` : ""}
        </small>
        <div className="coach-note-actions">
          <button className="admin-link-button" type="button" onClick={onPreview}>
            View
          </button>
          <button className="admin-link-button" type="button" onClick={onReassign}>
            Reassign
          </button>
          {assignment.assignmentStatus !== "archived" && assignment.canArchive && (
            <button className="admin-link-button" type="button" onClick={onArchive}>
              Unassign from Circle
            </button>
          )}
        </div>
      </footer>
    </article>
  );
}

function MonthlyQuestionAssignmentForm({
  circles,
  defaultCircleId,
  question,
  onCancel,
  onSave,
}: {
  circles: CoachMonthlyQuestionsPayload["circles"];
  defaultCircleId: string;
  question: CoachMonthlyQuestion;
  onCancel: () => void;
  onSave: (values: MonthlyQuestionFormState) => Promise<boolean>;
}) {
  const [form, setForm] = useState<MonthlyQuestionFormState>({
    questionId: question.id,
    circleIds: defaultCircleId ? [defaultCircleId] : [],
    coachIntroduction: "",
    questionMonth: null,
    questionYear: null,
  });
  const [dirty, setDirty] = useState(false);

  function toggleCircle(circleId: string) {
    setForm((current) => ({
      ...current,
      circleIds: current.circleIds.includes(circleId)
        ? current.circleIds.filter((id) => id !== circleId)
        : [...current.circleIds, circleId],
    }));
    setDirty(true);
  }

  return (
    <div className="coach-note-form coach-monthly-form">
      <div className="coach-monthly-warning">
        You are assigning a published Monthly Question from the PeaceWorks library. Source
        wording can only be changed by an admin.
      </div>
      <MonthlyQuestionReadOnlyContent question={question} />
      <div className="coach-form-grid">
        <SelectField
          label="Month"
          value={form.questionMonth ? String(form.questionMonth) : ""}
          options={monthlyQuestionMonths.map((label, index) => ({
            value: String(index + 1),
            label,
          }))}
          onChange={(value) => {
            setForm((current) => ({
              ...current,
              questionMonth: value ? Number(value) : null,
            }));
            setDirty(true);
          }}
        />
        <SelectField
          label="Year"
          value={form.questionYear ? String(form.questionYear) : ""}
          options={getMonthlyQuestionYearOptions()}
          onChange={(value) => {
            setForm((current) => ({
              ...current,
              questionYear: value ? Number(value) : null,
            }));
            setDirty(true);
          }}
        />
      </div>
      <div className="coach-recipient-picker">
        <div className="coach-panel-head">
          <strong>Assigned Circles</strong>
          <span>{form.circleIds.length} selected</span>
        </div>
        <div className="coach-recipient-grid">
          {circles.map((circle) => (
            <label key={circle.id}>
              <input
                checked={form.circleIds.includes(circle.id)}
                type="checkbox"
                onChange={() => toggleCircle(circle.id)}
              />
              <span>{circle.name}</span>
            </label>
          ))}
        </div>
      </div>
      <TextAreaField
        label="Optional Coach Introduction"
        value={form.coachIntroduction}
        onChange={(value) => {
          setForm((current) => ({ ...current, coachIntroduction: value }));
          setDirty(true);
        }}
      />
      <div className="coach-form-actions">
        <button className="btn btn-secondary" type="button" onClick={() => guardedCancel(dirty, onCancel)}>
          Cancel
        </button>
        <button className="btn btn-primary" type="button" onClick={() => void onSave(form)}>
          Assign to Circle
        </button>
      </div>
    </div>
  );
}

function MonthlyQuestionPreview({
  question,
  onClose,
  onSelect,
}: {
  question: CoachMonthlyQuestion;
  onClose: () => void;
  onSelect: () => void;
}) {
  return (
    <div className="coach-confirm-backdrop" role="presentation">
      <section className="coach-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="monthly-question-preview-title">
        <span className="card-label">Preview Question</span>
        <h4 id="monthly-question-preview-title">{question.title || "Monthly Question"}</h4>
        <MonthlyQuestionReadOnlyContent question={question} />
        <div className="coach-form-actions">
          <button className="btn btn-secondary" type="button" onClick={onClose}>
            Close
          </button>
          <button className="btn btn-primary" type="button" onClick={onSelect}>
            Select
          </button>
        </div>
      </section>
    </div>
  );
}

function MonthlyQuestionReadOnlyContent({
  question,
}: {
  question: CoachMonthlyQuestion;
}) {
  return (
    <div className="monthly-question-member-card">
      {question.questionNumber && (
        <span className="card-label">
          {question.questionNumber}
        </span>
      )}
      {question.openingReflection && <p>{question.openingReflection}</p>}
      <blockquote>{question.questionText}</blockquote>
      {question.guidance && <p>{question.guidance}</p>}
      {question.discussionPrompts.length > 0 && (
        <ul>
          {question.discussionPrompts.map((prompt, index) => (
            <li key={`preview-prompt-${index}`}>{prompt}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CircleResourcesWorkspace({
  message,
  payload,
  selectedCircleName,
  onAssign,
  onUnassign,
}: {
  message: string;
  payload: CoachResourcesPayload | null;
  selectedCircleName: string;
  onAssign: (values: ResourceAssignmentFormState) => Promise<boolean>;
  onUnassign: (assignmentId: string) => Promise<boolean>;
}) {
  const [search, setSearch] = useState("");
  const [assigningResource, setAssigningResource] = useState<CoachResource | null>(null);
  const assignedResources = payload?.assignedResources || [];
  const libraryResources = filterResourceLibrary(payload?.libraryResources || [], search);

  return (
    <section className="coach-detail-panel">
      <div className="coach-section-head">
        <span className="card-label">Resources</span>
        <div>
          <h3>Resources</h3>
          <p>
            Review resources assigned to {selectedCircleName} and assign published
            PeaceWorks library resources to the Circle or selected members.
          </p>
        </div>
      </div>

      {message && <div className="coach-empty-state">{message}</div>}

      <div className="coach-section-head">
        <span className="card-label">Assigned to This Circle</span>
        <h4>Assigned Resources</h4>
      </div>
      {assignedResources.length === 0 ? (
        <div className="coach-empty-state">
          No resources have been assigned to this Circle yet.
        </div>
      ) : (
        <div className="coach-monthly-question-grid">
          {assignedResources.map((assignment) => (
            <ResourceAssignmentTile
              assignment={assignment}
              key={assignment.id}
              onUnassign={() => void onUnassign(assignment.id)}
            />
          ))}
        </div>
      )}

      <div className="coach-note-filters">
        <Field label="Search Resource Library" value={search} onChange={setSearch} />
      </div>

      {libraryResources.length === 0 ? (
        <div className="coach-empty-state">
          {(payload?.libraryResources || []).length === 0
            ? "No resources are currently available for coach assignment."
            : "No resources match this search."}
        </div>
      ) : (
        <div className="coach-monthly-question-grid">
          {libraryResources.map((resource) => (
            <ResourceLibraryTile
              key={resource.id}
              resource={resource}
              onAssign={() => setAssigningResource(resource)}
            />
          ))}
        </div>
      )}

      {assigningResource && payload && (
        <ResourceAssignmentForm
          members={payload.members}
          resource={assigningResource}
          selectedCircleName={selectedCircleName}
          onCancel={() => setAssigningResource(null)}
          onSave={async (values) => {
            const saved = await onAssign(values);
            if (saved) setAssigningResource(null);
            return saved;
          }}
        />
      )}
    </section>
  );
}

function ResourceAssignmentTile({
  assignment,
  onUnassign,
}: {
  assignment: CoachResourceAssignment;
  onUnassign: () => void;
}) {
  return (
    <article className="coach-monthly-question-tile published">
      <div>
        <span>{formatResourceType(assignment.resource.resourceType)}</span>
        <small>{assignment.audience === "member" ? "Selected member" : "Circle"}</small>
      </div>
      <strong>{assignment.resource.title}</strong>
      {assignment.resource.description && <p>{assignment.resource.description}</p>}
      <footer>
        <small>
          Assigned {formatDate(assignment.assignedAt)} by {assignment.assignedBy.name} ·{" "}
          {assignment.audienceLabel}
        </small>
        <ResourceOpenButton resource={assignment.resource} />
        {assignment.canArchive && (
          <button className="admin-link-button" type="button" onClick={onUnassign}>
            {assignment.audience === "member"
              ? "Unassign from Member"
              : "Unassign from Circle"}
          </button>
        )}
      </footer>
    </article>
  );
}

function ResourceLibraryTile({
  resource,
  onAssign,
}: {
  resource: CoachResource;
  onAssign: () => void;
}) {
  return (
    <article className="coach-monthly-question-tile published">
      <div>
        <span>{formatResourceType(resource.resourceType)}</span>
        <small>{resource.category || resource.provider || "Resource Library"}</small>
      </div>
      <strong>{resource.title}</strong>
      {resource.description && <p>{resource.description}</p>}
      {resource.tags.length > 0 && (
        <small>{resource.tags.slice(0, 4).join(", ")}</small>
      )}
      <footer>
        <small>
          Published {formatDate(resource.publishedAt)}
          {resource.provider ? ` · ${resource.provider}` : ""}
        </small>
        <div className="coach-note-actions">
          <ResourceOpenButton resource={resource} />
          <button className="admin-link-button" type="button" onClick={onAssign}>
            Assign
          </button>
        </div>
      </footer>
    </article>
  );
}

function ResourceOpenButton({ resource }: { resource: CoachResource }) {
  if (!resource.openUrl) {
    return (
      <button className="admin-link-button" type="button" disabled>
        Preview
      </button>
    );
  }

  return (
    <a
      className="admin-link-button"
      href={resource.openUrl}
      target="_blank"
      rel="noopener noreferrer"
    >
      Open <ExternalLink size={14} aria-hidden="true" />
    </a>
  );
}

function ResourceAssignmentForm({
  members,
  resource,
  selectedCircleName,
  onCancel,
  onSave,
}: {
  members: CoachResourcesPayload["members"];
  resource: CoachResource;
  selectedCircleName: string;
  onCancel: () => void;
  onSave: (values: ResourceAssignmentFormState) => Promise<boolean>;
}) {
  const [form, setForm] = useState<ResourceAssignmentFormState>({
    resourceId: resource.id,
    audienceType: "circle",
    memberIds: [],
  });

  function toggleMember(memberId: string) {
    setForm((current) => ({
      ...current,
      memberIds: current.memberIds.includes(memberId)
        ? current.memberIds.filter((id) => id !== memberId)
        : [...current.memberIds, memberId],
    }));
  }

  return (
    <div className="coach-note-form coach-monthly-form">
      <div className="coach-monthly-warning">
        You are assigning a published resource from the PeaceWorks library. Source
        content can only be changed by an admin.
      </div>
      <ResourceSummaryCard resource={resource} />
      <div className="coach-recipient-picker">
        <div className="coach-panel-head">
          <strong>Assignment Audience</strong>
          <span>{form.audienceType === "circle" ? selectedCircleName : `${form.memberIds.length} member${form.memberIds.length === 1 ? "" : "s"}`}</span>
        </div>
        <div className="coach-recipient-grid">
          <label>
            <input
              checked={form.audienceType === "circle"}
              name="resource-audience"
              type="radio"
              onChange={() =>
                setForm((current) => ({
                  ...current,
                  audienceType: "circle",
                  memberIds: [],
                }))
              }
            />
            <span>Entire Circle</span>
          </label>
          <label>
            <input
              checked={form.audienceType === "members"}
              name="resource-audience"
              type="radio"
              onChange={() =>
                setForm((current) => ({
                  ...current,
                  audienceType: "members",
                }))
              }
            />
            <span>Selected Members</span>
          </label>
        </div>
      </div>

      {form.audienceType === "members" && (
        <div className="coach-recipient-picker">
          <div className="coach-panel-head">
            <strong>Members</strong>
            <span>{form.memberIds.length} selected</span>
          </div>
          <div className="coach-recipient-grid">
            {members.map((member) => (
              <label key={member.id}>
                <input
                  checked={form.memberIds.includes(member.id)}
                  type="checkbox"
                  onChange={() => toggleMember(member.id)}
                />
                <span>{member.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="coach-form-actions">
        <button className="btn btn-secondary" type="button" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn btn-primary" type="button" onClick={() => void onSave(form)}>
          Assign Resource
        </button>
      </div>
    </div>
  );
}

function ResourceSummaryCard({ resource }: { resource: CoachResource }) {
  return (
    <article className="coach-monthly-question-tile published">
      <div>
        <span>{formatResourceType(resource.resourceType)}</span>
        <small>{resource.category || resource.provider || "Resource Library"}</small>
      </div>
      <strong>{resource.title}</strong>
      {resource.description && <p>{resource.description}</p>}
      <footer>
        <small>
          Published {formatDate(resource.publishedAt)}
          {resource.provider ? ` · ${resource.provider}` : ""}
        </small>
        <ResourceOpenButton resource={resource} />
      </footer>
    </article>
  );
}

function CircleSelector({
  circles,
  selectedCircleId,
  onSelect,
}: {
  circles: CoachOverviewPayload["circles"];
  selectedCircleId: string;
  onSelect: (circleId: string) => void;
}) {
  return (
    <section className="coach-circle-selector" aria-label="Coached Circles">
      <div className="coach-section-head">
        <span className="card-label">Coached Circles</span>
        <h2>Select a Circle</h2>
      </div>
      <div className="coach-circle-grid">
        {circles.map((circle) => (
          <button
            className={`coach-circle-tile portal-card${
              selectedCircleId === circle.id ? " active" : ""
            }`}
            aria-pressed={selectedCircleId === circle.id}
            key={circle.id}
            type="button"
            onClick={() => onSelect(circle.id)}
          >
            <span>{circle.status || "No status"}</span>
            <strong>{circle.name}</strong>
            <small>
              {circle.memberCount} members · Coaches:{" "}
              {formatCoachNames(circle.coaches)}
            </small>
            <em>
              {circle.assessedCount} of {circle.memberCount} assessed
            </em>
            <i>Open Circle</i>
          </button>
        ))}
      </div>
    </section>
  );
}

function CircleWorkspace({
  activeWorkspace,
  circlePayload,
  monthlyQuestionsMessage,
  monthlyQuestionsPayload,
  resourcesMessage,
  resourcesPayload,
  memberPayload,
  memberDetailRef,
  workspaceRef,
  workspaceContentRef,
  onDeleteCircleNote,
  onDeleteMemberNote,
  onMonthlyQuestionAction,
  onOpenAssessment,
  onOpenMember,
  onSaveCircleNote,
  onSaveGrowthStatus,
  onSaveMemberNote,
  onSaveMonthlyQuestion,
  onSaveResourceAssignment,
  onUnassignResourceAssignment,
  onWorkspaceChange,
}: {
  activeWorkspace: CoachWorkspaceId | null;
  circlePayload: CoachCirclePayload | null;
  monthlyQuestionsMessage: string;
  monthlyQuestionsPayload: CoachMonthlyQuestionsPayload | null;
  resourcesMessage: string;
  resourcesPayload: CoachResourcesPayload | null;
  memberPayload: CoachMemberPayload | null;
  memberDetailRef: RefObject<HTMLElement | null>;
  workspaceRef: RefObject<HTMLElement | null>;
  workspaceContentRef: RefObject<HTMLDivElement | null>;
  onDeleteCircleNote: (noteId: string) => Promise<boolean>;
  onDeleteMemberNote: (profileId: string, noteId: string) => void;
  onMonthlyQuestionAction: (
    assignment: CoachMonthlyQuestionAssignment,
    action: "archive"
  ) => Promise<boolean>;
  onOpenAssessment: (assessmentId: string) => void;
  onOpenMember: (memberId: string) => void;
  onSaveCircleNote: (
    values: CircleNoteFormState,
    noteId?: string | null
  ) => Promise<boolean>;
  onSaveGrowthStatus: (profileId: string, values: GrowthFormState) => Promise<void>;
  onSaveMemberNote: (
    profileId: string,
    values: ProfileNoteFormState,
    noteId?: string | null
  ) => Promise<void>;
  onSaveMonthlyQuestion: (
    values: MonthlyQuestionFormState,
    questionId?: string | null
  ) => Promise<boolean>;
  onSaveResourceAssignment: (values: ResourceAssignmentFormState) => Promise<boolean>;
  onUnassignResourceAssignment: (assignmentId: string) => Promise<boolean>;
  onWorkspaceChange: (workspaceId: CoachWorkspaceId) => void;
}) {
  if (!circlePayload) return null;

  const { circle, members, notes, workspace } = circlePayload;
  const monthlyQuestions = monthlyQuestionsPayload?.questions || [];
  const monthlyCircles =
    monthlyQuestionsPayload?.circles.length
      ? monthlyQuestionsPayload.circles
      : [{ id: circle.id, name: circle.name, status: circle.status }];
  const circleMonthlyQuestions = monthlyQuestions.filter((question) =>
    question.assignedCircles.some((assignedCircle) => assignedCircle.id === circle.id)
  );
  const workspaceTiles: Array<{
    id: CoachWorkspaceId;
    icon: LucideIcon;
    title: string;
    description: string;
    detail: string;
  }> = [
    {
      id: "members",
      icon: UserRound,
      title: "Members",
      description: "View and support the people in this Circle.",
      detail: `${members.length} active members`,
    },
    {
      id: "assessments",
      icon: ClipboardCheck,
      title: "Assessments",
      description: "Review assessment participation and results.",
      detail: `${workspace.assessments.numerator} of ${workspace.assessments.denominator} assessed`,
    },
    {
      id: "progress",
      icon: Target,
      title: "Progress",
      description: "Track growth, next steps, and follow-ups.",
      detail: `${workspace.progress.numerator} documented`,
    },
    {
      id: "circle-notes",
      icon: FileText,
      title: "Circle Notes",
      description: "Record observations, care, and shared follow-up.",
      detail: notes.length === 0 ? "No notes yet" : `${notes.length} notes`,
    },
    {
      id: "monthly-questions",
      icon: FileText,
      title: "Monthly Questions",
      description: "Create and manage the Circle's reflective questions.",
      detail:
        circleMonthlyQuestions.length === 0
          ? "No questions yet"
          : `${circleMonthlyQuestions.length} questions`,
    },
    {
      id: "resources",
      icon: BookOpen,
      title: "Resources",
      description: "Share materials that support the Circle's journey.",
      detail: "Ready for assigned materials",
    },
    {
      id: "trainings",
      icon: GraduationCap,
      title: "Trainings",
      description: "Assign structured learning experiences to this Circle.",
      detail: "Ready for Circle learning",
    },
    {
      id: "messages",
      icon: MessageCircle,
      title: "Messages",
      description: "Message this Circle, selected members, coaches, or PeaceWorks.",
      detail: "Secure portal messaging",
    },
  ];

  async function openWorkspace(workspaceId: CoachWorkspaceId) {
    if (document.querySelector(".coach-note-form")) {
      const discard = await requestConfirmation({
        title: "Discard unsaved changes?",
        description: "Your unsaved note or form changes will be lost.",
        confirmLabel: "Discard Changes",
        tone: "danger",
      });
      if (!discard) return;
    }

    onWorkspaceChange(workspaceId);
  }

  return (
    <section className="coach-workspace portal-card" ref={workspaceRef}>
      <div className="coach-workspace-head">
        <div>
          <span className="card-label">Selected Circle</span>
          <h2>{circle.name}</h2>
          <p>
            Coaches: {formatCoachNames(circle.coaches)} · {circle.memberCount}{" "}
            active member{circle.memberCount === 1 ? "" : "s"} ·{" "}
            {circle.status || "No status"}
          </p>
        </div>
      </div>

      <div className="coach-tool-grid">
        {workspaceTiles.map((tile) => (
          <ToolTile
            active={activeWorkspace === tile.id}
            detail={tile.detail}
            description={tile.description}
            icon={tile.icon}
            key={tile.id}
            title={tile.title}
            onClick={() => openWorkspace(tile.id)}
          />
        ))}
      </div>

      <div className="coach-workspace-content" ref={workspaceContentRef} tabIndex={-1}>
        {!activeWorkspace && (
          <div className="coach-empty-state">
            Choose an area to work in for this Circle.
          </div>
        )}

        {activeWorkspace === "members" && (
          <CircleMembersWorkspace
            memberDetailRef={memberDetailRef}
            memberPayload={memberPayload}
            members={members}
            onDeleteMemberNote={onDeleteMemberNote}
            onOpenAssessment={onOpenAssessment}
            onOpenMember={onOpenMember}
            onSaveGrowthStatus={onSaveGrowthStatus}
            onSaveMemberNote={onSaveMemberNote}
          />
        )}

        {activeWorkspace === "assessments" && (
          <CircleAssessmentsWorkspace
            members={members}
            onOpenAssessment={onOpenAssessment}
            onOpenMember={onOpenMember}
          />
        )}

        {activeWorkspace === "progress" && (
          <CircleProgressWorkspace members={members} onOpenMember={onOpenMember} />
        )}

        {activeWorkspace === "circle-notes" && (
          <CircleNotesPanel
            members={members}
            notes={notes}
            onDelete={onDeleteCircleNote}
            onSave={onSaveCircleNote}
          />
        )}

        {activeWorkspace === "monthly-questions" && (
          <MonthlyQuestionsBoard
            circles={monthlyCircles}
            currentByCircle={[
              {
                circle: { id: circle.id, name: circle.name, status: circle.status },
                assignment:
                  monthlyQuestionsPayload?.currentByCircle.find(
                    (item) => item.circle.id === circle.id
                  )?.assignment || null,
              },
            ]}
            defaultCircleId={circle.id}
            focusedCircleId={circle.id}
            message={monthlyQuestionsMessage}
            questions={monthlyQuestions}
            assignments={monthlyQuestionsPayload?.assignments || []}
            onAction={onMonthlyQuestionAction}
            onSave={onSaveMonthlyQuestion}
          />
        )}

        {activeWorkspace === "resources" && (
          <CircleResourcesWorkspace
            message={resourcesMessage}
            payload={resourcesPayload}
            selectedCircleName={circle.name}
            onAssign={onSaveResourceAssignment}
            onUnassign={onUnassignResourceAssignment}
          />
        )}

        {activeWorkspace === "trainings" && (
          <section className="coach-detail-panel">
            <div className="coach-section-head">
              <span className="card-label">Trainings</span>
              <h3>Trainings</h3>
            </div>
            <p className="coach-ready-copy">
              Structured learning experiences assigned to this Circle will appear here. Trainings
              may include courses, videos, guided reflections, downloadable materials, and
              progress-based learning.
            </p>
            <div className="coach-empty-state">
              No trainings have been assigned to this Circle yet.
            </div>
          </section>
        )}

        {activeWorkspace === "messages" && (
          <section className="coach-detail-panel">
            <div className="coach-section-head">
              <span className="card-label">Portal Messages</span>
              <h3>Message your Circle</h3>
            </div>
            <p className="coach-ready-copy">
              Recipient choices are limited to this Circle, your direct coaching
              relationships, shared Circle coaches, and PeaceWorks.
            </p>
            <Link className="btn btn-primary" href={routes.messages}>
              Open Messages
            </Link>
          </section>
        )}
      </div>
    </section>
  );
}

function MemberCard({
  member,
  onOpen,
}: {
  member: CoachCircleMemberCard;
  onOpen: (memberId: string) => void;
}) {
  return (
    <button className="coach-member-card" type="button" onClick={() => onOpen(member.id)}>
      <span className="coach-member-avatar">{member.initials}</span>
      <strong>{member.name}</strong>
      <small>{member.email || "No email available"}</small>
      <em>{member.assessmentStatus}</em>
      <span>{member.processStage}</span>
      {member.nextStep && <span>Next step: {shorten(member.nextStep, 70)}</span>}
      <span>
        Next follow-up:{" "}
        {member.nextFollowUpAt ? formatDate(member.nextFollowUpAt) : "Not scheduled"}
      </span>
      <span className={`coach-follow-up ${member.followUpDisplayStatus}`}>
        {formatFollowUpDisplayStatus(member.followUpDisplayStatus)}
      </span>
      <span>Coaches: {formatCoachNames(member.assignedCoaches)}</span>
    </button>
  );
}

function CircleMembersWorkspace({
  memberDetailRef,
  memberPayload,
  members,
  onDeleteMemberNote,
  onOpenAssessment,
  onOpenMember,
  onSaveGrowthStatus,
  onSaveMemberNote,
}: {
  memberDetailRef: RefObject<HTMLElement | null>;
  memberPayload: CoachMemberPayload | null;
  members: CoachCircleMemberCard[];
  onDeleteMemberNote: (profileId: string, noteId: string) => void;
  onOpenAssessment: (assessmentId: string) => void;
  onOpenMember: (memberId: string) => void;
  onSaveGrowthStatus: (profileId: string, values: GrowthFormState) => Promise<void>;
  onSaveMemberNote: (
    profileId: string,
    values: ProfileNoteFormState,
    noteId?: string | null
  ) => Promise<void>;
}) {
  return (
    <section>
      <div className="coach-section-head">
        <span className="card-label">Members</span>
        <h3>Shared Circle Caseload</h3>
      </div>

      {members.length === 0 ? (
        <div className="coach-empty-state">
          No active members are currently listed for this Circle.
        </div>
      ) : (
        <div className="coach-member-grid">
          {members.map((member) => (
            <MemberCard key={member.id} member={member} onOpen={onOpenMember} />
          ))}
        </div>
      )}

      {memberPayload && (
        <MemberDetail
          member={memberPayload}
          onDeleteMemberNote={onDeleteMemberNote}
          memberDetailRef={memberDetailRef}
          onOpenAssessment={onOpenAssessment}
          onSaveGrowthStatus={onSaveGrowthStatus}
          onSaveMemberNote={onSaveMemberNote}
        />
      )}
    </section>
  );
}

function CircleAssessmentsWorkspace({
  members,
  onOpenAssessment,
  onOpenMember,
}: {
  members: CoachCircleMemberCard[];
  onOpenAssessment: (assessmentId: string) => void;
  onOpenMember: (memberId: string) => void;
}) {
  const detailRef = useRef<HTMLDivElement | null>(null);
  const summaries = coachAssessmentTypes
    .map((assessmentType) => buildAssessmentTypeSummary(assessmentType, members))
    .filter((summary) => summary.isAvailable);
  const [selectedAssessmentId, setSelectedAssessmentId] =
    useState<CoachAssessmentTypeId | null>(null);
  const selectedAssessment =
    summaries.find((summary) => summary.config.id === selectedAssessmentId) || null;

  function selectAssessment(assessmentId: CoachAssessmentTypeId) {
    setSelectedAssessmentId((current) => {
      const next = current === assessmentId ? null : assessmentId;

      if (next) {
        requestAnimationFrame(() => {
          detailRef.current?.scrollIntoView({
            behavior: prefersReducedMotion() ? "auto" : "smooth",
            block: "start",
          });
          detailRef.current?.focus({ preventScroll: true });
        });
      }

      return next;
    });
  }

  function detailIdFor(assessmentId: CoachAssessmentTypeId) {
    return `coach-assessment-detail-${assessmentId}`;
  }

  function cardLabel(summary: CoachAssessmentTypeSummary) {
    const isSelected = selectedAssessment?.config.id === summary.config.id;
    return isSelected ? "Collapse Details" : "View Details";
  }

  function cardControls(summary: CoachAssessmentTypeSummary) {
    const isSelected = selectedAssessment?.config.id === summary.config.id;
    return isSelected ? detailIdFor(summary.config.id) : undefined;
  }

  function cardExpanded(summary: CoachAssessmentTypeSummary) {
    return selectedAssessment?.config.id === summary.config.id;
  }

  function renderAssessmentCard(summary: CoachAssessmentTypeSummary) {
    return (
      <AssessmentTypeCard
        ariaControls={cardControls(summary)}
        expanded={cardExpanded(summary)}
        key={summary.config.id}
        selected={cardExpanded(summary)}
        summary={summary}
        actionLabel={cardLabel(summary)}
        onSelect={() => selectAssessment(summary.config.id)}
      />
    );
  }

  function renderSelectedAssessmentDetail() {
    if (!selectedAssessment) return null;

    return (
      <AssessmentTypeDetail
        detailId={detailIdFor(selectedAssessment.config.id)}
        detailRef={detailRef}
        summary={selectedAssessment}
        onClose={() => setSelectedAssessmentId(null)}
        onOpenAssessment={onOpenAssessment}
        onOpenMember={onOpenMember}
      />
    );
  }

  return (
    <section>
      <div className="coach-section-head">
        <span className="card-label">Assessments</span>
        <h3>Assessment Participation</h3>
        <p>
          Select an assessment to review completion and member results for this
          Circle.
        </p>
      </div>

      {summaries.length === 0 ? (
        <div className="coach-empty-state">
          No assessments are currently available for this Circle.
        </div>
      ) : (
        <>
          <div className="coach-assessment-type-grid">
            {summaries.map(renderAssessmentCard)}
          </div>

          {renderSelectedAssessmentDetail()}
        </>
      )}
    </section>
  );
}

function AssessmentTypeCard({
  actionLabel,
  ariaControls,
  expanded,
  selected,
  summary,
  onSelect,
}: {
  actionLabel: string;
  ariaControls?: string;
  expanded: boolean;
  selected: boolean;
  summary: CoachAssessmentTypeSummary;
  onSelect: () => void;
}) {
  return (
    <button
      aria-controls={ariaControls}
      aria-expanded={expanded}
      aria-pressed={selected}
      className={`coach-assessment-type-card${selected ? " active" : ""}`}
      type="button"
      onClick={onSelect}
    >
      <span>{summary.config.name}</span>
      <strong>
        {summary.completedMembers.length} of {summary.totalMembers} Circle members
        completed
      </strong>
      <p>{summary.config.description}</p>
      <div className="coach-assessment-progress" aria-hidden="true">
        <i style={{ width: `${summary.completionPercentage}%` }} />
      </div>
      <small>{summary.completionPercentage}% completion</small>
      {summary.latestCompletionDate && (
        <small>Latest completion: {formatDate(summary.latestCompletionDate)}</small>
      )}
      <em>
        {actionLabel}
        <ChevronDown size={16} aria-hidden="true" />
      </em>
    </button>
  );
}

function AssessmentTypeDetail({
  detailId,
  detailRef,
  summary,
  onClose,
  onOpenAssessment,
  onOpenMember,
}: {
  detailId: string;
  detailRef: RefObject<HTMLDivElement | null>;
  summary: CoachAssessmentTypeSummary;
  onClose: () => void;
  onOpenAssessment: (assessmentId: string) => void;
  onOpenMember: (memberId: string) => void;
}) {
  return (
    <div
      className="coach-assessment-detail"
      id={detailId}
      ref={detailRef}
      tabIndex={-1}
    >
      <div className="coach-section-head">
        <span className="card-label">{summary.config.name}</span>
        <h4>Circle Assessment Details</h4>
        <button className="admin-link-button" type="button" onClick={onClose}>
          Collapse Details
        </button>
      </div>
      <div className="coach-stat-grid">
        <StatTile
          helpText="Active members in this Circle"
          label="Circle Members"
          value={summary.totalMembers}
        />
        <StatTile
          helpText="Members with a completed result"
          label="Completed"
          value={summary.completedMembers.length}
        />
        <StatTile
          helpText="Incomplete attempts currently visible"
          label="In Progress"
          value={summary.inProgressMembers.length}
        />
        <StatTile
          helpText="Members without a visible attempt"
          label="Not Started"
          value={summary.notStartedMembers.length}
        />
      </div>

      {summary.completedMembers.length === 0 ? (
        <div className="coach-empty-state">
          No Circle members have completed the {summary.config.name} yet.
        </div>
      ) : null}

      <div className="coach-assessment-member-list">
        {[...summary.completedMembers, ...summary.inProgressMembers, ...summary.notStartedMembers]
          .sort((first, second) => first.name.localeCompare(second.name))
          .map((member) => (
            <AssessmentMemberStatus
              key={member.id}
              member={member}
              onOpenAssessment={onOpenAssessment}
              onOpenMember={onOpenMember}
            />
          ))}
      </div>
    </div>
  );
}
function AssessmentMemberStatus({
  member,
  onOpenAssessment,
  onOpenMember,
}: {
  member: CoachCircleMemberCard;
  onOpenAssessment: (assessmentId: string) => void;
  onOpenMember: (memberId: string) => void;
}) {
  const assessment = member.latestAssessment;
  const status = assessment ? "Completed" : "Not started";

  return (
    <article className="coach-assessment-member-card">
      <div>
        <span>{status}</span>
        <strong>{member.name}</strong>
        <small>{member.email || "No email available"}</small>
      </div>
      {assessment ? (
        <div>
          <small>{formatDate(assessment.completionDate)}</small>
          <p>{assessment.profileTitle}</p>
        </div>
      ) : (
        <p>No completed result yet.</p>
      )}
      <div className="coach-note-actions">
        <button
          className="admin-link-button"
          type="button"
          onClick={() => onOpenMember(member.id)}
        >
          View Member
        </button>
        {assessment && (
          <button
            className="admin-link-button"
            type="button"
            onClick={() => onOpenAssessment(assessment.assessmentId)}
          >
            View Result
          </button>
        )}
      </div>
    </article>
  );
}

function CircleProgressWorkspace({
  members,
  onOpenMember,
}: {
  members: CoachCircleMemberCard[];
  onOpenMember: (memberId: string) => void;
}) {
  const withProgress = members.filter(
    (member) => member.processStage !== "No growth status documented"
  );
  const followUps = members.filter((member) => member.nextFollowUpAt);
  const attention = members.filter(
    (member) =>
      member.followUpDisplayStatus === "overdue" ||
      member.followUpDisplayStatus === "due_soon"
  );

  return (
    <section>
      <div className="coach-section-head">
        <span className="card-label">Progress</span>
        <h3>Growth and Follow-ups</h3>
      </div>
      <div className="coach-stat-grid">
        <StatTile helpText="Members with growth information" label="Documented" value={withProgress.length} />
        <StatTile helpText="Members with follow-up dates" label="Scheduled" value={followUps.length} />
        <StatTile helpText="Overdue or due soon" label="Needs Attention" value={attention.length} />
      </div>
      {members.length === 0 ? (
        <div className="coach-empty-state">No growth information has been documented yet.</div>
      ) : (
        <div className="coach-member-grid">
          {members.map((member) => (
            <MemberCard key={member.id} member={member} onOpen={onOpenMember} />
          ))}
        </div>
      )}
    </section>
  );
}

function MemberDetail({
  member,
  onDeleteMemberNote,
  memberDetailRef,
  onOpenAssessment,
  onSaveGrowthStatus,
  onSaveMemberNote,
}: {
  member: CoachMemberPayload;
  onDeleteMemberNote: (profileId: string, noteId: string) => void;
  memberDetailRef: RefObject<HTMLElement | null>;
  onOpenAssessment: (assessmentId: string) => void;
  onSaveGrowthStatus: (profileId: string, values: GrowthFormState) => Promise<void>;
  onSaveMemberNote: (
    profileId: string,
    values: ProfileNoteFormState,
    noteId?: string | null
  ) => Promise<void>;
}) {
  return (
    <section className="coach-member-detail" ref={memberDetailRef}>
      <div className="coach-member-detail-head">
        <span className="coach-member-avatar">{member.profile.initials}</span>
        <div>
          <span className="card-label">Member Detail</span>
          <h3>{member.profile.name}</h3>
          <p>
            {member.profile.email || "No email"} ·{" "}
            {[member.profile.organization, member.profile.jobTitle]
              .filter(Boolean)
              .join(" · ") || "Profile basics only"}
          </p>
        </div>
      </div>

      <div className="coach-detail-grid">
        <DetailPanel title="Relevant Circles">
          {member.relevantCircles.length === 0 ? (
            <EmptyLine>No active Circle membership.</EmptyLine>
          ) : (
            member.relevantCircles.map((circle) => (
              <InfoLine
                key={circle.id}
                label={circle.name}
                value={`${circle.memberCount} members · ${formatCoachNames(circle.coaches)}`}
              />
            ))
          )}
        </DetailPanel>

        <DetailPanel title="Assigned Coaches">
          {member.assignedCoaches.length === 0 ? (
            <EmptyLine>No assigned coach.</EmptyLine>
          ) : (
            member.assignedCoaches.map((coach) => (
              <InfoLine key={coach.id} label={coach.name} value={coach.email} />
            ))
          )}
        </DetailPanel>

        <DetailPanel title="Assessments">
          {member.assessments.length === 0 ? (
            <EmptyLine>No completed assessments yet.</EmptyLine>
          ) : (
            member.assessments.map((assessment) => (
              <article className="coach-assessment-card" key={assessment.assessmentId}>
                <span>{assessment.assessmentName}</span>
                <strong>{assessment.profileTitle}</strong>
                <small>
                  {formatDate(assessment.completionDate)} · {assessment.peaceAnchor} ·{" "}
                  {assessment.pressureResponse}
                </small>
                <button
                  className="admin-link-button"
                  type="button"
                  onClick={() => onOpenAssessment(assessment.assessmentId)}
                >
                  View Result
                </button>
              </article>
            ))
          )}
        </DetailPanel>

        <GrowthEditor
          growthStatus={member.growthStatus}
          onSave={(values) => onSaveGrowthStatus(member.profile.id, values)}
        />

        <MemberNotesPanel
          notes={member.notes}
          notesMessage={member.notesMessage}
          onDelete={(noteId) => onDeleteMemberNote(member.profile.id, noteId)}
          onSave={(values, noteId) =>
            onSaveMemberNote(member.profile.id, values, noteId)
          }
        />

        <MonthlyQuestionReflectionsPanel
          reflections={member.monthlyQuestionReflections}
        />

        <DetailPanel title="Activity">
          {member.activity.length === 0 ? (
            <EmptyLine>No recent activity available.</EmptyLine>
          ) : (
            member.activity.map((item) => (
              <InfoLine
                key={item.key}
                label={item.label}
                value={`${formatDate(item.date)} · ${item.detail}`}
              />
            ))
          )}
        </DetailPanel>
      </div>
    </section>
  );
}

function MonthlyQuestionReflectionsPanel({
  reflections,
}: {
  reflections: CoachMemberPayload["monthlyQuestionReflections"];
}) {
  if (reflections.length === 0) return null;

  return (
    <section className="coach-detail-panel coach-reflections-panel">
      <div className="coach-panel-head">
        <h4>Monthly Question Reflections</h4>
        <span>Member-authored · Read only</span>
      </div>
      <div className="coach-reflection-list">
        {reflections.map((reflection) => (
          <article className="coach-reflection-card" key={reflection.id}>
            <span className="card-label">
              {[
                formatMonthlyQuestionPeriod(
                  reflection.questionMonth,
                  reflection.questionYear
                ),
                reflection.questionNumber,
              ]
                .filter(Boolean)
                .join(" · ") || "Monthly Question"}
            </span>
            <h5>{reflection.title}</h5>
            <p className="coach-reflection-question">{reflection.question}</p>
            {reflection.circle && (
              <small>Circle: {reflection.circle.name}</small>
            )}
            <p className="coach-reflection-body">{reflection.body}</p>
            <small>Updated {formatDate(reflection.updatedAt)}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

function CircleNotesPanel({
  members,
  notes,
  onDelete,
  onSave,
}: {
  members: CoachCircleMemberCard[];
  notes: CoachCircleNote[];
  onDelete: (noteId: string) => Promise<boolean>;
  onSave: (
    values: CircleNoteFormState,
    noteId?: string | null
  ) => Promise<boolean>;
}) {
  const [filter, setFilter] = useState("all");
  const [author, setAuthor] = useState("all");
  const [sort, setSort] = useState("newest");
  const [followUpsOnly, setFollowUpsOnly] = useState(false);
  const [editing, setEditing] = useState<CoachCircleNote | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CoachCircleNote | null>(null);
  const [showForm, setShowForm] = useState(false);
  const authors = uniqueAuthors(notes);
  const filteredNotes = filterNotes(notes, { author, filter, followUpsOnly, sort });

  return (
    <section className="coach-notes-panel">
      <div className="coach-section-head">
        <span className="card-label">Circle Notes</span>
        <h3>Shared Circle Journey</h3>
        <button
          className="btn btn-secondary"
          type="button"
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
        >
          <Plus size={16} aria-hidden="true" />
          Add Circle Note
        </button>
      </div>
      <NoteFilters
        author={author}
        authors={authors}
        filter={filter}
        followUpsOnly={followUpsOnly}
        noteTypes={circleNoteFilterOptions}
        onAuthorChange={setAuthor}
        onClear={() => {
          setFilter("all");
          setAuthor("all");
          setSort("newest");
          setFollowUpsOnly(false);
        }}
        onFilterChange={setFilter}
        onFollowUpsOnlyChange={setFollowUpsOnly}
        onSortChange={setSort}
        sort={sort}
      />
      {showForm && (
        <CircleNoteForm
          key={editing?.id || "new-circle-note"}
          members={members}
          note={editing}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSave={async (values) => {
            const saved = await onSave(values, editing?.id || null);

            if (saved) {
              setShowForm(false);
              setEditing(null);
            }

            return saved;
          }}
        />
      )}
      <NoteList
        empty="No Circle notes have been added yet."
        notes={filteredNotes}
        onDelete={(noteId) =>
          setPendingDelete(notes.find((note) => note.id === noteId) || null)
        }
        onEdit={(note) => {
          setEditing(note as CoachCircleNote);
          setShowForm(true);
        }}
      />
      {pendingDelete && (
        <div className="coach-confirm-backdrop" role="presentation">
          <section className="coach-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-circle-note-title">
            <span className="card-label">{formatNoteType(pendingDelete.noteType)}</span>
            <h4 id="delete-circle-note-title">Delete this Circle note?</h4>
            <p>{shorten(pendingDelete.body, 140)}</p>
            <small>
              This action permanently removes the note, its member assignments, and its shared
              links.
            </small>
            <div className="coach-form-actions">
              <button className="btn btn-secondary" type="button" onClick={() => setPendingDelete(null)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                type="button"
                onClick={async () => {
                  const deleted = await onDelete(pendingDelete.id);

                  if (deleted) {
                    setPendingDelete(null);
                  }
                }}
              >
                Delete Note
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

function MemberNotesPanel({
  notes,
  notesMessage,
  onDelete,
  onSave,
}: {
  notes: CoachProfileNote[];
  notesMessage: string;
  onDelete: (noteId: string) => void;
  onSave: (values: ProfileNoteFormState, noteId?: string | null) => Promise<void>;
}) {
  const [filter, setFilter] = useState("all");
  const [author, setAuthor] = useState("all");
  const [sort, setSort] = useState("newest");
  const [editing, setEditing] = useState<CoachProfileNote | null>(null);
  const [showForm, setShowForm] = useState(false);
  const authors = uniqueAuthors(notes);
  const filteredNotes = filterNotes(notes, {
    author,
    filter,
    followUpsOnly: filter === "follow_up",
    sort,
  });

  return (
    <section className="coach-detail-panel coach-notes-panel">
      <div className="coach-panel-head">
        <h4>Member Notes</h4>
        <button
          className="btn btn-secondary"
          type="button"
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
        >
          <Plus size={16} aria-hidden="true" />
          Add Member Note
        </button>
      </div>
      <NoteFilters
        author={author}
        authors={authors}
        filter={filter}
        followUpsOnly={false}
        noteTypes={profileNoteFilterOptions}
        onAuthorChange={setAuthor}
        onClear={() => {
          setFilter("all");
          setAuthor("all");
          setSort("newest");
        }}
        onFilterChange={setFilter}
        onFollowUpsOnlyChange={() => undefined}
        onSortChange={setSort}
        sort={sort}
      />
      {showForm && (
        <ProfileNoteForm
          note={editing}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSave={async (values) => {
            await onSave(values, editing?.id || null);
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}
      <NoteList
        empty={notesMessage || "No coach-visible notes have been added for this member."}
        notes={filteredNotes}
        onDelete={onDelete}
        onEdit={(note) => {
          setEditing(note as CoachProfileNote);
          setShowForm(true);
        }}
      />
    </section>
  );
}

function GrowthEditor({
  growthStatus,
  onSave,
}: {
  growthStatus: CoachGrowthStatus | null;
  onSave: (values: GrowthFormState) => Promise<void>;
}) {
  const [form, setForm] = useState(() => growthFormFromStatus(growthStatus));
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setForm(growthFormFromStatus(growthStatus));
      setDirty(false);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [growthStatus]);

  function update(field: keyof GrowthFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setDirty(true);
  }

  return (
    <section className="coach-detail-panel coach-growth-editor">
      <div className="coach-panel-head">
        <h4>Growth & Process</h4>
        <span>{growthStatus?.updatedAt ? `Updated ${formatDate(growthStatus.updatedAt)}` : "No growth status yet"}</span>
      </div>
      <div className="coach-form-grid">
        <SelectField label="Process stage" value={form.processStage} options={processStageOptions} onChange={(value) => update("processStage", value)} />
        <SelectField label="Engagement" value={form.engagementStatus} options={engagementStatusOptions} onChange={(value) => update("engagementStatus", value)} />
        <Field label="Last contact" type="date" value={form.lastContactAt} onChange={(value) => update("lastContactAt", value)} />
        <Field label="Next follow-up" type="date" value={form.nextFollowUpAt} onChange={(value) => update("nextFollowUpAt", value)} />
        <SelectField label="Follow-up status" value={form.followUpStatus} options={followUpStatusOptions} onChange={(value) => update("followUpStatus", value)} />
        <Field label="Completed at" type="datetime-local" value={toDateTimeLocalValue(form.followUpCompletedAt)} onChange={(value) => update("followUpCompletedAt", value ? new Date(value).toISOString() : "")} />
      </div>
      <Field label="Current focus" value={form.currentFocus} onChange={(value) => update("currentFocus", value)} />
      <Field label="Next step" value={form.nextStep} onChange={(value) => update("nextStep", value)} />
      <TextAreaField label="Growth summary" value={form.growthSummary} onChange={(value) => update("growthSummary", value)} />
      <TextAreaField label="Support needs" value={form.supportNeeds} onChange={(value) => update("supportNeeds", value)} />
      <div className="coach-form-actions">
        <button
          className="btn btn-primary"
          disabled={!dirty}
          type="button"
          onClick={() => void onSave(form).then(() => setDirty(false))}
        >
          Save Growth Status
        </button>
      </div>
    </section>
  );
}

function RatioCard({ title, ratio }: { title: string; ratio: CoachRatio }) {
  const percentage = ratio.denominator
    ? Math.round((ratio.numerator / ratio.denominator) * 100)
    : 0;
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <article
      className="coach-ratio-card"
      aria-label={`${title}: ${percentage} percent, ${ratio.numerator} of ${ratio.denominator} members`}
    >
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r={radius} />
        <circle
          cx="50"
          cy="50"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div>
        <strong>{percentage}%</strong>
        <span>{title}</span>
        <small>
          {ratio.numerator} of {ratio.denominator} members
        </small>
      </div>
    </article>
  );
}

function StatTile({
  helpText,
  label,
  value,
}: {
  helpText: string;
  label: string;
  value: number;
}) {
  return (
    <article className="coach-stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helpText}</small>
    </article>
  );
}

function ToolTile({
  active,
  description,
  detail,
  icon: Icon,
  onClick,
  title,
}: {
  active: boolean;
  description: string;
  detail: string;
  icon: LucideIcon;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      className={`coach-tool-tile${active ? " active" : ""}`}
      type="button"
      onClick={onClick}
    >
      <span aria-hidden="true">
        <Icon size={22} strokeWidth={1.8} />
      </span>
      <strong>{title}</strong>
      <p>{description}</p>
      <small>{detail}</small>
    </button>
  );
}

function DetailPanel({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <section className="coach-detail-panel">
      <h4>{title}</h4>
      <div>{children}</div>
    </section>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <strong>{label}</strong>
      <span>{value}</span>
    </p>
  );
}

function EmptyLine({ children }: { children: ReactNode }) {
  return <div className="coach-empty-line">{children}</div>;
}

function NoteFilters({
  author,
  authors,
  filter,
  followUpsOnly,
  noteTypes,
  onAuthorChange,
  onClear,
  onFilterChange,
  onFollowUpsOnlyChange,
  onSortChange,
  sort,
}: {
  author: string;
  authors: Array<{ id: string; name: string }>;
  filter: string;
  followUpsOnly: boolean;
  noteTypes: Array<{ value: string; label: string }>;
  onAuthorChange: (value: string) => void;
  onClear: () => void;
  onFilterChange: (value: string) => void;
  onFollowUpsOnlyChange: (value: boolean) => void;
  onSortChange: (value: string) => void;
  sort: string;
}) {
  return (
    <div className="coach-note-filters">
      <select value={filter} onChange={(event) => onFilterChange(event.target.value)}>
        <option value="all">All types</option>
        {noteTypes.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {authors.length > 1 && (
        <select value={author} onChange={(event) => onAuthorChange(event.target.value)}>
          <option value="all">All authors</option>
          {authors.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      )}
      <select value={sort} onChange={(event) => onSortChange(event.target.value)}>
        <option value="newest">Newest first</option>
        <option value="oldest">Oldest first</option>
      </select>
      <label className="coach-check-filter">
        <input
          checked={followUpsOnly}
          type="checkbox"
          onChange={(event) => onFollowUpsOnlyChange(event.target.checked)}
        />
        Follow-ups only
      </label>
      <button className="admin-link-button" type="button" onClick={onClear}>
        Clear filters
      </button>
    </div>
  );
}

function CircleNoteForm({
  members,
  note,
  onCancel,
  onSave,
}: {
  members: CoachCircleMemberCard[];
  note: CoachCircleNote | null;
  onCancel: () => void;
  onSave: (values: CircleNoteFormState) => Promise<boolean>;
}) {
  const [form, setForm] = useState<CircleNoteFormState>({
    noteType: note?.noteType || "general",
    body: note?.body || "",
    visibility: note?.visibility || "coaches",
    audienceType:
      note?.audienceType && note.audienceType !== "internal"
        ? note.audienceType
        : "all_circle_members",
    recipientIds: note?.recipients.map((recipient) => recipient.id) || [],
    links:
      note?.links.map((link, index) => ({
        id: link.id,
        label: link.label,
        url: link.url,
        sortOrder: link.sortOrder ?? index,
      })) || [],
    meetingDate: note?.meetingDate || "",
    followUpAt: note?.followUpAt || "",
  });
  const [dirty, setDirty] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");

  function update(field: keyof CircleNoteFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setDirty(true);
  }

  function updateRecipient(profileId: string) {
    setForm((current) => ({
      ...current,
      recipientIds: current.recipientIds.includes(profileId)
        ? current.recipientIds.filter((id) => id !== profileId)
        : [...current.recipientIds, profileId],
    }));
    setDirty(true);
  }

  function addLink() {
    setForm((current) => ({
      ...current,
      links: [
        ...current.links,
        {
          label: "",
          url: "",
          sortOrder: current.links.length,
        },
      ],
    }));
    setDirty(true);
  }

  function updateLink(index: number, field: "label" | "url", value: string) {
    setForm((current) => ({
      ...current,
      links: current.links.map((link, linkIndex) =>
        linkIndex === index ? { ...link, [field]: value } : link
      ),
    }));
    setDirty(true);
  }

  function removeLink(index: number) {
    setForm((current) => ({
      ...current,
      links: current.links
        .filter((_, linkIndex) => linkIndex !== index)
        .map((link, linkIndex) => ({ ...link, sortOrder: linkIndex })),
    }));
    setDirty(true);
  }

  const visibleMembers = members.filter((member) =>
    [member.name, member.email].join(" ").toLowerCase().includes(memberSearch.toLowerCase())
  );

  return (
    <div className="coach-note-form">
      <div className="coach-form-grid">
        <SelectField label="Note type" value={form.noteType} options={circleNoteTypeOptions} onChange={(value) => update("noteType", value)} />
        <SelectField label="Who should receive this note?" value={form.audienceType} options={circleAudienceOptions} onChange={(value) => update("audienceType", value)} />
        <Field label="Meeting date" type="date" value={form.meetingDate} onChange={(value) => update("meetingDate", value)} />
        <Field label="Follow-up date" type="date" value={form.followUpAt} onChange={(value) => update("followUpAt", value)} />
      </div>
      {form.audienceType === "selected_members" && (
        <div className="coach-recipient-picker">
          <div className="coach-panel-head">
            <strong>{form.recipientIds.length} selected member{form.recipientIds.length === 1 ? "" : "s"}</strong>
            <div>
              <button
                className="admin-link-button"
                type="button"
                onClick={() => {
                  setForm((current) => ({
                    ...current,
                    recipientIds: members.map((member) => member.id),
                  }));
                  setDirty(true);
                }}
              >
                Select All
              </button>
              <button
                className="admin-link-button"
                type="button"
                onClick={() => {
                  setForm((current) => ({ ...current, recipientIds: [] }));
                  setDirty(true);
                }}
              >
                Clear Selection
              </button>
            </div>
          </div>
          <Field label="Search members" value={memberSearch} onChange={setMemberSearch} />
          <div className="coach-recipient-grid">
            {visibleMembers.map((member) => (
              <label key={member.id}>
                <input
                  checked={form.recipientIds.includes(member.id)}
                  type="checkbox"
                  onChange={() => updateRecipient(member.id)}
                />
                <span>{member.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}
      <TextAreaField label="Note" value={form.body} onChange={(value) => update("body", value)} />
      <p className="admin-form-help">
        {form.audienceType === "selected_members"
          ? "This will appear on the selected members’ My Dashboards."
          : "This will appear on the dashboards of active members in this Circle."}
      </p>
      <div className="coach-note-link-editor">
        <div className="coach-panel-head">
          <div>
            <strong>Shared Links</strong>
            <span>Optional references attached to this Circle note.</span>
          </div>
          <button
            className="admin-link-button"
            disabled={form.links.length >= 10}
            type="button"
            onClick={addLink}
          >
            Add Another Link
          </button>
        </div>
        {form.links.length > 0 && (
          <div className="coach-note-link-list">
            {form.links.map((link, index) => (
              <div className="coach-note-link-row" key={link.id || `new-link-${index}`}>
                <div className="coach-note-link-fields">
                  <Field
                    label="Link label"
                    value={link.label}
                    onChange={(value) => updateLink(index, "label", value)}
                  />
                  <Field
                    label="URL"
                    value={link.url}
                    onChange={(value) => updateLink(index, "url", value)}
                  />
                </div>
                <button
                  className="admin-link-button danger"
                  type="button"
                  onClick={() => removeLink(index)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <FormActions
        dirty={dirty}
        onCancel={() => guardedCancel(dirty, onCancel)}
        onSave={() => void onSave(form)}
        saveLabel={note ? "Update Note" : "Save Note"}
      />
    </div>
  );
}

function ProfileNoteForm({
  note,
  onCancel,
  onSave,
}: {
  note: CoachProfileNote | null;
  onCancel: () => void;
  onSave: (values: ProfileNoteFormState) => Promise<void>;
}) {
  const [form, setForm] = useState<ProfileNoteFormState>({
    noteType: note?.noteType || "general",
    body: note?.body || "",
    visibility:
      note?.visibility && note.visibility !== "admins"
        ? note.visibility
        : "circle_coaches",
  });
  const [dirty, setDirty] = useState(false);

  function update(field: keyof ProfileNoteFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setDirty(true);
  }

  return (
    <div className="coach-note-form">
      <div className="coach-form-grid">
        <SelectField label="Note type" value={form.noteType} options={profileNoteTypeOptions} onChange={(value) => update("noteType", value)} />
        <SelectField label="Visibility" value={form.visibility} options={profileVisibilityOptions} onChange={(value) => update("visibility", value)} />
      </div>
      <TextAreaField label="Note" value={form.body} onChange={(value) => update("body", value)} />
      <FormActions
        dirty={dirty}
        onCancel={() => guardedCancel(dirty, onCancel)}
        onSave={() => void onSave(form)}
        saveLabel={note ? "Update Note" : "Save Note"}
      />
    </div>
  );
}

function NoteList({
  empty,
  notes,
  onDelete,
  onEdit,
}: {
  empty: string;
  notes: Array<CoachCircleNote | CoachProfileNote>;
  onDelete: (noteId: string) => void;
  onEdit: (note: CoachCircleNote | CoachProfileNote) => void;
}) {
  if (notes.length === 0) return <EmptyLine>{empty}</EmptyLine>;

  return (
    <div className="coach-note-list">
      {notes.map((note) => (
        <article className="coach-note-card" key={note.id}>
          <div>
            <span>{formatNoteType(note.noteType)}</span>
            <strong>{note.author.name}</strong>
            <small>
              {formatDate(note.createdAt)} · {formatAudienceLabel(note)}
            </small>
            {"meetingDate" in note && note.meetingDate && (
              <small>Meeting: {formatDate(note.meetingDate)}</small>
            )}
            {"followUpAt" in note && note.followUpAt && (
              <small>Follow-up: {formatDate(note.followUpAt)}</small>
            )}
          </div>
          {"recipients" in note && note.recipients.length > 0 && (
            <details className="coach-recipient-details">
              <summary>{note.recipients.length} selected member{note.recipients.length === 1 ? "" : "s"}</summary>
              <ul>
                {note.recipients.map((recipient) => (
                  <li key={recipient.id}>{recipient.name}</li>
                ))}
              </ul>
            </details>
          )}
          <p>{note.body}</p>
          {"links" in note && note.links.length > 0 && (
            <div className="coach-note-shared-links">
              <strong>Shared Links</strong>
              <div>
                {note.links.map((link) => (
                  <a
                    aria-label={`Open ${formatCircleNoteLinkLabel(link)} in a new tab`}
                    href={link.url}
                    key={link.id || link.url}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <ExternalLink size={14} aria-hidden="true" />
                    {formatCircleNoteLinkLabel(link)}
                  </a>
                ))}
              </div>
            </div>
          )}
          {(note.canEdit || note.canDelete) && (
            <div className="coach-note-actions">
              {note.canEdit && (
                <button className="admin-link-button" type="button" onClick={() => onEdit(note)}>
                  Edit
                </button>
              )}
              {note.canDelete && (
                <button className="admin-link-button danger" type="button" onClick={() => onDelete(note.id)}>
                  <Trash2 size={14} aria-hidden="true" />
                  Delete
                </button>
              )}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

function Field({
  inputRef,
  label,
  onChange,
  type = "text",
  value,
}: {
  inputRef?: RefObject<HTMLInputElement | null>;
  label: string;
  onChange: (value: string) => void;
  type?: string;
  value: string;
}) {
  return (
    <label className="coach-field">
      <span>{label}</span>
      <input ref={inputRef} type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function TextAreaField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="coach-field">
      <span>{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function getMonthlyQuestionYearOptions() {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 7 }, (_, index) => {
    const year = currentYear - 1 + index;
    return { value: String(year), label: String(year) };
  });
}

function SelectField({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  value: string;
}) {
  return (
    <label className="coach-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Not set</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function FormActions({
  dirty,
  onCancel,
  onSave,
  saveLabel,
}: {
  dirty: boolean;
  onCancel: () => void;
  onSave: () => void;
  saveLabel: string;
}) {
  return (
    <div className="coach-form-actions">
      <button className="btn btn-primary" disabled={!dirty} type="button" onClick={onSave}>
        {saveLabel}
      </button>
      <button className="btn btn-secondary" type="button" onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}

function CoachState({
  message,
  onAction,
  title,
}: {
  message: string;
  onAction: () => void;
  title: string;
}) {
  return (
    <section className="coach-shell">
      <div className="container">
        <div className="admin-state portal-card">
          <span className="card-label">Coach Dashboard</span>
          <h1>{title}</h1>
          <p>{message}</p>
          <button className="btn btn-primary" type="button" onClick={onAction}>
            Continue
          </button>
        </div>
      </div>
    </section>
  );
}

async function getAccessToken() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.access_token || "";
}

function isCoachWorkspaceId(value: string): value is CoachWorkspaceId {
  return coachWorkspaceIds.includes(value as CoachWorkspaceId);
}

function filterResourceLibrary(resources: CoachResource[], search: string) {
  const normalizedSearch = search.trim().toLowerCase();

  if (!normalizedSearch) return resources;

  return resources.filter((resource) =>
    [
      resource.title,
      resource.description,
      resource.resourceType,
      resource.category,
      resource.provider,
      ...resource.tags,
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearch)
  );
}

function formatResourceType(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getWorkspaceFromUrl() {
  if (typeof window === "undefined") return null;

  const workspace = new URLSearchParams(window.location.search).get("workspace") || "";
  if (workspace === "notes") return "circle-notes";

  return isCoachWorkspaceId(workspace) ? workspace : null;
}

function getCircleFromUrl() {
  if (typeof window === "undefined") return "";

  const circleId = new URLSearchParams(window.location.search).get("circle") || "";
  return circleId || window.location.hash.replace("#circle-", "");
}

function updateCoachUrl(circleId: string, workspaceId: CoachWorkspaceId | null) {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);

  if (circleId) {
    params.set("circle", circleId);
  } else {
    params.delete("circle");
  }

  if (workspaceId) {
    params.set("workspace", workspaceId);
  } else {
    params.delete("workspace");
  }

  const query = params.toString();
  const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}`;

  window.history.pushState(null, "", nextUrl);
}

function getWorkspaceLoadingMessage(workspaceId: CoachWorkspaceId | null) {
  if (workspaceId === "members") return "Loading Circle members...";
  if (workspaceId === "assessments") return "Loading Circle assessments...";
  if (workspaceId === "progress") return "Loading Circle progress...";
  if (workspaceId === "circle-notes") return "Loading Circle notes...";
  if (workspaceId === "monthly-questions") return "Loading monthly questions...";
  if (workspaceId === "resources") return "Loading Circle resources...";
  if (workspaceId === "trainings") return "Loading Circle trainings...";
  if (workspaceId === "messages") return "Loading Messages...";
  return "Loading selected Circle...";
}

async function logCoachApiError(label: string, response: Response, method = "unknown") {
  const snapshot = await readCoachApiError(response, method);

  console.error(label, {
    url: response.url,
    method: snapshot.method,
    status: response.status,
    statusText: response.statusText,
    rawText: snapshot.rawText,
    parsedJson: snapshot.json,
    code: snapshot.json?.code || snapshot.json?.error || "unknown_error",
    message: snapshot.json?.message || response.statusText,
    details: snapshot.json?.details,
    hint: snapshot.json?.hint,
  });

  return snapshot;
}

async function readCoachApiError(
  response: Response,
  method = "unknown"
): Promise<CoachApiErrorSnapshot> {
  const rawText = await response.clone().text().catch(() => "");
  let json: CoachApiError | null = null;

  try {
    json = rawText ? (JSON.parse(rawText) as CoachApiError) : null;
  } catch {
    json = null;
  }

  return {
    url: response.url,
    method,
    status: response.status,
    statusText: response.statusText,
    rawText,
    json,
  };
}

function uniqueAuthors(notes: Array<CoachCircleNote | CoachProfileNote>) {
  const authors = new Map<string, string>();

  notes.forEach((note) => {
    if (note.author.id) authors.set(note.author.id, note.author.name);
  });

  return Array.from(authors.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function upsertCircleNote(notes: CoachCircleNote[], incoming: CoachCircleNote) {
  const next = notes.some((note) => note.id === incoming.id)
    ? notes.map((note) => (note.id === incoming.id ? incoming : note))
    : [incoming, ...notes];

  return next.sort((first, second) =>
    String(second.createdAt || "").localeCompare(String(first.createdAt || ""))
  );
}

function filterMonthlyQuestionLibrary(
  questions: CoachMonthlyQuestion[],
  search: string
) {
  const normalizedSearch = search.trim().toLowerCase();

  return questions
    .filter(
      (question) =>
        !normalizedSearch ||
        [
          question.title,
          question.openingReflection,
          question.questionText,
          question.guidance,
          ...question.discussionPrompts,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch)
    )
    .sort((first, second) => {
      return String(second.updatedAt || second.createdAt || "").localeCompare(
        String(first.updatedAt || first.createdAt || "")
      );
    });
}

function buildAssessmentTypeSummary(
  config: CoachAssessmentTypeConfig,
  members: CoachCircleMemberCard[]
): CoachAssessmentTypeSummary {
  const completedMembers = members.filter(
    (member) => member.latestAssessment?.assessmentKey === config.id
  );
  const completedIds = new Set(completedMembers.map((member) => member.id));
  const inProgressMembers: CoachCircleMemberCard[] = [];
  const notStartedMembers = members.filter((member) => !completedIds.has(member.id));
  const completionPercentage =
    members.length === 0
      ? 0
      : Math.round((completedMembers.length / members.length) * 100);
  const latestCompletionDate =
    completedMembers
      .map((member) => member.latestAssessment?.completionDate || "")
      .filter(Boolean)
      .sort((first, second) => second.localeCompare(first))[0] || null;

  return {
    config,
    isAvailable: config.id === "peace-assessment",
    totalMembers: members.length,
    completedMembers,
    inProgressMembers,
    notStartedMembers,
    completionPercentage,
    latestCompletionDate,
  };
}

function filterNotes<T extends CoachCircleNote | CoachProfileNote>(
  notes: T[],
  filters: {
    author: string;
    filter: string;
    followUpsOnly: boolean;
    sort: string;
  }
) {
  return notes
    .filter((note) => filters.filter === "all" || note.noteType === filters.filter)
    .filter((note) => filters.author === "all" || note.author.id === filters.author)
    .filter((note) => {
      if (!filters.followUpsOnly) return true;
      return note.noteType === "follow_up" || ("followUpAt" in note && Boolean(note.followUpAt));
    })
    .sort((a, b) => {
      const result = String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
      return filters.sort === "oldest" ? -result : result;
    });
}

function growthFormFromStatus(status: CoachGrowthStatus | null): GrowthFormState {
  return {
    processStage: status?.processStage || "",
    engagementStatus: status?.engagementStatus || "",
    currentFocus: status?.currentFocus || "",
    nextStep: status?.nextStep || "",
    lastContactAt: status?.lastContactAt || "",
    nextFollowUpAt: status?.nextFollowUpAt || "",
    followUpStatus: status?.followUpStatus || "none",
    followUpCompletedAt: status?.followUpCompletedAt || "",
    growthSummary: status?.growthSummary || "",
    supportNeeds: status?.supportNeeds || "",
  };
}

async function guardedCancel(dirty: boolean, onCancel: () => void) {
  if (
    dirty &&
    !(await requestConfirmation({
      title: "Discard unsaved changes?",
      description: "Your unsaved form changes will be lost.",
      confirmLabel: "Discard Changes",
      tone: "danger",
    }))
  ) {
    return;
  }
  onCancel();
}

function formatCoachNames(coaches: Array<{ name: string }>) {
  if (coaches.length === 0) return "None";
  return coaches.map((coach) => coach.name).join(" + ");
}

function formatNoteType(value: string) {
  return titleize(value);
}

function formatVisibility(value: string) {
  if (value === "assigned_coaches") return "Assigned Coaches";
  if (value === "circle_coaches") return "Circle Coaches";
  if (value === "admins") return "Administrators Only";
  return "Circle Coaches";
}

function formatAudienceLabel(note: CoachCircleNote | CoachProfileNote) {
  if ("audienceType" in note) {
    if (note.audienceType === "internal") return "Private Coach Note — Legacy";
    if (note.audienceType === "all_circle_members") return "All Circle Members";
    if (note.audienceType === "selected_members") {
      return `${note.recipients.length} Selected Member${
        note.recipients.length === 1 ? "" : "s"
      }`;
    }
    return "All Circle members";
  }

  return formatVisibility(note.visibility);
}

function formatCircleNoteLinkLabel(link: CoachCircleNoteLink) {
  if (link.label) return link.label;

  try {
    return new URL(link.url).hostname || "Open link";
  } catch {
    return "Open link";
  }
}

function formatFollowUpDisplayStatus(value: string) {
  if (value === "overdue") return "Overdue";
  if (value === "due_soon") return "Due soon";
  if (value === "scheduled") return "Scheduled";
  if (value === "completed") return "Completed";
  if (value === "deferred") return "Deferred";
  return "No follow-up";
}

function titleize(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function shorten(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value;
}

function formatDate(value: string | null) {
  if (!value) return "Not set";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function toDateTimeLocalValue(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
