import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";
import { join } from "node:path";

import {
  identityTypes,
  resolveIdentityTypes,
  resolveSecondaryIdentityType,
} from "../lib/assessmentIdentity.ts";

test("canonical identity resolution excludes the primary identity", () => {
  const prosperityPerformance = resolveIdentityTypes({
    Performance: 8,
    Prestige: 3,
    Prosperity: 10,
  });
  assert.deepEqual(prosperityPerformance, {
    identityType: "Prosperity",
    secondaryIdentityType: "Performance",
  });

  const performancePrestige = resolveIdentityTypes({
    Performance: 10,
    Prestige: 8,
    Prosperity: 3,
  });
  assert.deepEqual(performancePrestige, {
    identityType: "Performance",
    secondaryIdentityType: "Prestige",
  });

  assert.notEqual(
    prosperityPerformance.secondaryIdentityType,
    prosperityPerformance.identityType
  );
  assert.notEqual(
    performancePrestige.secondaryIdentityType,
    performancePrestige.identityType
  );
});

test("legacy duplicate or missing secondary identity is reconstructed from scores", () => {
  const scores = { Performance: 8, Prestige: 3, Prosperity: 10 };

  assert.equal(
    resolveSecondaryIdentityType(scores, "Prosperity", "Prosperity"),
    "Performance"
  );
  assert.equal(
    resolveSecondaryIdentityType(scores, "Prosperity", null),
    "Performance"
  );
  assert.equal(
    resolveSecondaryIdentityType(null, "Prosperity", null),
    null
  );
});

test("all 48 expanded profiles use one of the six distinct identity pairings", async () => {
  const profilesRoot = join(
    process.cwd(),
    "data",
    "peaceReport",
    "profiles"
  );
  const groupNames = (await readdir(profilesRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
  const profileFiles = (
    await Promise.all(
      groupNames.map(async (groupName) => {
        const groupPath = join(profilesRoot, groupName);
        return (await readdir(groupPath))
          .filter((fileName) => fileName.endsWith(".ts") && fileName !== "index.ts")
          .map((fileName) => join(groupPath, fileName));
      })
    )
  ).flat();

  const pairingCounts = new Map<string, number>();
  const profileKeys = new Set<string>();

  for (const filePath of profileFiles) {
    const source = await readFile(filePath, "utf8");
    const key = source.match(/key:\s*"([^"]+)"/)?.[1];
    const identityAnchor = source.match(/identityAnchor:\s*"([^"]+)"/)?.[1];
    const secondary = source.match(
      /secondaryPeaceStrategy:\s*"([^"]+)"/
    )?.[1];
    const pressure = source.match(/pressureResponse:\s*"([^"]+)"/)?.[1];
    const processing = source.match(/processingStyle:\s*"([^"]+)"/)?.[1];

    assert.ok(key, `${filePath} has a canonical key`);
    assert.ok(identityTypes.includes(identityAnchor as never));
    assert.ok(identityTypes.includes(secondary as never));
    assert.notEqual(identityAnchor, secondary, key);
    assert.equal(key, `${identityAnchor}|${secondary}|${pressure}|${processing}`);
    assert.equal(profileKeys.has(key), false, `Duplicate profile key: ${key}`);
    profileKeys.add(key);
    assert.match(source, /summary:/);
    assert.match(source, /peaceAnchor:/);
    assert.match(source, /secondaryStrategy:/);

    const pairing = `${identityAnchor}|${secondary}`;
    pairingCounts.set(pairing, (pairingCounts.get(pairing) || 0) + 1);
  }

  assert.equal(profileFiles.length, 48);
  const expectedKeys = new Set<string>();
  for (const pairing of [
    ["Performance", "Prestige"],
    ["Performance", "Prosperity"],
    ["Prestige", "Performance"],
    ["Prestige", "Prosperity"],
    ["Prosperity", "Performance"],
    ["Prosperity", "Prestige"],
  ]) {
    for (const pressure of ["Push", "Prove", "Please", "PullAway"]) {
      for (const processing of ["Internal", "External"]) {
        expectedKeys.add(`${pairing[0]}|${pairing[1]}|${pressure}|${processing}`);
      }
    }
  }
  assert.deepEqual([...profileKeys].sort(), [...expectedKeys].sort());
  assert.deepEqual(
    [...pairingCounts.entries()].sort(),
    [
      ["Performance|Prestige", 8],
      ["Performance|Prosperity", 8],
      ["Prestige|Performance", 8],
      ["Prestige|Prosperity", 8],
      ["Prosperity|Performance", 8],
      ["Prosperity|Prestige", 8],
    ]
  );
});
