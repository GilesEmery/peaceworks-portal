"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type SiteHeaderProps = {
  showSignOut?: boolean;
};

type Profile = {
  first_name: string | null;
  last_name: string | null;
  avatar_path: string | null;
  account_status: string | null;
};

export default function SiteHeader({ showSignOut = true }: SiteHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const assessmentsMenuRef = useRef<HTMLDivElement | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [assessmentsMenuOpen, setAssessmentsMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [canViewCoachDashboard, setCanViewCoachDashboard] = useState(false);
  const [canViewProjectDashboard, setCanViewProjectDashboard] = useState(false);

  const loadProfile = useCallback(async function loadProfile() {
    const [
      {
        data: { user },
      },
      {
        data: { session },
      },
    ] = await Promise.all([supabase.auth.getUser(), supabase.auth.getSession()]);

    if (!user) {
      setProfile(null);
      setAuthEmail("");
      setIsAuthenticated(false);
      setIsAdmin(false);
      setCanViewCoachDashboard(false);
      setCanViewProjectDashboard(false);
      return;
    }

    setIsAuthenticated(true);
    setAuthEmail(user.email || "");

    const { data, error } = await supabase
      .from("profiles")
      .select("first_name, last_name, avatar_path")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Current user profile could not be loaded.", error);
      setProfile(null);
      setIsAdmin(false);
      setCanViewCoachDashboard(false);
      setCanViewProjectDashboard(false);
      return;
    }

    const accountStatus = await loadAccountStatus(user.id);

    if (accountStatus !== "active") {
      await supabase.auth.signOut();
      setProfile(null);
      setAuthEmail("");
      setIsAuthenticated(false);
      setIsAdmin(false);
      setCanViewCoachDashboard(false);
      setCanViewProjectDashboard(false);
      router.replace("/auth");
      return;
    }

    setProfile(data ? { ...data, account_status: accountStatus } : null);

    if (!session?.access_token) {
      setIsAdmin(false);
      setCanViewCoachDashboard(false);
      setCanViewProjectDashboard(false);
      return;
    }

    const headers = {
      Authorization: `Bearer ${session.access_token}`,
    };
    const [adminResponse, coachResponse, projectResponse] = await Promise.all([
      fetch("/api/admin/me", { cache: "no-store", headers }),
      fetch("/api/coach/me", { cache: "no-store", headers }),
      fetch("/api/project/me", { cache: "no-store", headers }),
    ]);
    const coachResult = (await coachResponse.json().catch(() => null)) as
      | { isCoach?: boolean }
      | null;
    const projectResult = (await projectResponse.json().catch(() => null)) as
      | { code?: string; isProjectManager?: boolean; message?: string }
      | null;

    setIsAdmin(adminResponse.ok);
    setCanViewCoachDashboard(Boolean(coachResult?.isCoach));
    setCanViewProjectDashboard(Boolean(projectResult?.isProjectManager));
  }, [router]);

  useEffect(() => {
    void Promise.resolve().then(() => loadProfile());

    function handleProfileUpdated() {
      loadProfile();
    }

    window.addEventListener("peaceworks-profile-updated", handleProfileUpdated);

    return () => {
      window.removeEventListener(
        "peaceworks-profile-updated",
        handleProfileUpdated
      );
    };
  }, [loadProfile]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const clickedProfileMenu = Boolean(menuRef.current?.contains(target));
      const clickedAssessmentsMenu = Boolean(
        assessmentsMenuRef.current?.contains(target)
      );

      if (!clickedProfileMenu && !clickedAssessmentsMenu) {
        setMenuOpen(false);
        setAssessmentsMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setAssessmentsMenuOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const profileName = getProfileName(profile);
  const displayName = profileName || authEmail || "Account";

  const initials = useMemo(() => {
    const firstInitial = profile?.first_name?.trim().charAt(0) || "";
    const lastInitial = profile?.last_name?.trim().charAt(0) || "";

    if (firstInitial || lastInitial) {
      return `${firstInitial}${lastInitial}`.toUpperCase();
    }

    const emailInitial = authEmail.trim().charAt(0);

    if (emailInitial) return emailInitial.toUpperCase();

    return "PW";
  }, [authEmail, profile]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/auth");
  }

  function goTo(path: string) {
    setMenuOpen(false);
    setAssessmentsMenuOpen(false);
    router.push(path);
  }

  return (
    <header className="site-header">
      <div className="container header-inner">
        <a
          className="brand"
          href="https://www.peaceworks.network"
          aria-label="PeaceWorks home"
        >
          <Image
            src="https://www.peaceworks.network/PeaceworksLogo.svg"
            alt="PeaceWorks"
            width={260}
            height={64}
            priority
          />
        </a>

        <nav className="site-nav" aria-label="Primary navigation">
          <a href="https://www.peaceworks.network/contact">About</a>
          <a href="https://www.peaceworks.network/roi-calculator">
            ROI Calculator
          </a>
          <a href="https://www.peaceworks.network/join">Join a Circle</a>
          <div
            className={`assessment-nav-menu ${
              isAssessmentPath(pathname) ? "active" : ""
            }`}
            ref={assessmentsMenuRef}
            onMouseEnter={() => setAssessmentsMenuOpen(true)}
            onMouseLeave={() => setAssessmentsMenuOpen(false)}
          >
            <a
              className="assessment-nav-link"
              href="/assessments"
              onFocus={() => setAssessmentsMenuOpen(true)}
            >
              Assessments
            </a>
            <button
              className="assessment-nav-toggle"
              type="button"
              aria-label="Open assessments menu"
              aria-haspopup="menu"
              aria-expanded={assessmentsMenuOpen}
              onClick={() =>
                setAssessmentsMenuOpen((current) => !current)
              }
            >
              ▾
            </button>

            {assessmentsMenuOpen && (
              <div className="assessment-nav-dropdown" role="menu">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => goTo("/peace-assessment")}
                >
                  Peace Assessment
                </button>
              </div>
            )}
          </div>
          <a
            className={isActivePath(pathname, "/dashboard") ? "active" : ""}
            href="/dashboard"
          >
            My Dashboard
          </a>

          {showSignOut && isAuthenticated && (
            <div className="profile-menu" ref={menuRef}>
              <button
                className="profile-menu-button"
                type="button"
                onClick={() => setMenuOpen((current) => !current)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <span className="profile-initials">{initials}</span>
                <span className="profile-name">
                  {displayName}
                </span>
                <span className="profile-caret">▾</span>
              </button>

              {menuOpen && (
                <div className="profile-dropdown" role="menu">
                  <button
                    className={isActivePath(pathname, "/account") ? "active" : ""}
                    type="button"
                    onClick={() => goTo("/account")}
                  >
                    Account Settings
                  </button>
                  <button
                    className={isActivePath(pathname, "/dashboard") ? "active" : ""}
                    type="button"
                    onClick={() => goTo("/dashboard")}
                  >
                    My Dashboard
                  </button>
                  <button
                    className={isAssessmentPath(pathname) ? "active" : ""}
                    type="button"
                    onClick={() => goTo("/assessments")}
                  >
                    Assessments
                  </button>
                  {canViewCoachDashboard && (
                    <button
                      className={isActivePath(pathname, "/coach") ? "active" : ""}
                      type="button"
                      onClick={() => goTo("/coach")}
                    >
                      Coach Dashboard
                    </button>
                  )}
                  {canViewProjectDashboard && (
                    <button
                      className={isActivePath(pathname, "/project") ? "active" : ""}
                      type="button"
                      onClick={() => goTo("/project")}
                    >
                      Project Dashboard
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      className={isActivePath(pathname, "/admin") ? "active" : ""}
                      type="button"
                      onClick={() => goTo("/admin")}
                    >
                      Admin Dashboard
                    </button>
                  )}

                  <button type="button" onClick={handleSignOut}>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

async function loadAccountStatus(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("account_status")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    if (isMissingLifecycleColumnError(error)) {
      console.warn(
        "Profile lifecycle columns are not available yet; treating account as active."
      );
      return "active";
    }

    console.error("Current user account status could not be loaded.", error);
    return "active";
  }

  if (data?.account_status === "deactivated" || data?.account_status === "archived") {
    return data.account_status;
  }

  return "active";
}

function getProfileName(profile: Profile | null) {
  return [profile?.first_name, profile?.last_name]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");
}

function isActivePath(pathname: string, basePath: string) {
  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}

function isAssessmentPath(pathname: string) {
  return (
    isActivePath(pathname, "/assessments") ||
    isActivePath(pathname, "/peace-assessment")
  );
}

function isMissingLifecycleColumnError(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const values = Object.values(error as Record<string, unknown>)
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();

  return values.includes("account_status") && values.includes("column");
}
