export type AssignmentResolutionRow = {
  id: string;
  content_item_id: string;
  content_type: string | null;
  content_id: string | null;
  assignment_status: string | null;
  content_item:
    | { content_kind: "monthly_question" | "resource" | "training" }
    | { content_kind: "monthly_question" | "resource" | "training" }[]
    | null;
};

export function resolveAssignmentRowsFromSources<T extends AssignmentResolutionRow>(
  rows: T[],
  sourceIds: ReadonlyMap<string, string>,
  options: { missingSource?: "throw" | "skip" } = {}
) {
  return rows.flatMap((row) => {
    const contentItem = Array.isArray(row.content_item)
      ? row.content_item[0] || null
      : row.content_item;
    const sourceId = sourceIds.get(row.content_item_id);

    if (!contentItem || !sourceId) {
      if (options.missingSource === "skip") {
        console.warn("Ignoring canonical assignment without a canonical source record", {
          assignmentId: row.id,
          sourceType: contentItem?.content_kind || row.content_type,
          sourceId: row.content_id,
          contentItemId: row.content_item_id,
          assignmentStatus: row.assignment_status,
        });
        return [];
      }
      throw new Error(
        `Canonical assignment ${row.id} has no ${contentItem ? "source" : "registry"} record.`
      );
    }

    if (row.content_type !== contentItem.content_kind || row.content_id !== sourceId) {
      console.warn("Canonical assignment legacy parity mismatch", {
        assignmentId: row.id,
        contentItemId: row.content_item_id,
      });
    }

    const { content_item: _contentItem, ...assignment } = row;
    void _contentItem;
    return [{ ...assignment, content_kind: contentItem.content_kind, source_id: sourceId }];
  });
}
