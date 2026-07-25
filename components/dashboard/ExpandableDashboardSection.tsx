"use client";

import { useState, type ReactNode } from "react";

type ExpandableDashboardSectionProps<T> = {
  sectionId: string;
  title: string;
  eyebrow?: string;
  items: T[];
  renderItem: (item: T) => ReactNode;
  collapsedItemCount?: number;
  expandLabel?: string;
  collapseLabel?: string;
};

export default function ExpandableDashboardSection<T>({
  sectionId,
  title,
  eyebrow,
  items,
  renderItem,
  collapsedItemCount = 3,
  expandLabel = `Show more ${title}`,
  collapseLabel = `Show fewer ${title}`,
}: ExpandableDashboardSectionProps<T>) {
  const [expanded, setExpanded] = useState(false);
  const expandable = items.length > collapsedItemCount;
  const visibleItems = expanded ? items : items.slice(0, collapsedItemCount);
  const gridId = `${sectionId}-grid`;

  if (items.length === 0) return null;

  return (
    <section className="dashboard-journey-section">
      <div className="section-head journey-head">
        <div className="dashboard-section-heading">
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <span className="dashboard-section-title">{title}</span>
        </div>
      </div>
      <div
        className={`dashboard-journey-grid dashboard-journey-grid-${Math.min(
          visibleItems.length,
          3
        )}`}
        id={gridId}
      >
        {visibleItems.map(renderItem)}
      </div>
      {expandable && (
        <button
          className="dashboard-section-toggle"
          type="button"
          aria-expanded={expanded}
          aria-controls={gridId}
          aria-label={expanded ? collapseLabel : expandLabel}
          onClick={() => setExpanded((current) => !current)}
        >
          <span aria-hidden="true">{expanded ? "−" : "+"}</span>
          {expanded ? "Less" : "More"}
        </button>
      )}
    </section>
  );
}
