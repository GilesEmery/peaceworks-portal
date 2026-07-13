import { getPeaceMainType } from "../../data/peaceReport";
import { peaceAssessmentProfiles } from "../../data/peaceAssessmentProfiles";
import type {
  PeaceAssessmentResult,
  PeaceAssessmentScores,
} from "../peaceAssessmentScoring";
import type {
  AdminAssessmentRow,
  AdminProfileRow,
} from "./authorization";

type AdminUserSummary = {
  id: string;
  email: string;
  name: string;
};

export type AdminAssessmentRecord = {
  assessmentId: string;
  userId: string;
  userName: string;
  email: string;
  assessmentName: "Peace Assessment";
  profileType: string;
  profileTitle: string;
  originalProfileDescriptor: string;
  peaceAnchor: string;
  secondaryStrategy: string;
  pressureResponse: string;
  processingStyle: string;
  completionDate: string | null;
  resultStatus: "Completed";
};

export type AdminDistributionItem = {
  key: string;
  label: string;
  count: number;
  percentage: number;
};

export type AdminActivityItem = {
  key: string;
  label: string;
  count: number;
};

export type AdminAnalyticsPayload = {
  ok: true;
  assessment: {
    key: "peace-assessment";
    label: "Peace Assessment";
  };
  overview: {
    totalRegisteredUsers: number;
    usersWithCompletedAssessment: number;
    completedAssessments: number;
    usersWithoutCompletedAssessment: number;
    mostCommonProfileType: string | null;
    mostRecentCompletion: string | null;
  };
  distributions: {
    profileTypes: AdminDistributionItem[];
    peaceAnchors: AdminDistributionItem[];
    pressureResponses: AdminDistributionItem[];
    processingStyles: AdminDistributionItem[];
  };
  activity: AdminActivityItem[];
  records: AdminAssessmentRecord[];
  notes: string[];
};

const principalProfileTypes = [
  "The Mobilizer",
  "The Achiever",
  "The Contributor",
  "The Strategist",
  "The Advocate",
  "The Inspirer",
  "The Connector",
  "The Observer",
  "The Protector",
  "The Provider",
  "The Stabilizer",
  "The Guardian",
];

export function buildAdminAnalytics({
  users,
  profiles,
  assessments,
}: {
  users: AdminUserSummary[];
  profiles: AdminProfileRow[];
  assessments: AdminAssessmentRow[];
}): AdminAnalyticsPayload {
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const userById = new Map(users.map((user) => [user.id, user]));

  const records = assessments
    .filter(
      (assessment) =>
        assessment.identity_type &&
        assessment.response_type &&
        assessment.processing_style
    )
    .map((assessment) => {
      const user = userById.get(assessment.user_id);
      const profile = profileById.get(assessment.user_id);
      const userName = formatUserName(profile, user?.email || "Unknown user");
      const profileType = getPeaceMainType(
        assessment.identity_type!,
        assessment.response_type!
      );

      return {
        assessmentId: assessment.id,
        userId: assessment.user_id,
        userName,
        email: user?.email || "Unknown email",
        assessmentName: "Peace Assessment" as const,
        profileType,
        profileTitle: assessment.peace_profile || profileType,
        originalProfileDescriptor: assessment.base_pattern || "",
        peaceAnchor: assessment.identity_type!,
        secondaryStrategy: assessment.secondary_identity_type || "",
        pressureResponse: formatPressureResponse(assessment.response_type!),
        processingStyle: assessment.processing_style!,
        completionDate: assessment.created_at,
        resultStatus: "Completed" as const,
      };
    });

  const uniqueCompletedUsers = new Set(records.map((record) => record.userId));
  const profileTypes = buildDistribution(
    principalProfileTypes,
    records.map((record) => record.profileType)
  );
  const mostCommonProfileType =
    profileTypes.find((item) => item.count > 0)?.label || null;

  return {
    ok: true,
    assessment: {
      key: "peace-assessment",
      label: "Peace Assessment",
    },
    overview: {
      totalRegisteredUsers: users.length,
      usersWithCompletedAssessment: uniqueCompletedUsers.size,
      completedAssessments: records.length,
      usersWithoutCompletedAssessment: Math.max(
        users.length - uniqueCompletedUsers.size,
        0
      ),
      mostCommonProfileType,
      mostRecentCompletion: records[0]?.completionDate || null,
    },
    distributions: {
      profileTypes,
      peaceAnchors: buildDistribution(
        ["Performance", "Prestige", "Prosperity"],
        records.map((record) => record.peaceAnchor)
      ),
      pressureResponses: buildDistribution(
        ["Please", "Prove", "Push", "Pull Away"],
        records.map((record) => record.pressureResponse)
      ),
      processingStyles: buildDistribution(
        ["Internal", "External"],
        records.map((record) => record.processingStyle)
      ),
    },
    activity: buildMonthlyActivity(records),
    records,
    notes: [
      "The current database stores completed Peace Assessment results. Separate started-but-not-completed assessment sessions are not stored yet.",
    ],
  };
}

