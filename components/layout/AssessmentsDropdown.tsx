"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";

import { assessmentNavigation, isAssessmentPath } from "../../lib/navigation";

type AssessmentsDropdownProps = {
  pathname: string;
  onNavigate?: () => void;
};

export default function AssessmentsDropdown({
  pathname,
  onNavigate,
}: AssessmentsDropdownProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const dropdownId = useId();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target)) setOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && open) {
        setOpen(false);
        toggleRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

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
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        ref={toggleRef}
        className="assessment-nav-toggle"
        type="button"
        aria-controls={dropdownId}
        aria-expanded={open}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen((current) => !current)}
      >
        <span>Assessments</span>
        <span aria-hidden="true">▾</span>
      </button>

      {open && (
        <div className="assessment-nav-dropdown" id={dropdownId}>
          {assessmentNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
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
