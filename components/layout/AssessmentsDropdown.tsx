"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import {
  assessmentNavigation,
  isAssessmentPath,
  routes,
} from "../../lib/navigation";

type AssessmentsDropdownProps = {
  pathname: string;
  onNavigate?: () => void;
};

export default function AssessmentsDropdown({
  pathname,
  onNavigate,
}: AssessmentsDropdownProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target)) setOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function handleNavigate() {
    setOpen(false);
    onNavigate?.();
  }

  return (
    <div
      className={`assessment-nav-menu ${
        isAssessmentPath(pathname) ? "active" : ""
      }`}
      ref={menuRef}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Link
        className="assessment-nav-link"
        href={routes.assessments}
        onClick={handleNavigate}
        onFocus={() => setOpen(true)}
      >
        Assessments
      </Link>
      <button
        className="assessment-nav-toggle"
        type="button"
        aria-label="Open assessments menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        ▾
      </button>

      {open && (
        <div className="assessment-nav-dropdown" role="menu">
          {assessmentNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              onClick={handleNavigate}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
