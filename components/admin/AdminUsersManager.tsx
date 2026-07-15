"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "../../lib/supabase";
import type {
  AdminAccountStatus,
  AdminCoachOption,
  AdminLifecycleAction,
  AdminManagedProfile,
  AdminProfileUpdate,
  AdminRoleName,
  AdminUsersPayload,
} from "../../lib/admin/userManagement";
import { getMissingProfileCompletionFields } from "../../lib/profileCompletion";

type LoadState = "loading" | "ready" | "denied" | "error";
type SaveState = "idle" | "saving" | "success" | "error";
type StatusFilter = AdminAccountStatus | "all";
type LifecycleDialog =
  | { action: AdminLifecycleAction; user: AdminManagedProfile }
  | { action: "delete"; user: AdminManagedProfile }
  | null;

type UserSelections = {
  profile: AdminProfileUpdate;
  roleNames: AdminRoleName[];
  circleIds: string[];
  coachIds: string[];
};

export default function AdminUsersManager({
  embedded = false,
  initialPayload = null,
  focusedUserId = "",
  onPayloadChange,
}: {
  embedded?: boolean;
  initialPayload?: AdminUsersPayload | null;
  focusedUserId?: string;
  onPayloadChange?: (payload: AdminUsersPayload) => void;
}) {
  const router = useRouter();
  const [state, setState] = useState<LoadState>(
    initialPayload ? "ready" : "loading"
  );
  const [payload, setPayload] = useState<AdminUsersPayload | null>(
    initialPayload
  );
  const [selectedUserId, setSelectedUserId] = useState(
    focusedUserId || initialPayload?.users[0]?.id || ""
  );
  const [search, setSearch] = useState("");
  const [selections, setSelections] = useState<UserSelections>(
    getSelections(initialPayload, focusedUserId || initialPayload?.users[0]?.id || "")
  );
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [message, setMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [lifecycleDialog, setLifecycleDialog] = useState<LifecycleDialog>(null);
  const [lifecycleMenuUser, setLifecycleMenuUser] =
    useState<AdminManagedProfile | null>(null);
  const [lifecycleReason, setLifecycleReason] = useState("");
  const [lifecycleConfirmed, setLifecycleConfirmed] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [adminRemovalConfirmation, setAdminRemovalConfirmation] = useState("");

  useEffect(() => {
    if (initialPayload) {
      return;
    }

    async function loadInitialUsers() {
      setState("loading");
      setMessage("");

      const token = await getAccessToken();

      if (!token) {
        router.replace("/auth");
        return;
      }

      const response = await fetch("/api/admin/users", {
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

      const nextPayload = (await response.json()) as AdminUsersPayload;
      const nextSelectedUserId = nextPayload.users[0]?.id || "";

      setPayload(nextPayload);
      onPayloadChange?.(nextPayload);
      setSelectedUserId(nextSelectedUserId);
      setSelections(getSelections(nextPayload, nextSelectedUserId));
      setState("ready");
    }

    loadInitialUsers();
  }, [initialPayload, onPayloadChange, router]);

  async function loadUsers(preferredUserId?: string) {
    setState("loading");
    setMessage("");

    const token = await getAccessToken();

    if (!token) {
      router.replace("/auth");
      return;
    }

    const response = await fetch("/api/admin/users", {
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

    const nextPayload = (await response.json()) as AdminUsersPayload;
    const nextSelectedUserId =
      (preferredUserId &&
      nextPayload.users.some((user) => user.id === preferredUserId)
        ? preferredUserId
        : "") ||
      (selectedUserId && nextPayload.users.some((user) => user.id === selectedUserId)
        ? selectedUserId
        : "") ||
      nextPayload.users[0]?.id ||
      "";

    setPayload(nextPayload);
    onPayloadChange?.(nextPayload);
    setSelectedUserId(nextSelectedUserId);
    resetSelections(nextPayload, nextSelectedUserId);
    setState("ready");
  }

  const filteredUsers = useMemo(() => {
    if (!payload) return [];

    const normalizedSearch = search.trim().toLowerCase();
    const usersForStatus =
      statusFilter === "all"
        ? payload.users
        : payload.users.filter((user) => user.accountStatus === statusFilter);

    if (!normalizedSearch) return usersForStatus;

    return usersForStatus.filter((user) =>
      [
        user.firstName,
        user.lastName,
        user.email,
        user.organization,
        user.jobTitle,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [payload, search, statusFilter]);

  const selectedUser = useMemo(() => {
    if (!payload) return null;

    return (
      payload.users.find((user) => user.id === selectedUserId) ||
      filteredUsers[0] ||
      null
    );
  }, [filteredUsers, payload, selectedUserId]);

  function selectUser(user: AdminManagedProfile) {
    if (!payload) return;

    setSelectedUserId(user.id);
    resetSelections(payload, user.id);
    setSaveState("idle");
    setMessage("");
    setAdminRemovalConfirmation("");
  }

  function resetSelections(nextPayload = payload, userId = selectedUserId) {
    setSelections(getSelections(nextPayload, userId));
  }

  function toggleValue<T extends string>(
    field: "roleNames" | "circleIds" | "coachIds",
    value: T
  ) {
    setSelections((current) => {
      const values = current[field] as string[];
      const nextValues = values.includes(value)
        ? values.filter((item) => item !== value)
        : [...values, value];

      return {
        ...current,
        [field]: nextValues,
      };
    });
    setSaveState("idle");
    setMessage("");

    if (field === "roleNames" && value === "admin") {
      setAdminRemovalConfirmation("");
    }
  }

  function updateProfileField(
    field: keyof AdminProfileUpdate,
    value: string
  ) {
    setSelections((current) => ({
      ...current,
      profile: {
        ...current.profile,
        [field]: value,
      },
    }));
    setSaveState("idle");
    setMessage("");
  }

  async function saveChanges() {
    if (!selectedUser) return;

    if (!selections.profile.firstName.trim() || !selections.profile.lastName.trim()) {
      setSaveState("error");
      setMessage("First name and last name are required.");
      return;
    }

    if (isRemovingAdminRole(selectedUser, selections.roleNames)) {
      if (adminRemovalConfirmation.trim() !== "REMOVE ADMIN") {
        setSaveState("error");
        setMessage('Type "REMOVE ADMIN" before removing Admin access.');
        return;
      }
    }

    setSaveState("saving");
    setMessage("");

    const token = await getAccessToken();

    if (!token) {
      router.replace("/auth");
      return;
    }

    const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...selections,
        adminRemovalConfirmation,
      }),
    });

    const result = (await response.json().catch(() => null)) as {
      ok?: boolean;
      message?: string;
    } | null;

    if (!response.ok || !result?.ok) {
      setSaveState("error");
      setMessage(result?.message || "User access could not be updated.");
      return;
    }

    setSaveState("success");
    setMessage(result.message || "User access was updated.");
    setAdminRemovalConfirmation("");
    await loadUsers(selectedUser.id);
    window.dispatchEvent(new Event("peaceworks-profile-updated"));
  }

  function openLifecycleDialog(
    action: AdminLifecycleAction | "delete",
    user: AdminManagedProfile
  ) {
    setLifecycleDialog({ action, user });
    setLifecycleReason("");
    setLifecycleConfirmed(false);
    setDeleteConfirmation("");
    setSaveState("idle");
    setMessage("");
  }

  async function confirmLifecycleAction() {
    if (!lifecycleDialog) return;

    const action = lifecycleDialog.action;
    const user = lifecycleDialog.user;
    const requiresCheckbox =
      action === "deactivate" || action === "archive" || action === "delete";

    if (requiresCheckbox && !lifecycleConfirmed) {
      setSaveState("error");
      setMessage("Confirm that you understand the impact of this action.");
      return;
    }

    if (action === "delete" && deleteConfirmation.trim() !== "DELETE") {
      setSaveState("error");
      setMessage("Type DELETE to permanently delete this user.");
      return;
    }

    setSaveState("saving");
    setMessage("");

    const token = await getAccessToken();

    if (!token) {
      router.replace("/auth");
      return;
    }

    const response =
      action === "delete"
        ? await fetch(`/api/admin/users/${user.id}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
        : await fetch(`/api/admin/users/${user.id}/lifecycle`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action,
              reason: lifecycleReason,
            }),
          });

    const result = (await response.json().catch(() => null)) as {
      ok?: boolean;
      message?: string;
    } | null;

    if (!response.ok || !result?.ok) {
      setSaveState("error");
      setMessage(result?.message || "User lifecycle action could not be completed.");
      return;
    }

    setLifecycleDialog(null);
    setSaveState("success");
    setMessage(result.message || "User lifecycle action was completed.");
    await loadUsers(action === "delete" ? undefined : user.id);
  }

  if (state === "loading") {
    return (
      <section className="admin-shell">
        <div className="container">
          <div className="admin-loading portal-card">Loading users...</div>
        </div>
      </section>
    );
  }

  if (state === "denied") {
    return (
      <AdminUsersState
        label="Access denied"
        title="Admin access is not available for this account."
        message="User management is limited to approved PeaceWorks administrators."
        actionLabel="Return to Admin"
        onAction={() => router.push("/admin")}
      />
    );
  }

  if (state === "error" || !payload) {
    return (
      <AdminUsersState
        label="Unavailable"
        title="User management could not be loaded."
        message="Please try again later or check the server configuration."
        actionLabel="Try Again"
        onAction={() => loadUsers()}
      />
    );
  }

  const content = (
    <>
      {!embedded && (
        <div className="admin-hero admin-users-hero">
          <div>
            <div className="eyebrow">Admin Dashboard</div>
            <h1>Manage Users</h1>
            <p>
              Assign roles, Circle memberships, and coach relationships for the
              people represented in PeaceWorks.
            </p>
          </div>

          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => router.push("/admin")}
          >
            Back to Admin
          </button>
        </div>
      )}

        <div className="admin-users-layout">
          <aside className="admin-users-list portal-card">
            <div className="admin-users-list-head">
              <span className="card-label">Profiles</span>
              <strong>{filteredUsers.length}</strong>
            </div>

            <div className="admin-status-filters" aria-label="Profile status filters">
              {(["active", "deactivated", "archived", "all"] as StatusFilter[]).map(
                (status) => (
                  <button
                    className={statusFilter === status ? "selected" : ""}
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                  >
                    {statusFilterLabel(status)}
                    <span>{countUsersByStatus(payload.users, status)}</span>
                  </button>
                )
              )}
            </div>

            <label className="admin-user-search">
              <span>Search users</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Name, organization, or role"
              />
            </label>

            {filteredUsers.length === 0 ? (
              <div className="admin-empty">No profiles match this search.</div>
            ) : (
              <div className="admin-user-results" role="list">
                {filteredUsers.map((user) => (
                  <button
                    className={`admin-user-row${
                      selectedUser?.id === user.id ? " selected" : ""
                    }`}
                    key={user.id}
                    type="button"
                    onClick={() => selectUser(user)}
                  >
                    <strong>{formatUserName(user)}</strong>
                    <span>{user.email || "No email available"}</span>
                    <small>{formatUserMeta(user)}</small>
                    <StatusBadge status={user.accountStatus} />
                  </button>
                ))}
              </div>
            )}
          </aside>

          <section className="admin-user-panel portal-card">
            {!selectedUser ? (
              <div className="admin-empty">Select a profile to manage.</div>
            ) : (
              <>
                <div className="admin-user-panel-head">
                  <div>
                    <span className="card-label">Selected User</span>
                    <h2>{formatUserName(selectedUser)}</h2>
                    <p>
                      {selectedUser.email || "No email available"}
                      {formatUserMeta(selectedUser)
                        ? ` · ${formatUserMeta(selectedUser)}`
                        : ""}
                    </p>
                  </div>

                  <div className="admin-user-panel-actions">
                    <button
                      className="admin-link-button"
                      type="button"
                      onClick={() => router.push(`/admin/people/${selectedUser.id}`)}
                    >
                      Open Full Profile
                    </button>
                    <div className={`admin-save-status ${saveState}`}>
                      {saveState === "saving" ? "Saving" : saveState}
                    </div>
                  </div>
                </div>

                {message && (
                  <div className={`admin-message ${saveState}`}>{message}</div>
                )}

                <div className="admin-user-sections">
                  <AccountStatusSection user={selectedUser} />

                  <ProfileInformationSection
                    profile={selections.profile}
                    missingFields={getMissingProfileCompletionFields(selections.profile)}
                    onChange={updateProfileField}
                  />

                  <CheckboxSection
                    title="Roles"
                    description="Roles grant access to portal features. They are not mutually exclusive."
                  >
                    {payload.roleOptions.map((role) => (
                      <CheckboxRow
                        key={role.name}
                        label={role.label}
                        checked={selections.roleNames.includes(role.name)}
                        onChange={() => toggleValue("roleNames", role.name)}
                      />
                    ))}
                    {isRemovingAdminRole(selectedUser, selections.roleNames) && (
                      <div className="admin-danger-confirmation">
                        <strong>Confirm Admin removal</strong>
                        <p>
                          Removing Admin access changes who can manage PeaceWorks.
                          Type <code>REMOVE ADMIN</code> to confirm this change.
                        </p>
                        <input
                          value={adminRemovalConfirmation}
                          onChange={(event) =>
                            setAdminRemovalConfirmation(event.target.value)
                          }
                          placeholder="REMOVE ADMIN"
                        />
                      </div>
                    )}
                  </CheckboxSection>

                  <CheckboxSection
                    title="Active Circles"
                    description="Circle membership identifies which specific Circle or Circles this person belongs to."
                    emptyMessage="No active Circles are available."
                    isEmpty={activeCircles(payload).length === 0}
                  >
                    {activeCircles(payload).map((circle) => (
                      <CheckboxRow
                        key={circle.id}
                        label={circle.name}
                        description={circle.description}
                        checked={selections.circleIds.includes(circle.id)}
                        onChange={() => toggleValue("circleIds", circle.id)}
                      />
                    ))}
                  </CheckboxSection>

                  <CheckboxSection
                    title="Assigned Coaches"
                    description="Selected coach-role profiles connected to this person. Multiple coaches may be selected."
                    emptyMessage="No available coaches are available."
                    isEmpty={availableCoaches(payload, selections.coachIds).length === 0}
                  >
                    {availableCoaches(payload, selections.coachIds).map((coach) => (
                      <CheckboxRow
                        key={coach.id}
                        label={coach.name}
                        description={formatCoachDescription(coach)}
                        checked={selections.coachIds.includes(coach.id)}
                        onChange={() => toggleValue("coachIds", coach.id)}
                      />
                    ))}
                  </CheckboxSection>

                  <AccountActionsSection
                    user={selectedUser}
                    isSelf={selectedUser.id === payload.currentAdminId}
                    onOpen={() => setLifecycleMenuUser(selectedUser)}
                  />
                </div>

                <div className="admin-user-actions">
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => resetSelections()}
                    disabled={saveState === "saving"}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={saveChanges}
                    disabled={saveState === "saving"}
                  >
                    {saveState === "saving" ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
        {lifecycleDialog && (
          <LifecycleDialog
            dialog={lifecycleDialog}
            isSaving={saveState === "saving"}
            reason={lifecycleReason}
            confirmed={lifecycleConfirmed}
            deleteConfirmation={deleteConfirmation}
            onReasonChange={setLifecycleReason}
            onConfirmedChange={setLifecycleConfirmed}
            onDeleteConfirmationChange={setDeleteConfirmation}
            onCancel={() => setLifecycleDialog(null)}
            onConfirm={confirmLifecycleAction}
          />
        )}
        {lifecycleMenuUser && (
          <LifecycleActionMenu
            isSelf={lifecycleMenuUser.id === payload?.currentAdminId}
            user={lifecycleMenuUser}
            onCancel={() => setLifecycleMenuUser(null)}
            onSelect={(action, user) => {
              setLifecycleMenuUser(null);
              openLifecycleDialog(action, user);
            }}
          />
        )}
    </>
  );

  if (embedded) return content;

  return (
    <section className="admin-shell">
      <div className="container">{content}</div>
    </section>
  );
}

function AdminUsersState({
  label,
  title,
  message,
  actionLabel,
  onAction,
}: {
  label: string;
  title: string;
  message: string;
  actionLabel: string;
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
            {actionLabel}
          </button>
        </div>
      </div>
    </section>
  );
}

function ProfileInformationSection({
  profile,
  missingFields,
  onChange,
}: {
  profile: AdminProfileUpdate;
  missingFields: string[];
  onChange: (field: keyof AdminProfileUpdate, value: string) => void;
}) {
  return (
    <section className="admin-profile-section">
      <div>
        <h3>Profile Information</h3>
        <p>
          First and last name determine whether the profile is complete.
          Organization, job title, and timezone are optional.
        </p>
        {missingFields.length > 0 && (
          <small>Missing: {missingFields.join(", ")}</small>
        )}
      </div>

      <div className="admin-profile-fields">
        <ProfileField
          label="First name"
          value={profile.firstName}
          required
          onChange={(value) => onChange("firstName", value)}
        />
        <ProfileField
          label="Last name"
          value={profile.lastName}
          required
          onChange={(value) => onChange("lastName", value)}
        />
        <ProfileField
          label="Organization"
          value={profile.organization}
          onChange={(value) => onChange("organization", value)}
        />
        <ProfileField
          label="Job title"
          value={profile.jobTitle}
          onChange={(value) => onChange("jobTitle", value)}
        />
        <ProfileField
          label="Timezone"
          value={profile.timezone}
          placeholder="America/New_York"
          onChange={(value) => onChange("timezone", value)}
        />
      </div>
    </section>
  );
}

function AccountStatusSection({ user }: { user: AdminManagedProfile }) {
  return (
    <section className="admin-profile-section admin-account-status-section">
      <div>
        <h3>Account Status</h3>
        <p>
          Status controls whether this person can access PeaceWorks. Archived
          users are removed from active relationship workflows.
        </p>
      </div>

      <div className="admin-account-status-grid">
        <div>
          <span>Status</span>
          <StatusBadge status={user.accountStatus} />
        </div>
        <div>
          <span>Last changed</span>
          <strong>{formatDateTime(user.statusChangedAt) || "Not recorded"}</strong>
        </div>
        {user.deactivatedAt && (
          <div>
            <span>Deactivated</span>
            <strong>{formatDateTime(user.deactivatedAt)}</strong>
          </div>
        )}
        {user.archivedAt && (
          <div>
            <span>Archived</span>
            <strong>{formatDateTime(user.archivedAt)}</strong>
          </div>
        )}
        {user.statusReason && (
          <div className="wide">
            <span>Reason</span>
            <strong>{user.statusReason}</strong>
          </div>
        )}
      </div>
    </section>
  );
}

function AccountActionsSection({
  user,
  isSelf,
  onOpen,
}: {
  user: AdminManagedProfile;
  isSelf: boolean;
  onOpen: () => void;
}) {
  return (
    <section className="admin-checkbox-section admin-account-actions-section">
      <div>
        <h3>Account Actions</h3>
        <p>
          Current status: <strong>{statusFilterLabel(user.accountStatus)}</strong>
        </p>
        <p>
          Manage access, participation, or permanent removal for this account.
        </p>
        {isSelf && (
          <small>
            Some account-status actions are protected for your own active
            administrator account.
          </small>
        )}
      </div>

      <div className="admin-account-actions">
        <button className="btn btn-secondary" type="button" onClick={onOpen}>
          Manage Account Status
        </button>
      </div>
    </section>
  );
}

function LifecycleActionMenu({
  isSelf,
  onCancel,
  onSelect,
  user,
}: {
  isSelf: boolean;
  onCancel: () => void;
  onSelect: (
    action: AdminLifecycleAction | "delete",
    user: AdminManagedProfile
  ) => void;
  user: AdminManagedProfile;
}) {
  const actions = getLifecycleActions(user.accountStatus);

  return (
    <div className="admin-dialog-backdrop" role="presentation">
      <section
        aria-labelledby="admin-lifecycle-menu-title"
        aria-modal="true"
        className="admin-dialog admin-lifecycle-menu portal-card"
        role="dialog"
      >
        <div>
          <span className="card-label">Account Options</span>
          <h3 id="admin-lifecycle-menu-title">Manage Account Status</h3>
          <p>
            Current status: <strong>{statusFilterLabel(user.accountStatus)}</strong>
          </p>
        </div>

        <div className="admin-lifecycle-options">
          {actions.map((action) => {
            const option = lifecycleMenuCopy(action);
            const disabled =
              isSelf &&
              (action === "deactivate" || action === "archive" || action === "delete");

            return (
              <article className={`admin-lifecycle-option ${option.tone}`} key={action}>
                <div>
                  <strong>{option.title}</strong>
                  <p>{option.description}</p>
                </div>
                <button
                  className={
                    option.tone === "danger"
                      ? "btn btn-danger"
                      : option.tone === "warning"
                        ? "btn btn-primary"
                        : "btn btn-secondary"
                  }
                  disabled={disabled}
                  type="button"
                  onClick={() => onSelect(action, user)}
                >
                  {option.actionLabel}
                </button>
              </article>
            );
          })}
        </div>

        {isSelf && (
          <small>
            Self-deactivation, self-archive, and self-deletion remain protected.
          </small>
        )}

        <div className="admin-user-actions">
          <button className="btn btn-secondary" type="button" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </section>
    </div>
  );
}

function LifecycleDialog({
  dialog,
  isSaving,
  reason,
  confirmed,
  deleteConfirmation,
  onReasonChange,
  onConfirmedChange,
  onDeleteConfirmationChange,
  onCancel,
  onConfirm,
}: {
  dialog: NonNullable<LifecycleDialog>;
  isSaving: boolean;
  reason: string;
  confirmed: boolean;
  deleteConfirmation: string;
  onReasonChange: (value: string) => void;
  onConfirmedChange: (value: boolean) => void;
  onDeleteConfirmationChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const action = dialog.action;
  const user = dialog.user;
  const copy = lifecycleDialogCopy(action, user);
  const needsReason = action === "deactivate" || action === "archive";
  const needsCheckbox =
    action === "deactivate" || action === "archive" || action === "delete";
  const needsDeleteText = action === "delete";

  return (
    <div className="admin-dialog-backdrop" role="presentation">
      <section
        aria-labelledby="admin-lifecycle-dialog-title"
        aria-modal="true"
        className="admin-dialog portal-card"
        role="dialog"
      >
        <div>
          <span className="card-label">{copy.label}</span>
          <h3 id="admin-lifecycle-dialog-title">{copy.title}</h3>
          <p>{copy.message}</p>
        </div>

        <div className="admin-dialog-summary">
          <strong>{formatUserName(user)}</strong>
          <span>{user.email || "No email available"}</span>
          <StatusBadge status={user.accountStatus} />
        </div>

        {copy.impact.length > 0 && (
          <ul className="admin-dialog-impact">
            {copy.impact.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}

        {needsReason && (
          <label className="admin-dialog-field">
            <span>Reason (optional)</span>
            <textarea
              value={reason}
              onChange={(event) => onReasonChange(event.target.value)}
              rows={3}
            />
          </label>
        )}

        {needsCheckbox && (
          <label className="admin-checkbox-row">
            <input
              checked={confirmed}
              type="checkbox"
              onChange={(event) => onConfirmedChange(event.target.checked)}
            />
            <span>
              <strong>{copy.checkbox}</strong>
            </span>
          </label>
        )}

        {needsDeleteText && (
          <label className="admin-dialog-field">
            <span>Type DELETE to confirm</span>
            <input
              type="text"
              value={deleteConfirmation}
              onChange={(event) => onDeleteConfirmationChange(event.target.value)}
            />
          </label>
        )}

        <div className="admin-user-actions">
          <button
            className="btn btn-secondary"
            type="button"
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            className={action === "delete" ? "btn btn-danger" : "btn btn-primary"}
            type="button"
            onClick={onConfirm}
            disabled={isSaving}
          >
            {isSaving ? "Working..." : copy.confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

function ProfileField({
  label,
  value,
  required = false,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  required?: boolean;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span>
        {label}
        {required ? " *" : ""}
      </span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function CheckboxSection({
  title,
  description,
  children,
  emptyMessage,
  isEmpty = false,
}: {
  title: string;
  description: string;
  children: ReactNode;
  emptyMessage?: string;
  isEmpty?: boolean;
}) {
  return (
    <section className="admin-checkbox-section">
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>

      <div className="admin-checkbox-list">
        {isEmpty ? <div className="admin-empty">{emptyMessage}</div> : children}
      </div>
    </section>
  );
}

function CheckboxRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="admin-checkbox-row">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span>
        <strong>{label}</strong>
        {description && <small>{description}</small>}
      </span>
    </label>
  );
}

async function getAccessToken() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.access_token || "";
}

function formatUserName(user: AdminManagedProfile) {
  const name = [user.firstName, user.lastName]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");

  return name || user.email || "Unnamed profile";
}

function StatusBadge({ status }: { status: AdminAccountStatus }) {
  return (
    <em className={`admin-status-badge ${status}`}>
      {status === "active"
        ? "Active"
        : status === "deactivated"
          ? "Deactivated"
          : "Archived"}
    </em>
  );
}

function statusFilterLabel(status: StatusFilter) {
  if (status === "all") return "All";
  if (status === "active") return "Active";
  if (status === "deactivated") return "Deactivated";
  return "Archived";
}

function countUsersByStatus(users: AdminManagedProfile[], status: StatusFilter) {
  if (status === "all") return users.length;
  return users.filter((user) => user.accountStatus === status).length;
}

function getLifecycleActions(
  status: AdminAccountStatus
): Array<AdminLifecycleAction | "delete"> {
  if (status === "active") return ["deactivate", "archive", "delete"];
  if (status === "deactivated") return ["reactivate", "archive", "delete"];
  return ["restore", "delete"];
}

function lifecycleMenuCopy(action: AdminLifecycleAction | "delete") {
  if (action === "deactivate") {
    return {
      title: "Deactivate",
      description:
        "Temporarily blocks access while preserving roles, Circle memberships, and coaching relationships.",
      actionLabel: "Deactivate User",
      tone: "caution",
    };
  }

  if (action === "reactivate") {
    return {
      title: "Reactivate",
      description:
        "Restores account access while keeping current roles and relationships unchanged.",
      actionLabel: "Reactivate User",
      tone: "neutral",
    };
  }

  if (action === "archive") {
    return {
      title: "Archive",
      description:
        "Ends active participation and relationships while preserving profile and historical records.",
      actionLabel: "Archive User",
      tone: "warning",
    };
  }

  if (action === "restore") {
    return {
      title: "Restore",
      description:
        "Restores account access. Previous relationships remain ended until reassigned.",
      actionLabel: "Restore User",
      tone: "neutral",
    };
  }

  return {
    title: "Permanently Delete",
    description:
      "Permanently removes the account and related PeaceWorks records. This cannot be undone.",
    actionLabel: "Permanently Delete User",
    tone: "danger",
  };
}

function lifecycleDialogCopy(
  action: AdminLifecycleAction | "delete",
  user: AdminManagedProfile
) {
  if (action === "deactivate") {
    return {
      label: "Deactivate User",
      title: `Deactivate ${formatUserName(user)}?`,
      message:
        "This will block the user from signing in until an administrator reactivates the account. Their roles, Circle memberships, and coach assignments remain in place.",
      checkbox: "I understand this user will lose access until reactivated.",
      confirmLabel: "Deactivate User",
      impact: ["Access is blocked.", "Existing PeaceWorks relationships are preserved."],
    };
  }

  if (action === "reactivate") {
    return {
      label: "Reactivate User",
      title: `Reactivate ${formatUserName(user)}?`,
      message:
        "This will restore account access. Existing roles and relationships remain as they are currently configured.",
      checkbox: "",
      confirmLabel: "Reactivate User",
      impact: ["Access is restored.", "Existing PeaceWorks relationships remain unchanged."],
    };
  }

  if (action === "archive") {
    return {
      label: "Archive User",
      title: `Archive ${formatUserName(user)}?`,
      message:
        "This will block access and end the user's active PeaceWorks relationships. Historic rows remain available for records and reporting.",
      checkbox: "I understand this will end the user's active PeaceWorks relationships.",
      confirmLabel: "Archive User",
      impact: [
        "Access is blocked.",
        "Active Circle memberships are ended.",
        "Active coach assignments where this person is coach or member are ended.",
      ],
    };
  }

  if (action === "restore") {
    return {
      label: "Restore User",
      title: `Restore ${formatUserName(user)}?`,
      message:
        "This will set the profile back to active and restore account access. Previous Circle memberships and coach assignments are not restored automatically.",
      checkbox: "",
      confirmLabel: "Restore User",
      impact: ["Access is restored.", "Previous relationships remain ended until reassigned."],
    };
  }

  return {
    label: "Danger Zone",
    title: `Permanently delete ${formatUserName(user)}?`,
    message:
      "This permanently deletes the authentication user and profile record. This action cannot be undone.",
    checkbox: "I understand this deletion is permanent and irreversible.",
    confirmLabel: "Permanently Delete",
    impact: [
      `Email: ${user.email || "No email available"}`,
      `Current status: ${statusFilterLabel(user.accountStatus)}`,
      `${user.roles.length} roles currently assigned`,
      `${user.circleIds.length} active Circle memberships currently assigned`,
      `${user.coachIds.length} active coach assignments currently assigned`,
      "Related data may be removed or orphaned according to database constraints.",
    ],
  };
}

function getSelections(
  payload: AdminUsersPayload | null,
  userId: string
): UserSelections {
  const user = payload?.users.find((item) => item.id === userId);

  return {
    profile: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      organization: user?.organization || "",
      jobTitle: user?.jobTitle || "",
      timezone: user?.timezone || "",
    },
    roleNames: user?.roles || [],
    circleIds: user?.circleIds || [],
    coachIds: user?.coachIds || [],
  };
}

function formatUserMeta(user: AdminManagedProfile) {
  return [user.organization, user.jobTitle]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" · ");
}

function activeCircles(payload: AdminUsersPayload) {
  return payload.circles.filter((circle) => circle.status === "active");
}

function availableCoaches(payload: AdminUsersPayload, selectedCoachIds: string[]) {
  return payload.coaches.filter(
    (coach) =>
      coach.accountStatus === "active" || selectedCoachIds.includes(coach.id)
  );
}

function isRemovingAdminRole(
  user: AdminManagedProfile | null,
  selectedRoles: AdminRoleName[]
) {
  return Boolean(user?.roles.includes("admin") && !selectedRoles.includes("admin"));
}

function formatCoachDescription(coach: AdminCoachOption) {
  return [
    coach.email,
    coach.organization,
    coach.accountStatus !== "active" ? statusFilterLabel(coach.accountStatus) : "",
  ]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" · ");
}

function formatDateTime(value: string | null) {
  if (!value) return "";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
