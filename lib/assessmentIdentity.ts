export type IdentityType = "Performance" | "Prestige" | "Prosperity";

export const identityTypes: IdentityType[] = [
  "Performance",
  "Prestige",
  "Prosperity",
];

type IdentityScoreSource = Partial<Record<IdentityType, unknown>>;

export function resolveIdentityTypes(
  scores: IdentityScoreSource,
  tieBreakerScores?: IdentityScoreSource
) {
  const identityType = pickTopIdentity(scores, tieBreakerScores);
  const secondaryIdentityType = pickHighestIdentityExcluding(
    scores,
    identityType
  );

  if (!secondaryIdentityType) {
    throw new Error("At least two identity scores are required.");
  }

  return { identityType, secondaryIdentityType };
}

export function resolveSecondaryIdentityType(
  scores: unknown,
  primaryIdentity: unknown,
  storedSecondaryIdentity?: unknown
): IdentityType | null {
  if (!isIdentityType(primaryIdentity)) return null;

  if (
    isIdentityType(storedSecondaryIdentity) &&
    storedSecondaryIdentity !== primaryIdentity
  ) {
    return storedSecondaryIdentity;
  }

  if (!scores || typeof scores !== "object" || Array.isArray(scores)) return null;

  return pickHighestIdentityExcluding(
    scores as IdentityScoreSource,
    primaryIdentity
  );
}

export function isIdentityType(value: unknown): value is IdentityType {
  return identityTypes.includes(value as IdentityType);
}

function pickTopIdentity(
  scores: IdentityScoreSource,
  tieBreakerScores?: IdentityScoreSource
): IdentityType {
  const ranked = rankAvailableIdentities(scores);
  if (ranked.length === 0) return identityTypes[0];

  const topScore = ranked[0].score;
  const tied = ranked
    .filter((item) => item.score === topScore)
    .map((item) => item.identityType);

  if (tied.length === 1) return tied[0];

  const tieBreakerIdentity = Object.keys(tieBreakerScores || {}).find(
    (identityType) => isIdentityType(identityType) && tied.includes(identityType)
  ) as IdentityType | undefined;

  return tieBreakerIdentity || tied[0];
}

function pickHighestIdentityExcluding(
  scores: IdentityScoreSource,
  excludedIdentity: IdentityType
): IdentityType | null {
  return (
    rankAvailableIdentities(scores).find(
      (item) => item.identityType !== excludedIdentity
    )?.identityType || null
  );
}

function rankAvailableIdentities(scores: IdentityScoreSource) {
  return identityTypes
    .filter((identityType) => Number.isFinite(Number(scores[identityType])))
    .map((identityType) => ({
      identityType,
      score: Number(scores[identityType]),
    }))
    .sort((first, second) => second.score - first.score);
}
