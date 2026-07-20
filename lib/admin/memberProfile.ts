import {
  buildAdminAnalytics,
  type AdminAssessmentRecord,
} from "./assessmentAnalytics";
import { fetchAdminAssessmentData } from "./assessmentQueries";
import { createAdminSupabaseClient } from "./authorization";
import {
  fetchAdminUsersData,
  type AdminManagedProfile,
  type AdminUsersPayload,
} from "./userManagement";
import {
  getMissingProfileCompletionFields,
  isProfileComplete,
} from "../profileCompletion";

export type AdminGrowthStatus = {
  id: string;
  profileId: string;
  processStage: string;
  engagementStatus: string;
  currentFocus: string;
  nextStep: string;
  lastContactAt: string | null;
  nextFollowUpAt: string | null;
  growthSummary: string;
  supportNeeds: string;
  updatedBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type AdminProfileNote = {
  id: string;
  profileId: string;
  authorId: string | null;
  authorName: string;
  noteType: string;
  body: string;
  isPrivate: boolean;
  visibility: AdminProfileNoteVisibility;
  createdAt: string | null;
  updatedAt: string | null;
};

export type AdminProfileNoteVisibility =
  | "admins"
  | "assigned_coaches"
  | "circle_coaches"
  | "member";

export type AdminMemberProfilePayload = {
  ok: true;
  currentAdminId: string;
  userManagementPayload: AdminUsersPayload;
  profile: AdminManagedProfile;
  profileCompletion: {
    complete: boolean;
    missingFields: string[];
  };
  roles: string[];
  activeCircles: Array<{
    id: string;
    name: string;
    description: string;
    status: string;
    coaches: Array<{ id: string; name: string }>;
    memberCount: number;
  }>;
  assignedCoaches: Array<{ id: string; name: string; email: string }>;
  circlesCoached: Array<{
    id: string;
    name: string;
    status: string;
    memberCount: number;
    partnerCoaches: Array<{ id: string; name: string }>;
  }>;
  directAssignments: Array<{ id: string; name: string; email: string }>;
  assessments: AdminAssessmentRecord[];
  dashboardPreview: {
    notice: string;
    latestAssessment: AdminAssessmentRecord | null;
    circleSummary: string;
    coachSummary: string;
    availablePathways: string[];
  };
  growthStatus: AdminGrowthStatus | null;
  notes: AdminProfileNote[];
  activity: Array<{
    key: string;
    label: string;
    date: string | null;
    detail: string;
  }>;
};

type GrowthStatusRow = {
  id: string;
  profile_id: string;
  process_stage: string | null;
  engagement_status: string | null;
  current_focus: string | null;
  next_step: string | null;
  last_contact_at: string | null;
  next_follow_up_at: string | null;
  growth_summary: string | null;
  support_needs: string | null;
  updated_by: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type ProfileNoteRow = {
  id: string;
  profile_id: string;
  author_id: string | null;
  note_type: string | null;
  body: string | null;
  is_private: boolean | null;
  visibility: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type AdminGrowthStatusUpdate = {
  processStage: string;
  engagementStatus: string;
  currentFocus: string;
  nextStep: string;
  lastContactAt: string;
  nextFollowUpAt: string;
  growthSummary: string;
  supportNeeds: string;
};

export type AdminProfileNoteCreate = {
  noteType: string;
  body: string;
  visibility: string;
};

export async function fetchAdminMemberProfile(
  profileId: string,
  currentAdminId: string
): Promise<AdminMemberProfilePayload | null> {
  const [usersPayload, assessmentData] = await Promise.all([
    fetchAdminUsersData(currentAdminId),
    fetchAdminAssessmentData(),
  ]);
  const profile = usersPayload.users.find((user) => user.id === profileId);

  if (!profile) return null;

  const analytics = buildAdminAnalytics(assessmentData);
  const assessments = getLatestAssessmentPerType(
    analytics.records.filter((record) => record.userId === profileId)
  );
  const [growthStatus, notes] = await Promise.all([
    fetchGrowthStatus(profileId),
    fetchProfileNotes(profileId, usersPayload),
  ]);
  const activeCircles = usersPayload.circles
    .filter((circle) => circle.memberIds.includes(profileId))
    .map((circle) => ({
      id: circle.id,
      name: circle.name,
      description: circle.description,
      status: circle.status,
      coaches: circle.coachIds.map((coachId) => ({
        id: coachId,
        name: formatManagedUserNameById(coachId, usersPayload),
      })),
      memberCount: circle.memberIds.length,
    }));
  const assignedCoaches = profile.coachIds.map((coachId) => ({
    id: coachId,
    name: formatManagedUserNameById(coachId, usersPayload),
    email: usersPayload.users.find((user) => user.id === coachId)?.email || "",
  }));
  const circlesCoached = usersPayload.circles
    .filter((circle) => circle.coachIds.includes(profileId))
    .map((circle) => ({
      id: circle.id,
      name: circle.name,
      status: circle.status,
      memberCount: circle.memberIds.length,
      partnerCoaches: circle.coachIds
        .filter((coachId) => coachId !== profileId)
        .map((coachId) => ({
          id: coachId,
          name: formatManagedUserNameById(coachId, usersPayload),
        })),
    }));
  const directAssignments = usersPayload.users
    .filter((user) => user.coachIds.includes(profileId))
    .map((user) => ({
      id: user.id,
      name: formatManagedUserName(user),
      email: user.email,
    }));

  return {
    ok: true,
    currentAdminId,
    userManagementPayload: usersPayload,
    profile,
    profileCompletion: {
      complete: isProfileComplete(profile),
      missingFields: getMissingProfileCompletionFields(profile),
    },
    roles: profile.roles,
    activeCircles,
    assignedCoaches,
    circlesCoached,
    directAssignments,
    assessments,
    dashboardPreview: {
      notice: "This is an administrative preview of the member's dashboard content.",
      latestAssessment: assessments[0] || null,
      circleSummary:
        activeCircles.map((circle) => circle.name).join(", ") ||
        "No active Circle membership.",
      coachSummary:
        assignedCoaches.map((coach) => coach.name).join(", ") ||
        "No assigned coach.",
      availablePathways: [
        "Peace Assessment",
        ...(activeCircles.length > 0 ? ["Circle Journey"] : []),
        ...(profile.roles.includes("coach") ? ["Coach Portal"] : []),
      ],
    },
    growthStatus,
    notes,
    activity: buildActivity({ profile, assessments, growthStatus, notes }),
  };
}

export async function updateAdminGrowthStatus(
  profileId: string,
  adminId: string,
  values: AdminGrowthStatusUpdate
) {
  const supabase = createAdminSupabaseClient();
  const cleaned = cleanGrowthStatus(values);
  const timestamp = new Date().toISOString();
  const { error } = await supabase.from("profile_growth_status").upsert(
    {
      profile_id: profileId,
      process_stage: cleaned.processStage,
      engagement_status: cleaned.engagementStatus,
      current_focus: cleaned.currentFocus,
      next_step: cleaned.nextStep,
      last_contact_at: cleaned.lastContactAt || null,
      next_follow_up_at: cleaned.nextFollowUpAt || null,
      growth_summary: cleaned.growthSummary,
      support_needs: cleaned.supportNeeds,
      updated_by: adminId,
      updated_at: timestamp,
    },
    { onConflict: "profile_id" }
  );

  if (error) {
    console.error("Admin Supabase mutation failed: update growth status", error);
    throw new Error("Unable to save growth status.");
  }

  return { ok: true as const, message: "Growth status was saved." };
}

export async function createAdminProfileNote(
  profileId: string,
  adminId: string,
  values: AdminProfileNoteCreate
) {
  const supabase = createAdminSupabaseClient();
  const body = values.body.trim();
  const visibility = cleanNoteVisibility(values.visibility);

  if (!body) {
    return {
      ok: false as const,
      status: 400,
      message: "Note body is required.",
    };
  }

  const { error } = await supabase.from("profile_notes").insert({
    profile_id: profileId,
    author_id: adminId,
    note_type: cleanNoteType(values.noteType),
    body,
    visibility,
    is_private: visibility === "admins",
  });

  if (error) {
    console.error("Admin Supabase mutation failed: create profile note", error);
    throw new Error("Unable to save note.");
  }

  return {
    ok: true as const,
    message:
      visibility === "member"
        ? "Note was added. This will appear on the selected member’s My Dashboard."
        : "Note was added.",
  };
}

export async function updateAdminProfileNote(
  profileId: string,
  noteId: string,
  values: AdminProfileNoteCreate
) {
  const supabase = createAdminSupabaseClient();
  const body = values.body.trim();
  const visibility = cleanNoteVisibility(values.visibility);

  if (!body) {
    return {
      ok: false as const,
      status: 400,
      message: "Note body is required.",
    };
  }

  const { error } = await supabase
    .from("profile_notes")
    .update({
      note_type: cleanNoteType(values.noteType),
      body,
      visibility,
      is_private: visibility === "admins",
      updated_at: new Date().toISOString(),
    })
    .eq("id", noteId)
    .eq("profile_id", profileId);

  if (error) {
    console.error("Admin Supabase mutation failed: update profile note", error);
    throw new Error("Unable to update note.");
  }

  return {
    ok: true as const,
    message:
      visibility === "member"
        ? "Note was updated. This will appear on the selected member’s My Dashboard."
        : "Note was updated.",
  };
}

export async function deleteAdminProfileNote(profileId: string, noteId: string) {
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("profile_notes")
    .delete()
    .eq("id", noteId)
    .eq("profile_id", profileId);

  if (error) {
    console.error("Admin Supabase mutation failed: delete profile note", error);
    throw new Error("Unable to delete note.");
  }

  return { ok: true as const, message: "Note was deleted." };
}

async function fetchGrowthStatus(profileId: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("profile_growth_status")
    .select(
      "id, profile_id, process_stage, engagement_status, current_focus, next_step, last_contact_at, next_follow_up_at, growth_summary, support_needs, updated_by, created_at, updated_at"
    )
    .eq("profile_id", profileId)
    .maybeSingle();

  if (error) {
    if (isMissingAdminProfileTableError(error, "profile_growth_status")) {
      console.warn("profile_growth_status table is not available yet.");
      return null;
    }

    console.error("Admin Supabase query failed: fetch growth status", error);
    throw new Error("Unable to load growth status.");
  }

  return data ? mapGrowthStatus(data as GrowthStatusRow) : null;
}

async function fetchProfileNotes(
  profileId: string,
  usersPayload: AdminUsersPayload
) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("profile_notes")
    .select(
      "id, profile_id, author_id, note_type, body, is_private, visibility, created_at, updated_at"
    )
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingAdminProfileTableError(error, "profile_notes")) {
      console.warn("profile_notes table is not available yet.");
      return [];
    }

    console.error("Admin Supabase query failed: fetch profile notes", error);
    throw new Error("Unable to load profile notes.");
  }

  return ((data || []) as ProfileNoteRow[]).map((note) =>
    mapProfileNote(note, usersPayload)
  );
}

