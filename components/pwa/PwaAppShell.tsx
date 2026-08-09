"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { isActivePath, routes } from "../../lib/navigation";
import { supabase } from "../../lib/supabase";
import PwaBottomNav from "./PwaBottomNav";
import PwaMoreMenu from "./PwaMoreMenu";
import styles from "./PwaAppShell.module.css";

export type PwaRoleNavigation = {
  isAdmin: boolean;
  canViewCoachDashboard: boolean;
  canViewProjectDashboard: boolean;
};

type PwaAppShellProps = PwaRoleNavigation & {
  displayName: string;
  onSignOut: () => Promise<void>;
};

export default function PwaAppShell({
  displayName,
  isAdmin,
  canViewCoachDashboard,
  canViewProjectDashboard,
  onSignOut,
}: PwaAppShellProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [hasActiveCircle, setHasActiveCircle] = useState(false);

  useEffect(() => {
    document.body.classList.add("compact-pwa-shell-active");
    return () => document.body.classList.remove("compact-pwa-shell-active");
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadCircleMembership() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token || cancelled) return;

      const response = await fetch("/api/circle/me", {
        cache: "no-store",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!response.ok || cancelled) return;

      const result = (await response.json()) as { isCircleMember?: boolean };
      if (!cancelled) setHasActiveCircle(Boolean(result.isCircleMember));
    }

    void loadCircleMembership();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <header className={styles.topArea}>
        <Link className={styles.brand} href={routes.myDashboard} aria-label="PeaceWorks home">
          <Image
            src="/images/home/peaceworks-circle.svg"
            alt=""
            width={38}
            height={38}
            priority
          />
          <span>
            <strong>PeaceWorks</strong>
            <small>{getPageTitle(pathname)}</small>
          </span>
        </Link>
      </header>

      <PwaBottomNav
        hasActiveCircle={hasActiveCircle}
        moreOpen={moreOpen}
        onMoreToggle={() => setMoreOpen((current) => !current)}
      />

      <PwaMoreMenu
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        displayName={displayName}
        hasActiveCircle={hasActiveCircle}
        isAdmin={isAdmin}
        canViewCoachDashboard={canViewCoachDashboard}
        canViewProjectDashboard={canViewProjectDashboard}
        onSignOut={onSignOut}
      />
    </>
  );
}

function getPageTitle(pathname: string) {
  if (isActivePath(pathname, routes.messages)) return "Messages";
  if (isActivePath(pathname, routes.circle)) return "Circle";
  if (isActivePath(pathname, routes.assessments)) return "Practice";
  if (isActivePath(pathname, routes.account)) return "Account";
  if (isActivePath(pathname, routes.coach)) return "Coach";
  if (isActivePath(pathname, routes.project)) return "Project";
  if (isActivePath(pathname, routes.admin)) return "Admin";
  return "Your Journey";
}
