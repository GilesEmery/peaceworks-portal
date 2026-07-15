"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import SiteHeader from "../../components/layout/SiteHeader";
import SiteFooter from "../../components/layout/SiteFooter";

type ProfileForm = {
  firstName: string;
  lastName: string;
  organization: string;
  jobTitle: string;
  timezone: string;
};

type SaveStatus = "idle" | "saving" | "success" | "error";

const emptyProfile: ProfileForm = {
  firstName: "",
  lastName: "",
  organization: "",
  jobTitle: "",
  timezone: "",
};

export default function AccountPage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<ProfileForm>(emptyProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadAccount() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.replace("/auth");
          return;
        }

        const { data: savedProfile, error: profileError } = await supabase
          .from("profiles")
          .select("first_name, last_name, organization, job_title, timezone")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        const detectedTimezone =
          Intl.DateTimeFormat().resolvedOptions().timeZone || "";

        if (!isMounted) return;

        setUserId(user.id);
        setEmail(user.email ?? "");

        setProfile({
          firstName: savedProfile?.first_name ?? "",
          lastName: savedProfile?.last_name ?? "",
          organization: savedProfile?.organization ?? "",
          jobTitle: savedProfile?.job_title ?? "",
          timezone: savedProfile?.timezone ?? detectedTimezone,
        });
      } catch (error) {
        console.error("Unable to load account:", error);
        setSaveStatus("error");
        setMessage("We could not load your account information.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadAccount();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const initials = useMemo(() => {
    const firstInitial = profile.firstName.trim().charAt(0);
    const lastInitial = profile.lastName.trim().charAt(0);
    return `${firstInitial}${lastInitial}`.toUpperCase();
  }, [profile.firstName, profile.lastName]);

  function updateField(field: keyof ProfileForm, value: string) {
    setProfile((current) => ({
      ...current,
      [field]: value,
    }));

    setSaveStatus("idle");
    setMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!userId) {
      setSaveStatus("error");
      setMessage("Please sign in again before updating your account.");
      return;
    }

    if (!profile.firstName.trim()) {
      setSaveStatus("error");
      setMessage("Please enter your first name.");
      return;
    }

    if (!profile.lastName.trim()) {
      setSaveStatus("error");
      setMessage("Please enter your last name.");
      return;
    }

    setSaveStatus("saving");
    setMessage("");

    try {
      const cleanedProfile = {
        id: userId,
        first_name: profile.firstName.trim(),
        last_name: profile.lastName.trim(),
        organization: profile.organization.trim() || null,
        job_title: profile.jobTitle.trim() || null,
        timezone: profile.timezone.trim() || null,
      };

      const { error } = await supabase
        .from("profiles")
        .upsert(cleanedProfile, { onConflict: "id" });

      if (error) throw error;

      setProfile({
        firstName: cleanedProfile.first_name,
        lastName: cleanedProfile.last_name ?? "",
        organization: cleanedProfile.organization ?? "",
        jobTitle: cleanedProfile.job_title ?? "",
        timezone: cleanedProfile.timezone ?? "",
      });

      setSaveStatus("success");
      setMessage("Your account information has been saved.");

      window.dispatchEvent(
        new CustomEvent("peaceworks-profile-updated", {
          detail: {
            firstName: cleanedProfile.first_name,
            lastName: cleanedProfile.last_name,
          },
        })
      );
    } catch (error) {
      console.error("Unable to save account:", error);
      setSaveStatus("error");
      setMessage("We could not save your changes. Please try again.");
    }
  }

  if (isLoading) {
    return (
      <div className="portal-page">
        <SiteHeader />
        <main className="account-page">
          <section className="account-card account-loading">
            <p>Loading your account…</p>
          </section>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="portal-page">
      <SiteHeader />

      <main className="account-page">
        <section className="account-card">
          <div className="account-heading">
            <div className="account-avatar" aria-hidden="true">
              {initials || "PW"}
            </div>

            <div>
              <p className="account-eyebrow">PeaceWorks member</p>
              <h1>Account Settings</h1>
              <p className="account-introduction">
                Keep your personal information, work context, and portal access
                settings up to date.
              </p>
            </div>
          </div>

          <form className="account-form" onSubmit={handleSubmit}>
            <div className="form-section-heading">
              <h2>Personal information</h2>
              <p>
                First and last name are required for a complete profile and
                help personalize your portal navigation.
              </p>
            </div>

            <div className="account-grid">
              <label className="form-field">
                <span>First name</span>
                <input
                  type="text"
                  value={profile.firstName}
                  onChange={(event) =>
                    updateField("firstName", event.target.value)
                  }
                  autoComplete="given-name"
                  required
                />
              </label>

              <label className="form-field">
                <span>Last name</span>
                <input
                  type="text"
                  value={profile.lastName}
                  onChange={(event) =>
                    updateField("lastName", event.target.value)
                  }
                  autoComplete="family-name"
                  required
                />
              </label>

              <label className="form-field form-field-wide">
                <span>Email address</span>
                <input
                  className="read-only-input"
                  type="email"
                  value={email}
                  readOnly
                />
                <small>
                  This is the email address connected to your portal login.
                </small>
              </label>
            </div>

            <div className="form-divider" />

            <div className="form-section-heading">
              <h2>Work and community</h2>
              <p>
                Help us understand the context in which you lead and practice
                peace.
              </p>
            </div>

            <div className="account-grid">
              <label className="form-field">
                <span>Organization</span>
                <input
                  type="text"
                  value={profile.organization}
                  onChange={(event) =>
                    updateField("organization", event.target.value)
                  }
                  placeholder="Organization or community"
                />
              </label>

              <label className="form-field">
                <span>Role or job title</span>
                <input
                  type="text"
                  value={profile.jobTitle}
                  onChange={(event) =>
                    updateField("jobTitle", event.target.value)
                  }
                  placeholder="Your role"
                />
              </label>

              <label className="form-field form-field-wide">
                <span>Time zone</span>
                <input
                  type="text"
                  value={profile.timezone}
                  onChange={(event) =>
                    updateField("timezone", event.target.value)
                  }
                  placeholder="America/New_York"
                />
                <small>
                  We use this to display Circle meetings and events at the right
                  local time.
                </small>
              </label>
            </div>

            <div className="account-actions">
              <div
                className={`form-message ${
                  saveStatus === "error" ? "message-error" : ""
                } ${saveStatus === "success" ? "message-success" : ""}`}
                role={saveStatus === "error" ? "alert" : "status"}
                aria-live="polite"
              >
                {message}
              </div>

              <button
                className="save-button"
                type="submit"
                disabled={saveStatus === "saving"}
              >
                {saveStatus === "saving" ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>

          <div className="form-divider" />

          <div className="form-section-heading">
            <h2>Password and security</h2>
            <p>
              Manage your login security for the PeaceWorks portal.
            </p>
          </div>

          <div className="account-grid">
            <div className="account-card-preview">
              <h3>Password</h3>
              <p>
                Change your password and keep your portal access secure.
              </p>

              <button
                className="settings-card-button"
                type="button"
                onClick={() => router.push("/auth/update-password")}
              >
                Change Password
              </button>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