function mapGrowthStatus(row: GrowthStatusRow): AdminGrowthStatus {
  return {
    id: row.id,
    profileId: row.profile_id,
    processStage: row.process_stage || "",
    engagementStatus: row.engagement_status || "",
    currentFocus: row.current_focus || "",
    nextStep: row.next_step || "",
    lastContactAt: row.last_contact_at,
    nextFollowUpAt: row.next_follow_up_at,
    growthSummary: row.growth_summary || "",
    supportNeeds: row.support_needs || "",
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapProfileNote(
  row: ProfileNoteRow,
  usersPayload: AdminUsersPayload
): AdminProfileNote {
  return {
    id: row.id,
    profileId: row.profile_id,
    authorId: row.author_id,
    authorName: row.author_id
      ? formatManagedUserNameById(row.author_id, usersPayload)
      : "Unknown author",
    noteType: row.note_type || "general",
    body: row.body || "",
    isPrivate: row.is_private !== false,
    visibility: cleanNoteVisibility(row.visibility),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function cleanNoteVisibility(value: unknown): AdminProfileNoteVisibility {
  if (
    value === "assigned_coaches" ||
    value === "circle_coaches" ||
    value === "member"
  ) {
    return value;
  }
  return "admins";
}

function buildActivity({
  profile,
  assessments,
  growthStatus,
  notes,
}: {
  profile: AdminManagedProfile;
  assessments: AdminAssessmentRecord[];
  growthStatus: AdminGrowthStatus | null;
  notes: AdminProfileNote[];
}) {
  return [
    {
      key: "created",
      label: "Account created",
      date: profile.createdAt,
      detail: profile.email,
    },
    {
      key: "updated",
      label: "Profile updated",
      date: profile.updatedAt,
      detail: "Profile information changed.",
    },
    ...assessments.map((assessment) => ({
      key: `assessment-${assessment.assessmentId}`,
      label: "Assessment completed",
      date: assessment.completionDate,
      detail: assessment.profileTitle,
    })),
    ...(growthStatus
      ? [
          {
            key: "growth-status",
            label: "Growth status updated",
            date: growthStatus.updatedAt,
            detail: growthStatus.processStage || "Growth status",
          },
        ]
      : []),
    ...notes.map((note) => ({
      key: `note-${note.id}`,
      label: "Admin note added",
      date: note.createdAt,
      detail: note.noteType,
    })),
  ]
    .filter((item) => item.date)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

function getLatestAssessmentPerType(records: AdminAssessmentRecord[]) {
  const latestByAssessmentKey = new Map<string, AdminAssessmentRecord>();

  records.forEach((record) => {
    const key = record.assessmentKey;
    const current = latestByAssessmentKey.get(key);

    if (!current || compareAssessmentRecords(record, current) < 0) {
      latestByAssessmentKey.set(key, record);
    }
  });

  return Array.from(latestByAssessmentKey.values()).sort(compareAssessmentRecords);
}

function compareAssessmentRecords(
  first: AdminAssessmentRecord,
  second: AdminAssessmentRecord
) {
  const firstTime = first.completionDate
    ? new Date(first.completionDate).getTime()
    : 0;
  const secondTime = second.completionDate
    ? new Date(second.completionDate).getTime()
    : 0;

  if (firstTime !== secondTime) return secondTime - firstTime;

  return second.assessmentId.localeCompare(first.assessmentId);
}

function cleanGrowthStatus(values: AdminGrowthStatusUpdate) {
  return {
    processStage: values.processStage.trim(),
    engagementStatus: values.engagementStatus.trim(),
    currentFocus: values.currentFocus.trim(),
    nextStep: values.nextStep.trim(),
    lastContactAt: values.lastContactAt.trim(),
    nextFollowUpAt: values.nextFollowUpAt.trim(),
    growthSummary: values.growthSummary.trim(),
    supportNeeds: values.supportNeeds.trim(),
  };
}

function cleanNoteType(value: string) {
  const cleaned = value.trim().toLowerCase();
  return cleaned || "general";
}

function formatManagedUserNameById(
  userId: string,
  usersPayload: AdminUsersPayload
) {
  const user = usersPayload.users.find((item) => item.id === userId);
  return user ? formatManagedUserName(user) : "Unknown profile";
}

function formatManagedUserName(user: AdminManagedProfile) {
  const name = [user.firstName, user.lastName]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");

  return name || user.email || "Unnamed profile";
}

function isMissingAdminProfileTableError(error: unknown, tableName: string) {
  if (!error || typeof error !== "object") return false;

  const values = Object.values(error as Record<string, unknown>)
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();

  return values.includes(tableName) && values.includes("relation");
}
import "server-only";
