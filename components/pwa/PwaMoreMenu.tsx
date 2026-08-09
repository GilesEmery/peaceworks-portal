"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";

import { routes } from "../../lib/navigation";
import type { PwaRoleNavigation } from "./PwaAppShell";
import styles from "./PwaAppShell.module.css";

type PwaMoreMenuProps = PwaRoleNavigation & {
  open: boolean;
  displayName: string;
  hasActiveCircle: boolean;
  onClose: () => void;
  onSignOut: () => Promise<void>;
};

export default function PwaMoreMenu({
  open,
  displayName,
  hasActiveCircle,
  isAdmin,
  canViewCoachDashboard,
  canViewProjectDashboard,
  onClose,
  onSignOut,
}: PwaMoreMenuProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => closeButtonRef.current?.focus());

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = getFocusableElements(dialogRef.current);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  useEffect(() => {
    if (wasOpenRef.current && !open) {
      const moreButton = document.getElementById("pwa-more-button");
      if (moreButton instanceof HTMLButtonElement) moreButton.focus();
    }
    wasOpenRef.current = open;
  }, [open]);

  if (!open) return null;

  const closeFromLink = () => onClose();

  return (
    <div className={styles.menuLayer}>
      <button
        className={styles.backdrop}
        type="button"
        aria-label="Close More menu"
        onClick={onClose}
      />
      <div
        id="pwa-more-menu"
        ref={dialogRef}
        className={styles.menuSheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwa-more-title"
      >
        <header className={styles.menuHeader}>
          <div>
            <small>Signed in as</small>
            <h2 id="pwa-more-title">{displayName}</h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Close More menu"
            onClick={onClose}
          >
            <X aria-hidden="true" />
          </button>
        </header>

        <nav className={styles.menuNavigation} aria-label="More navigation">
          <MenuGroup label="Your PeaceWorks">
            <MenuLink href={routes.myDashboard} onClick={closeFromLink}>My Dashboard</MenuLink>
            <MenuLink href={routes.assessments} onClick={closeFromLink}>Peace Profile &amp; Assessments</MenuLink>
            {hasActiveCircle && <MenuLink href={routes.circle} onClick={closeFromLink}>Circle</MenuLink>}
            <MenuLink href={routes.account} onClick={closeFromLink}>Account</MenuLink>
            <MenuLink href={routes.settings} onClick={closeFromLink}>Settings</MenuLink>
          </MenuGroup>

          {(canViewCoachDashboard || canViewProjectDashboard || isAdmin) && (
            <MenuGroup label="Tools">
              {canViewCoachDashboard && <MenuLink href={routes.coach} onClick={closeFromLink}>Coach Dashboard</MenuLink>}
              {canViewProjectDashboard && <MenuLink href={routes.project} onClick={closeFromLink}>Project Dashboard</MenuLink>}
              {isAdmin && <MenuLink href={routes.admin} onClick={closeFromLink}>Admin Dashboard</MenuLink>}
            </MenuGroup>
          )}

          <MenuGroup label="PeaceWorks">
            <MenuLink href={routes.howItWorks} onClick={closeFromLink}>How It Works</MenuLink>
            <MenuLink href={routes.organizations} onClick={closeFromLink}>For Organizations</MenuLink>
            <MenuLink href={routes.about} onClick={closeFromLink}>About</MenuLink>
            <MenuLink href={routes.roiCalculator} onClick={closeFromLink}>ROI Calculator</MenuLink>
          </MenuGroup>
        </nav>

        <button
          className={styles.signOut}
          type="button"
          onClick={() => void onSignOut()}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

function MenuGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className={styles.menuGroup}>
      <h3>{label}</h3>
      <div>{children}</div>
    </section>
  );
}

function MenuLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  return <Link href={href} onClick={onClick}>{children}</Link>;
}

function getFocusableElements(container: HTMLElement | null) {
  if (!container) return [];
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  );
}
