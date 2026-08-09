"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, CircleDot, Menu, MessageCircle } from "lucide-react";

import { isActivePath, routes } from "../../lib/navigation";
import styles from "./PwaAppShell.module.css";

type PwaBottomNavProps = {
  hasActiveCircle: boolean;
  moreOpen: boolean;
  onMoreToggle: () => void;
};

export default function PwaBottomNav({
  hasActiveCircle,
  moreOpen,
  onMoreToggle,
}: PwaBottomNavProps) {
  const pathname = usePathname();
  const circleHref = hasActiveCircle ? routes.circle : routes.myDashboard;
  const circleLabel = hasActiveCircle ? "Circle" : "Journey";
  const practiceActive = isActivePath(pathname, routes.assessments);
  const circleActive = hasActiveCircle && isActivePath(pathname, routes.circle);
  const homeActive = isActivePath(pathname, routes.myDashboard);
  const messagesActive = isActivePath(pathname, routes.messages);

  return (
    <nav className={styles.bottomBar} aria-label="PWA primary navigation">
      <div className={styles.bottomNav}>
        <NavLink
          href={routes.assessments}
          label="Practice"
          active={practiceActive}
          icon={<BookOpen aria-hidden="true" />}
        />
        <NavLink
          href={circleHref}
          label={circleLabel}
          active={circleActive}
          icon={<CircleDot aria-hidden="true" />}
        />
        <NavLink
          href={routes.myDashboard}
          label="Home"
          active={homeActive}
          featured
          icon={
            <Image
              src="/images/home/peaceworks-circle.svg"
              alt=""
              width={34}
              height={34}
            />
          }
        />
        <NavLink
          href={routes.messages}
          label="Messages"
          active={messagesActive}
          icon={<MessageCircle aria-hidden="true" />}
        />
        <button
          id="pwa-more-button"
          className={`${styles.navItem} ${moreOpen ? styles.active : ""}`}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
          aria-controls="pwa-more-menu"
          onClick={onMoreToggle}
        >
          <span className={styles.navIcon}>
            <Menu aria-hidden="true" />
          </span>
          <span>More</span>
        </button>
      </div>
    </nav>
  );
}

function NavLink({
  href,
  label,
  active,
  featured = false,
  icon,
}: {
  href: string;
  label: string;
  active: boolean;
  featured?: boolean;
  icon: React.ReactNode;
}) {
  return (
    <Link
      className={`${styles.navItem} ${active ? styles.active : ""} ${
        featured ? styles.featured : ""
      }`}
      href={href}
      aria-current={active ? "page" : undefined}
    >
      <span className={styles.navIcon}>{icon}</span>
      <span>{label}</span>
    </Link>
  );
}
