"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useCurrentUserNavigation } from "../../hooks/useCurrentUserNavigation";
import {
  dashboardLoginHref,
  isActivePath,
  publicPrimaryNavigation,
  roleAccountNavigation,
  routes,
} from "../../lib/navigation";
import { supabase } from "../../lib/supabase";
import AssessmentsDropdown from "./AssessmentsDropdown";

type SiteHeaderProps = {
  showSignOut?: boolean;
};

export default function SiteHeader({ showSignOut = true }: SiteHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const {
    isAuthenticated,
    isAdmin,
    canViewCoachDashboard,
    canViewProjectDashboard,
    displayName,
    initials,
  } = useCurrentUserNavigation();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target)) setMenuOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push(routes.login);
  }

  function goTo(path: string) {
    setMenuOpen(false);
    router.push(path);
  }

  function getPrimaryHref(href: string) {
    if (href === routes.myDashboard && !isAuthenticated) {
      return dashboardLoginHref(routes.myDashboard);
    }

    return href;
  }

  function canShowRoleLink(role: string) {
    if (role === "coach") return canViewCoachDashboard;
    if (role === "project_manager") return canViewProjectDashboard;
    if (role === "admin") return isAdmin;
    return false;
  }

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link className="brand" href={routes.home} aria-label="PeaceWorks home">
          <Image
            src="https://www.peaceworks.network/PeaceworksLogo.svg"
            alt="PeaceWorks"
            width={260}
            height={64}
            priority
          />
        </Link>

        <nav className="site-nav" aria-label="Primary navigation">
          {publicPrimaryNavigation
            .filter((item) => item.href !== routes.assessments)
            .slice(0, 3)
            .map((item) => (
              <Link
                key={item.href}
                className={isActivePath(pathname, item.href) ? "active" : ""}
                href={getPrimaryHref(item.href)}
              >
                {item.label}
              </Link>
            ))}

          <AssessmentsDropdown pathname={pathname} />

          {publicPrimaryNavigation
            .filter((item) => item.href === routes.myDashboard)
            .map((item) => (
              <Link
                key={item.href}
                className={isActivePath(pathname, item.href) ? "active" : ""}
                href={getPrimaryHref(item.href)}
              >
                {item.label}
              </Link>
            ))}

          {showSignOut && isAuthenticated ? (
            <div className="profile-menu" ref={menuRef}>
              <button
                className="profile-menu-button"
                type="button"
                onClick={() => setMenuOpen((current) => !current)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <span className="profile-initials">{initials}</span>
                <span className="profile-name">{displayName}</span>
                <span className="profile-caret">▾</span>
              </button>

              {menuOpen && (
                <div className="profile-dropdown" role="menu">
                  <button
                    className={
                      isActivePath(pathname, routes.myDashboard) ? "active" : ""
                    }
                    type="button"
                    onClick={() => goTo(routes.myDashboard)}
                  >
                    My Dashboard
                  </button>
                  <button
                    className={isActivePath(pathname, routes.account) ? "active" : ""}
                    type="button"
                    onClick={() => goTo(routes.account)}
                  >
                    Account
                  </button>
                  <button
                    className={isActivePath(pathname, routes.settings) ? "active" : ""}
                    type="button"
                    onClick={() => goTo(routes.settings)}
                  >
                    Settings
                  </button>

                  {roleAccountNavigation
                    .filter((item) => canShowRoleLink(item.role))
                    .map((item) => (
                      <button
                        key={item.href}
                        className={
                          isActivePath(pathname, item.href) ? "active" : ""
                        }
                        type="button"
                        onClick={() => goTo(item.href)}
                      >
                        {item.label}
                      </button>
                    ))}

                  <button type="button" onClick={handleSignOut}>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              className={isActivePath(pathname, routes.login) ? "active" : ""}
              href={routes.login}
            >
              Portal Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
