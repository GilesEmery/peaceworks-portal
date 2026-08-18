import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { resolveAssignmentRowsFromSources } from "../lib/content/assignmentResolution.ts";

function assignment(id: string, contentItemId: string, sourceId: string) {
  return {
    id,
    content_item_id: contentItemId,
    content_type: "resource",
    content_id: sourceId,
    assignment_status: "active",
    content_item: { content_kind: "resource" as const },
  };
}

test("collection resolution keeps valid assignments and skips an orphan", () => {
  const rows = [
    assignment("valid-1", "item-1", "resource-1"),
    assignment("orphan", "item-missing", "resource-missing"),
    assignment("valid-2", "item-2", "resource-2"),
  ];
  const warnings: unknown[][] = [];
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => warnings.push(args);
  try {
    const resolved = resolveAssignmentRowsFromSources(
      rows,
      new Map([
        ["item-1", "resource-1"],
        ["item-2", "resource-2"],
      ]),
      { missingSource: "skip" }
    );

    assert.deepEqual(resolved.map((row) => row.id), ["valid-1", "valid-2"]);
    assert.deepEqual(warnings[0]?.[1], {
      assignmentId: "orphan",
      sourceType: "resource",
      sourceId: "resource-missing",
      contentItemId: "item-missing",
      assignmentStatus: "active",
    });
  } finally {
    console.warn = originalWarn;
  }
});

test("strict single-record resolution still rejects an orphan", () => {
  assert.throws(
    () => resolveAssignmentRowsFromSources(
      [assignment("orphan", "item-missing", "resource-missing")],
      new Map()
    ),
    /Canonical assignment orphan has no source record/
  );
});

test("Content Studio uses resilient assignment collection resolution", async () => {
  const source = await readFile(
    new URL("../lib/admin/contentStudio.ts", import.meta.url),
    "utf8"
  );
  assert.match(source, /fetchContentAssignments[\s\S]*resolveCanonicalAssignmentCollection/);
});

test("Communications loads through the resilient shared Content Studio payload", async () => {
  const source = await readFile(
    new URL("../app/api/admin/content/communications/route.ts", import.meta.url),
    "utf8"
  );
  assert.match(source, /GET[\s\S]*fetchAdminContentStudio\(\)/);
});
