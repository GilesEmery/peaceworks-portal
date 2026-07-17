"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useCurrentUserNavigation } from "../../hooks/useCurrentUserNavigation";
import { usePwaInstall } from "../../hooks/usePwaInstall";
import {
  assessmentNavigation,
  dashboardLoginHref,
  getMobilePrimaryNavigation,
  isActivePath,
  isAssessmentPath,
  publicPrimaryNavigation,
  roleAccountNavigation,
  routes,
} from "../../lib/navigation";
import { supabase } from "../../lib/supabase";
import AssessmentsDropdown from "./AssessmentsDropdown";
import IosInstallInstructions from "../pwa/IosInstallInstructions";

type SiteHeaderProps = {
  showSignOut?: boolean;
};

export default function SiteHeader({ showSignOut = true }: SiteHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const mobileDrawerId = useId();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const mobileDrawerRef = useRef<HTMLDivElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileAssessmentsOpen, setMobileAssessmentsOpen] = useState(() =>
    isAssessmentPath(pathname)
  );
  const {
    authEmail,
    isAuthenticated,
    isAdmin,
    canViewCoachDashboard,
    canViewProjectDashboard,
    displayName,
    initials,
  } = useCurrentUserNavigation();
  const pwaInstall = usePwaInstall();

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

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    requestAnimationFrame(() => {
      const firstFocusable = getFocusableElements(mobileDrawerRef.current)[0];
      firstFocusable?.focus();
    });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMobileMenu();
        return;
      }

      if (event.key !== "Tab") return;

      const focusableElements = getFocusableElements(mobileDrawerRef.current);
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setMobileMenuOpen(false);
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

  function openMobileMenu() {
    setMobileAssessmentsOpen(isAssessmentPath(pathname));
    setMobileMenuOpen(true);
  }

  function closeMobileMenu({ returnFocus = true } = {}) {
    setMobileMenuOpen(false);
    if (returnFocus) {
      requestAnimationFrame(() => mobileMenuButtonRef.current?.focus());
    }
  }

  function handleMobileLinkClick() {
    closeMobileMenu({ returnFocus: false });
  }

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link className="brand" href={routes.home} aria-label="PeaceWorks home">
          <Image
            className="brand-logo desktop-brand-logo"
            src="https://www.peaceworks.network/PeaceworksLogo.svg"
            alt="PeaceWorks"
            width={260}
            height={64}
            priority
          />
          <span className="mobile-brand-lockup" aria-hidden="true">
            <Image
              className="mobile-brand-mark"
              src="/images/home/peaceworks-circle.svg"
              alt=""
              width={44}
              height={44}
            />
            <span className="mobile-brand-copy">
              <span className="mobile-brand-name">PeaceWorks</span>
              <span className="mobile-brand-line">Peace Made Practical</span>
            </span>
          </span>
        </Link>

        <button
          ref={mobileMenuButtonRef}
          className="mobile-nav-toggle"
          type="button"
          aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={mobileMenuOpen}
          aria-controls={mobileDrawerId}
          onClick={() =>
            mobileMenuOpen ? closeMobileMenu() : openMobileMenu()
          }
        >
          <span className="mobile-nav-toggle-lines" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>

        <nav className="site-nav desktop-site-nav" aria-label="Primary navigation">
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
            .filter(
              (item) =>
                item.href === routes.myDashboard && isAuthenticated
            )
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

        {mobileMenuOpen && (
          <div className="mobile-nav-layer">
            <button
              className="mobile-nav-backdrop"
              type="button"
              aria-label="Close navigation"
              onClick={() => closeMobileMenu()}
            />

            <div
              id={mobileDrawerId}
              ref={mobileDrawerRef}
              className="mobile-nav-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="PeaceWorks navigation"
            >
              <div className="mobile-drawer-header">
                {showSignOut && isAuthenticated ? (
                  <div className="mobile-profile-summary">
                    <span className="profile-initials">{initials}</span>
                    <span>
                      <strong>{displayName}</strong>
                      {authEmail && <small>{authEmail}</small>}
                    </span>
                  </div>
                ) : (
                  <div className="mobile-profile-summary">
                    <Image
                      src="/images/home/peaceworks-circle.svg"
                      alt=""
                      width={40}
                      height={40}
                    />
                    <span>
                      <strong>PeaceWorks</strong>
                      <small>Peace Made Practical</small>
                    </span>
                  </div>
                )}

                <button
                  className="mobile-drawer-close"
                  type="button"
                  aria-label="Close navigation"
                  onClick={() => closeMobileMenu()}
                >
                  ×
                </button>
              </div>

              <nav className="mobile-drawer-nav" aria-label="Mobile navigation">
                <div className="mobile-nav-group">
                  <span className="mobile-nav-label">Primary</span>
                  {getMobilePrimaryNavigation(isAuthenticated).map((item) => (
                    <Link
                      key={item.href}
                      className={
                        isActivePath(pathname, item.href) ? "active" : ""
                      }
                      href={getPrimaryHref(item.href)}
                      onClick={handleMobileLinkClick}
                    >
                      {item.label}
                    </Link>
                  ))}

                  <div
                    className={`mobile-assessment-group ${
                      isAssessmentPath(pathname) ? "active" : ""
                    }`}
                  >
                    <div className="mobile-assessment-row">
                      <Link
                        className={isActivePath(pathname, routes.assessments) ? "active" : ""}
                        href={routes.assessments}
                        onClick={handleMobileLinkClick}
                      >
                        Assessments
                      </Link>
                      <button
                        type="button"
                        aria-label="Toggle assessments menu"
                        aria-expanded={mobileAssessmentsOpen}
                        onClick={() =>
                          setMobileAssessmentsOpen((current) => !current)
                        }
                      >
                        ▾
                      </button>
                    </div>

                    {mobileAssessmentsOpen && (
                      <div className="mobile-assessment-links">
                        {assessmentNavigation.map((item) => (
                          <Link
                            key={item.href}
                            className={
                              isActivePath(pathname, item.href) ? "active" : ""
                            }
                            href={item.href}
                            onClick={handleMobileLinkClick}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mobile-nav-divider" />

                <div className="mobile-nav-group">
                  <span className="mobile-nav-label">Account</span>

                  {showSignOut && isAuthenticated ? (
                    <>
                      <Link
                        className={isActivePath(pathname, routes.account) ? "active" : ""}
                        href={routes.account}
                        onClick={handleMobileLinkClick}
                      >
                        Account
                      </Link>
                      <Link
                        className={isActivePath(pathname, routes.settings) ? "active" : ""}
                        href={routes.settings}
                        onClick={handleMobileLinkClick}
                      >
                        Settings
                      </Link>

                      {roleAccountNavigation
                        .filter((item) => canShowRoleLink(item.role))
                        .map((item) => (
                          <Link
                            key={item.href}
                            className={
                              isActivePath(pathname, item.href) ? "active" : ""
                            }
                            href={item.href}
                            onClick={handleMobileLinkClick}
                          >
                            {item.label}
                          </Link>
                        ))}

                      {pwaInstall.canShowInstallAction && (
                        <button
                          type="button"
                          onClick={() => {
                            closeMobileMenu({ returnFocus: false });
                            void pwaInstall.requestInstall();
                          }}
                        >
                          {pwaInstall.label}
                        </button>
                      )}

                      <button type="button" onClick={handleSignOut}>
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <Link
                      className={isActivePath(pathname, routes.login) ? "active" : ""}
                      href={routes.login}
                      onClick={handleMobileLinkClick}
                    >
                      Portal Login
                    </Link>
                  )}
                </div>
              </nav>
            </div>
          </div>
        )}
      </div>
      <IosInstallInstructions
        open={isAuthenticated && pwaInstall.iosInstructionsOpen}
        onClose={pwaInstall.closeIosInstructions}
      />
    </header>
  );
}

function getFocusableElements(container: HTMLElement | null) {
  if (!container) return [];

  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    )
  ).filter((element) => !element.hasAttribute("disabled"));
}
