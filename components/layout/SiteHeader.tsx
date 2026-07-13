"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

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
      setIsAdmin(false);
      return;
    }

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
      return;
    }

    const accountStatus = await loadAccountStatus(user.id);

    if (accountStatus !== "active") {
      await supabase.auth.signOut();
      setProfile(null);
      setAuthEmail("");
      setIsAdmin(false);
      router.replace("/auth");
      return;
    }

    setProfile(data ? { ...data, account_status: accountStatus } : null);

    if (!session?.access_token) {
      setIsAdmin(false);
      return;
    }

    const adminResponse = await fetch("/api/admin/me", {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    setIsAdmin(adminResponse.ok);
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
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
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
          <a href="https://www.peaceworks.network/join">Join</a>
          <a href="https://www.peaceworks.network/contact">About</a>
          <a href="/dashboard">Dashboard</a>
          <a href="/circle">Your Circle</a>
          <a href="/coach">Coaches</a>

          {showSignOut && (
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
                  <button type="button" onClick={() => goTo("/account")}>
                    My Account
                  </button>
                  <button type="button" onClick={() => goTo("/dashboard")}>
                    Dashboard
                  </button>
                  {isAdmin && (
                    <button type="button" onClick={() => goTo("/admin")}>
                      Admin Dashboard
                    </button>
                  )}
                  <button type="button" onClick={() => goTo("/circle")}>
                    Your Circle
                  </button>

                  <div className="profile-dropdown-divider" />

                  <button type="button" onClick={() => goTo("/settings")}>
                    Settings
                  </button>
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

function isMissingLifecycleColumnError(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const values = Object.values(error as Record<string, unknown>)
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();

  return values.includes("account_status") && values.includes("column");
}
