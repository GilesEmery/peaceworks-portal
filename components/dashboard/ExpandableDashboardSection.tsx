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
  expandLabel = `Show all ${title}`,
  collapseLabel = `Collapse ${title}`,
}: ExpandableDashboardSectionProps<T>) {
  const [expanded, setExpanded] = useState(false);
  const expandable = items.length > collapsedItemCount;
  const visibleItems = expanded ? items : items.slice(0, collapsedItemCount);
  const gridId = `${sectionId}-grid`;

  if (items.length === 0) return null;

  const heading = (
    <>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <span className="dashboard-section-title-row">
        <span className="dashboard-section-title">{title}</span>
        {expandable && (
          <span
            className={`dashboard-section-chevron${expanded ? " is-expanded" : ""}`}
            aria-hidden="true"
          >
            ↓
          </span>
        )}
      </span>
    </>
  );

  return (
    <section className="dashboard-journey-section">
      <div className="section-head journey-head">
        {expandable ? (
          <button
            className="dashboard-section-toggle"
            type="button"
            aria-expanded={expanded}
            aria-controls={gridId}
            aria-label={expanded ? collapseLabel : expandLabel}
            onClick={() => setExpanded((current) => !current)}
          >
            {heading}
          </button>
        ) : (
          <div className="dashboard-section-heading">{heading}</div>
        )}
      </div>
      <div className="dashboard-journey-grid" id={gridId}>
        {visibleItems.map(renderItem)}
      </div>
    </section>
  );
}
