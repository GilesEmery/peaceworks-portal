"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type SiteHeaderProps = {
  showSignOut?: boolean;
};

type Profile = {
  first_name: string | null;
  last_name: string | null;
};

export default function SiteHeader({ showSignOut = true }: SiteHeaderProps) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  async function loadProfile() {
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
      setIsAdmin(false);
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", user.id)
      .maybeSingle();

    setProfile(data ?? null);

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
  }

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
  }, []);

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

  const firstName = profile?.first_name?.trim() || "";

  const initials = useMemo(() => {
    const firstInitial = profile?.first_name?.trim().charAt(0) || "";
    const lastInitial = profile?.last_name?.trim().charAt(0) || "";

    return `${firstInitial}${lastInitial}`.toUpperCase() || "PW";
  }, [profile]);

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
          <img
            src="https://gilesemery.github.io/peaceworks-main/PeaceworksLogo.svg"
            alt="PeaceWorks"
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
                  {firstName || "Account"}
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