export function buildResultFromAssessmentRow(
  assessment: AdminAssessmentRow
): PeaceAssessmentResult | null {
  if (
    !assessment.identity_type ||
    !assessment.response_type ||
    !assessment.processing_style
  ) {
    return null;
  }

  const secondaryIdentityType =
    assessment.secondary_identity_type || assessment.identity_type;
  const profileKey = `${assessment.identity_type}|${assessment.response_type}|${assessment.processing_style}`;
  const profileContent =
    peaceAssessmentProfiles[profileKey] ||
    peaceAssessmentProfiles["Performance|Prove|Internal"];

  return {
    scores: normalizeScores(assessment.scores),
    identityType: assessment.identity_type,
    secondaryIdentityType,
    responseType: assessment.response_type,
    processingStyle: assessment.processing_style,
    capacityStage:
      (assessment.capacity_stage as PeaceAssessmentResult["capacityStage"]) ||
      "Established",
    peaceProfile: assessment.peace_profile || profileContent.profileName,
    basePattern: assessment.base_pattern || profileContent.baseName,
    profileContent,
  };
}

function normalizeScores(scores: unknown): PeaceAssessmentScores {
  const fallback: PeaceAssessmentScores = {
    Performance: 0,
    Prestige: 0,
    Prosperity: 0,
    Push: 0,
    Prove: 0,
    Please: 0,
    PullAway: 0,
    Internal: 0,
    External: 0,
    PeaceCapacity: 0,
  };

  if (!scores || typeof scores !== "object") return fallback;

  return {
    ...fallback,
    ...(scores as Partial<PeaceAssessmentScores>),
  };
}

export function formatPressureResponse(value: string) {
  return value === "PullAway" ? "Pull Away" : value;
}

function buildDistribution(labels: string[], values: string[]) {
  const total = values.length;
  const counts = new Map(labels.map((label) => [label, 0]));

  values.forEach((value) => {
    counts.set(value, (counts.get(value) || 0) + 1);
  });

  return labels.map((label) => {
    const count = counts.get(label) || 0;

    return {
      key: label,
      label,
      count,
      percentage: total ? Math.round((count / total) * 100) : 0,
    };
  });
}

function buildMonthlyActivity(records: AdminAssessmentRecord[]) {
  const counts = new Map<string, number>();

  records.forEach((record) => {
    if (!record.completionDate) return;

    const date = new Date(record.completionDate);
    const key = `${date.getUTCFullYear()}-${String(
      date.getUTCMonth() + 1
    ).padStart(2, "0")}`;

    counts.set(key, (counts.get(key) || 0) + 1);
  });

  return Array.from(counts.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, count]) => ({
      key,
      label: formatMonthLabel(key),
      count,
    }));
}

function formatMonthLabel(key: string) {
  const [year, month] = key.split("-");
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, 1));

  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatUserName(profile: AdminProfileRow | undefined, fallback: string) {
  const name = [profile?.first_name, profile?.last_name]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");

  return name || fallback;
}
