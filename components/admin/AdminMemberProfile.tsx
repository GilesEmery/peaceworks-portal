"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import ResultModal from "../assessment/ResultModal";
import AdminUsersManager from "./AdminUsersManager";
import { supabase } from "../../lib/supabase";
import type { PeaceAssessmentResult } from "../../lib/peaceAssessmentScoring";
import type {
  AdminGrowthStatus,
  AdminMemberProfilePayload,
} from "../../lib/admin/memberProfile";
import type { AdminAssessmentRecord } from "../../lib/admin/assessmentAnalytics";

type LoadState = "loading" | "ready" | "denied" | "error";
type SaveState = "idle" | "saving" | "success" | "error";

const noteTypes = [
  "general",
  "coaching",
  "growth",
  "follow_up",
  "care",
  "administrative",
];

export default function AdminMemberProfile({
  profileId,
}: {
  profileId: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<LoadState>("loading");
  const [payload, setPayload] = useState<AdminMemberProfilePayload | null>(null);
  const [message, setMessage] = useState("");
  const [growthState, setGrowthState] = useState<SaveState>("idle");
  const [noteState, setNoteState] = useState<SaveState>("idle");
  const [noteType, setNoteType] = useState("general");
  const [noteBody, setNoteBody] = useState("");
  const [editingNoteId, setEditingNoteId] = useState("");
  const [modalResult, setModalResult] = useState<PeaceAssessmentResult | null>(
    null
  );
  const [growthForm, setGrowthForm] = useState(() => emptyGrowthForm());

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  const profileName = payload ? formatPersonName(payload.profile) : "Member";
  const latestAssessment = payload?.assessments[0] || null;
  const initials = getInitials(payload?.profile.firstName, payload?.profile.lastName);

  async function loadProfile() {
    setState("loading");
    setMessage("");

    const token = await getAccessToken();

    if (!token) {
      router.replace("/auth");
      return;
    }

    const response = await fetch(`/api/admin/people/${profileId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
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

    const nextPayload = (await response.json()) as AdminMemberProfilePayload;
    setPayload(nextPayload);
    setGrowthForm(
      nextPayload.growthStatus ? growthToForm(nextPayload.growthStatus) : emptyGrowthForm()
    );
    setState("ready");
  }

  async function saveGrowthStatus() {
    setGrowthState("saving");
    setMessage("");

    const token = await getAccessToken();

    if (!token) {
      router.replace("/auth");
      return;
    }

    const response = await fetch(`/api/admin/people/${profileId}/growth`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(growthForm),
    });

    if (!response.ok) {
      setGrowthState("error");
      setMessage("Growth status could not be saved.");
      return;
    }

    setGrowthState("success");
    setMessage("Growth status was saved.");
    await loadProfile();
  }

  async function saveNote() {
    setNoteState("saving");
    setMessage("");

    const token = await getAccessToken();

    if (!token) {
      router.replace("/auth");
      return;
    }

    const response = await fetch(
      editingNoteId
        ? `/api/admin/people/${profileId}/notes/${editingNoteId}`
        : `/api/admin/people/${profileId}/notes`,
      {
        method: editingNoteId ? "PATCH" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          noteType,
          body: noteBody,
          isPrivate: true,
        }),
      }
    );

    if (!response.ok) {
      setNoteState("error");
      setMessage("Note could not be saved.");
      return;
    }

    setNoteState("success");
    setEditingNoteId("");
    setNoteBody("");
    setMessage(editingNoteId ? "Note was updated." : "Note was added.");
    await loadProfile();
  }

  async function deleteNote(noteId: string) {
    setNoteState("saving");
    setMessage("");

    const token = await getAccessToken();

    if (!token) {
      router.replace("/auth");
      return;
    }

    const response = await fetch(`/api/admin/people/${profileId}/notes/${noteId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      setNoteState("error");
      setMessage("Note could not be deleted.");
      return;
    }

    setNoteState("success");
    setMessage("Note was deleted.");
    await loadProfile();
  }

  async function openAssessment(record: AdminAssessmentRecord) {
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

    const resultPayload = (await response.json()) as {
      ok: true;
      result: PeaceAssessmentResult;
    };

    setModalResult(resultPayload.result);
  }

  const activity = useMemo(() => payload?.activity || [], [payload]);

  if (state === "loading") {
    return (
      <section className="admin-shell">
        <div className="container">
          <div className="admin-loading portal-card">Loading member profile...</div>
        </div>
      </section>
    );
  }

  if (state === "denied") {
    return (
      <AdminMemberState
        title="Admin access required"
        message="This member profile is limited to approved PeaceWorks administrators."
        onAction={() => router.push("/dashboard")}
      />
    );
  }

  if (state === "error" || !payload) {
    return (
      <AdminMemberState
        title="Member profile unavailable"
        message="The profile could not be loaded. Check admin configuration and try again."
        onAction={loadProfile}
      />
    );
  }

  return (
    <>
      <section className="admin-member-shell">
        <div className="container">
          <button
            className="admin-link-button admin-member-back"
            type="button"
            onClick={() => router.push("/admin")}
          >
            Back to Admin Dashboard
          </button>

          <header className="admin-member-header portal-card">
            <div className="admin-member-avatar" aria-hidden="true">
              {initials}
            </div>
            <div>
              <span className="card-label">Admin Member Profile</span>
              <h1>{profileName}</h1>
              <p>{payload.profile.email || "No email available"}</p>
              <div className="admin-member-tag-row">
                <span>{payload.profile.accountStatus}</span>
                {payload.profile.roles.map((role) => (
                  <span key={role}>{formatRoleName(role)}</span>
                ))}
                <span>
                  {payload.profileCompletion.complete
                    ? "Profile complete"
                    : `Missing ${payload.profileCompletion.missingFields.join(", ")}`}
                </span>
              </div>
            </div>
            <div className="admin-member-header-actions">
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => router.push(`/admin#people`)}
              >
                Edit Access
              </button>
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => router.push(`/admin#people`)}
              >
                Manage Account
              </button>
            </div>
          </header>

          {message && <div className="admin-message success">{message}</div>}

          <div className="admin-member-section-grid">
            <ProfileOverview payload={payload} latestAssessment={latestAssessment} />
            <MemberDashboardPreview payload={payload} onOpenAssessment={openAssessment} />
            <AssessmentHistory
              assessments={payload.assessments}
              onOpenAssessment={openAssessment}
            />
            <CircleCoachingSummary payload={payload} />
            <GrowthStatusPanel
              form={growthForm}
              saveState={growthState}
              onChange={(field, value) =>
                setGrowthForm((current) => ({ ...current, [field]: value }))
              }
              onSave={saveGrowthStatus}
            />
            <ProfileNotes
              body={noteBody}
              noteState={noteState}
              noteType={noteType}
              notes={payload.notes}
              editingNoteId={editingNoteId}
              onBodyChange={setNoteBody}
              onDelete={deleteNote}
              onEdit={(note) => {
                setEditingNoteId(note.id);
                setNoteType(note.noteType);
                setNoteBody(note.body);
              }}
              onEditCancel={() => {
                setEditingNoteId("");
                setNoteType("general");
                setNoteBody("");
              }}
              onNoteTypeChange={setNoteType}
              onSave={saveNote}
            />
            <ProfileActivityTimeline activity={activity} />
            <section className="admin-member-panel portal-card admin-member-wide">
              <div className="admin-member-panel-head">
                <span className="card-label">Account Management</span>
                <h2>People & Access controls</h2>
                <p>
                  This reuses the existing user-management workflow for profile
                  fields, roles, Circle memberships, assigned coaches, and
                  account lifecycle actions.
                </p>
              </div>
              <AdminUsersManager
                embedded
                initialPayload={payload.userManagementPayload}
                focusedUserId={payload.profile.id}
                onPayloadChange={() => loadProfile()}
              />
            </section>
          </div>
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

function ProfileOverview({
  payload,
  latestAssessment,
}: {
  payload: AdminMemberProfilePayload;
  latestAssessment: AdminAssessmentRecord | null;
}) {
  return (
    <section className="admin-member-panel portal-card">
      <div className="admin-member-panel-head">
        <span className="card-label">Overview</span>
        <h2>Profile information</h2>
      </div>
      <dl className="admin-member-facts">
        <Fact label="First name" value={payload.profile.firstName || "Missing"} />
        <Fact label="Last name" value={payload.profile.lastName || "Missing"} />
        <Fact label="Organization" value={payload.profile.organization || "Not set"} />
        <Fact label="Job title" value={payload.profile.jobTitle || "Not set"} />
        <Fact label="Timezone" value={payload.profile.timezone || "Not set"} />
        <Fact label="Last updated" value={formatDate(payload.profile.updatedAt)} />
        <Fact label="Active Circles" value={payload.activeCircles.length} />
        <Fact label="Assigned Coaches" value={payload.assignedCoaches.length} />
        <Fact
          label="Latest Assessment"
          value={latestAssessment?.profileTitle || "No completed assessments yet"}
        />
      </dl>
    </section>
  );
}

function MemberDashboardPreview({
  payload,
  onOpenAssessment,
}: {
  payload: AdminMemberProfilePayload;
  onOpenAssessment: (record: AdminAssessmentRecord) => void;
}) {
  return (
    <section className="admin-member-panel portal-card">
      <div className="admin-member-panel-head">
        <span className="card-label">Member Dashboard Preview</span>
        <h2>What this member can see</h2>
        <p>{payload.dashboardPreview.notice}</p>
      </div>
      <div className="admin-member-preview-list">
        <PreviewItem
          label="Peace Assessment"
          value={
            payload.dashboardPreview.latestAssessment?.profileTitle ||
            "No completed assessments yet."
          }
        />
        <PreviewItem label="Circle information" value={payload.dashboardPreview.circleSummary} />
        <PreviewItem label="Coach information" value={payload.dashboardPreview.coachSummary} />
        <PreviewItem
          label="Available pathways"
          value={payload.dashboardPreview.availablePathways.join(", ")}
        />
      </div>
      {payload.dashboardPreview.latestAssessment && (
        <button
          className="admin-link-button"
          type="button"
          onClick={() => onOpenAssessment(payload.dashboardPreview.latestAssessment!)}
        >
          Open latest assessment
        </button>
      )}
    </section>
  );
}

function AssessmentHistory({
  assessments,
  onOpenAssessment,
}: {
  assessments: AdminAssessmentRecord[];
  onOpenAssessment: (record: AdminAssessmentRecord) => void;
}) {
  return (
    <section className="admin-member-panel portal-card">
      <div className="admin-member-panel-head">
        <span className="card-label">Assessments</span>
        <h2>Assessment history</h2>
      </div>
      {assessments.length === 0 ? (
        <div className="admin-empty">No completed assessments yet.</div>
      ) : (
        <div className="admin-member-card-list">
          {assessments.map((assessment) => (
            <article key={assessment.assessmentId}>
              <strong>{assessment.profileTitle}</strong>
              <span>{assessment.profileType}</span>
              <small>
                {formatDate(assessment.completionDate)} · {assessment.peaceAnchor} ·{" "}
                {assessment.pressureResponse} · {assessment.processingStyle}
              </small>
              <button
                className="admin-link-button"
                type="button"
                onClick={() => onOpenAssessment(assessment)}
              >
                View Result
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function CircleCoachingSummary({
  payload,
}: {
  payload: AdminMemberProfilePayload;
}) {
  return (
    <section className="admin-member-panel portal-card">
      <div className="admin-member-panel-head">
        <span className="card-label">Circles & Coaching</span>
        <h2>Relationships</h2>
      </div>
      <div className="admin-member-card-list">
        <RelationshipGroup
          empty="No active Circle membership."
          items={payload.activeCircles.map(
            (circle) =>
              `${circle.name} · ${circle.status || "No status"} · Coaches: ${
                circle.coaches.map((coach) => coach.name).join(" + ") || "None"
              }`
          )}
          title="Active Circle memberships"
        />
        <RelationshipGroup
          empty="No assigned coach."
          items={payload.assignedCoaches.map((coach) => `${coach.name} · ${coach.email}`)}
          title="Assigned coaches"
        />
        <RelationshipGroup
          empty="This person does not coach an active Circle."
          items={payload.circlesCoached.map(
            (circle) =>
              `${circle.name} · ${circle.memberCount} shared members${
                circle.partnerCoaches.length
                  ? ` · Partners: ${circle.partnerCoaches
                      .map((coach) => coach.name)
                      .join(" + ")}`
                  : ""
              }`
          )}
          title="Circles they coach"
        />
        <RelationshipGroup
          empty="No direct individual assignments."
          items={payload.directAssignments.map((assignment) => assignment.name)}
          title="Direct individual assignments"
        />
      </div>
    </section>
  );
}

function GrowthStatusPanel({
  form,
  saveState,
  onChange,
  onSave,
}: {
  form: ReturnType<typeof emptyGrowthForm>;
  saveState: SaveState;
  onChange: (field: keyof ReturnType<typeof emptyGrowthForm>, value: string) => void;
  onSave: () => void;
}) {
  return (
    <section className="admin-member-panel portal-card">
      <div className="admin-member-panel-head">
        <span className="card-label">Growth & Process</span>
        <h2>Current support status</h2>
      </div>
      <div className="admin-member-form-grid">
        <Field label="Process stage" value={form.processStage} onChange={(value) => onChange("processStage", value)} />
        <Field label="Engagement status" value={form.engagementStatus} onChange={(value) => onChange("engagementStatus", value)} />
        <Field label="Current focus" value={form.currentFocus} onChange={(value) => onChange("currentFocus", value)} />
        <Field label="Next step" value={form.nextStep} onChange={(value) => onChange("nextStep", value)} />
        <Field label="Last meaningful contact" type="date" value={form.lastContactAt} onChange={(value) => onChange("lastContactAt", value)} />
        <Field label="Next follow-up" type="date" value={form.nextFollowUpAt} onChange={(value) => onChange("nextFollowUpAt", value)} />
        <TextArea label="Growth summary" value={form.growthSummary} onChange={(value) => onChange("growthSummary", value)} />
        <TextArea label="Support needs" value={form.supportNeeds} onChange={(value) => onChange("supportNeeds", value)} />
      </div>
      <button
        className="btn btn-primary"
        disabled={saveState === "saving"}
        type="button"
        onClick={onSave}
      >
        {saveState === "saving" ? "Saving..." : "Save Growth Status"}
      </button>
    </section>
  );
}

function ProfileNotes({
  body,
  editingNoteId,
  noteState,
  noteType,
  notes,
  onBodyChange,
  onDelete,
  onEdit,
  onEditCancel,
  onNoteTypeChange,
  onSave,
}: {
  body: string;
  editingNoteId: string;
  noteState: SaveState;
  noteType: string;
  notes: AdminMemberProfilePayload["notes"];
  onBodyChange: (value: string) => void;
  onDelete: (noteId: string) => void;
  onEdit: (note: AdminMemberProfilePayload["notes"][number]) => void;
  onEditCancel: () => void;
  onNoteTypeChange: (value: string) => void;
  onSave: () => void;
}) {
  return (
    <section className="admin-member-panel portal-card">
      <div className="admin-member-panel-head">
        <span className="card-label">Notes</span>
        <h2>Admin-only notes</h2>
        <p>Notes are private to authorized administrators in this version.</p>
      </div>
      <div className="admin-member-note-composer">
        <label>
          <span>Note type</span>
          <select value={noteType} onChange={(event) => onNoteTypeChange(event.target.value)}>
            {noteTypes.map((type) => (
              <option key={type} value={type}>
                {type.replace("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <TextArea label="Note" value={body} onChange={onBodyChange} />
        <button
          className="btn btn-primary"
          disabled={noteState === "saving" || !body.trim()}
          type="button"
          onClick={onSave}
        >
          {noteState === "saving"
            ? "Saving..."
            : editingNoteId
              ? "Save Note"
              : "Add Note"}
        </button>
        {editingNoteId && (
          <button
            className="btn btn-secondary"
            type="button"
            onClick={onEditCancel}
          >
            Cancel Edit
          </button>
        )}
      </div>
      {notes.length === 0 ? (
        <div className="admin-empty">No growth notes yet.</div>
      ) : (
        <div className="admin-member-note-list">
          {notes.map((note) => (
            <article key={note.id}>
              <strong>{note.noteType.replace("_", " ")}</strong>
              <p>{note.body}</p>
              <small>
                {note.authorName} · {formatDate(note.createdAt)}
              </small>
              <div className="admin-member-note-actions">
                <button
                  className="admin-link-button"
                  type="button"
                  onClick={() => onEdit(note)}
                >
                  Edit
                </button>
                <button
                  className="admin-link-button"
                  type="button"
                  onClick={() => onDelete(note.id)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function ProfileActivityTimeline({
  activity,
}: {
  activity: AdminMemberProfilePayload["activity"];
}) {
  return (
    <section className="admin-member-panel portal-card">
      <div className="admin-member-panel-head">
        <span className="card-label">Activity & History</span>
        <h2>Timeline</h2>
      </div>
      {activity.length === 0 ? (
        <div className="admin-empty">No recent activity available.</div>
      ) : (
        <div className="admin-member-timeline">
          {activity.map((item) => (
            <article key={item.key}>
              <span>{formatDate(item.date)}</span>
              <strong>{item.label}</strong>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function RelationshipGroup({
  empty,
  items,
  title,
}: {
  empty: string;
  items: string[];
  title: string;
}) {
  return (
    <article>
      <strong>{title}</strong>
      {items.length === 0 ? (
        <span>{empty}</span>
      ) : (
        items.map((item) => <span key={item}>{item}</span>)
      )}
    </article>
  );
}

function Fact({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function PreviewItem({ label, value }: { label: string; value: string }) {
  return (
    <article>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function Field({
  label,
  type = "text",
  value,
  onChange,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function TextArea({
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
      <textarea
        rows={4}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function AdminMemberState({
  title,
  message,
  onAction,
}: {
  title: string;
  message: string;
  onAction: () => void;
}) {
  return (
    <section className="admin-shell">
      <div className="container">
        <div className="admin-state portal-card">
          <span className="card-label">Admin Member Profile</span>
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

function emptyGrowthForm() {
  return {
    processStage: "",
    engagementStatus: "",
    currentFocus: "",
    nextStep: "",
    lastContactAt: "",
    nextFollowUpAt: "",
    growthSummary: "",
    supportNeeds: "",
  };
}

function growthToForm(growth: AdminGrowthStatus) {
  return {
    processStage: growth.processStage,
    engagementStatus: growth.engagementStatus,
    currentFocus: growth.currentFocus,
    nextStep: growth.nextStep,
    lastContactAt: formatInputDate(growth.lastContactAt),
    nextFollowUpAt: formatInputDate(growth.nextFollowUpAt),
    growthSummary: growth.growthSummary,
    supportNeeds: growth.supportNeeds,
  };
}

function formatPersonName(profile: AdminMemberProfilePayload["profile"]) {
  return (
    [profile.firstName, profile.lastName]
      .map((part) => part.trim())
      .filter(Boolean)
      .join(" ") ||
    profile.email ||
    "Unnamed profile"
  );
}

function getInitials(firstName = "", lastName = "") {
  const initials = `${firstName.trim().charAt(0)}${lastName.trim().charAt(0)}`;
  return initials.toUpperCase() || "PW";
}

function formatRoleName(role: string) {
  return role
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: string | null) {
  if (!value) return "No date";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatInputDate(value: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}
