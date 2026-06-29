export type IdentityAnchor = "Performance" | "Prestige" | "Prosperity";

export type PressureResponse = "Push" | "Prove" | "Please" | "PullAway";

export type ProcessingStyle = "Internal" | "External";

export type PracticeReadinessStage =
  | "Emerging"
  | "Developing"
  | "Established"
  | "Transforming";

export type PeaceProfileKey =
  `${IdentityAnchor}|${IdentityAnchor}|${PressureResponse}|${ProcessingStyle}`;

export type ContentBlock = {
  title: string;
  body: string;
};

export type Practice = {
  title: string;
  description: string;
};

export type ProfilePressureSection = {
  title: string;
  body: string;
  strengths: string[];
  growthAreas: string[];
  typicalBehaviors: string[];
  reflectionQuestion: string;
};

export type ProfileProcessingSection = {
  title: string;
  body: string;
  reflectionQuestion: string;
};

export type IdentityContent = {
  label: IdentityAnchor;
  coreQuestion: string;
  peaceAnchorDescription: string;
  shadowSide: string[];
  seeksPeaceThrough: string[];
  losesPeaceWhen: string[];
  protectsPeaceBy: string[];
  restoresPeaceThrough: string[];
  strengths: string[];
  growthEdges: string[];
  reflectionQuestion: string;
};

export type ResponseContent = {
  label: PressureResponse;
  displayLabel: string;
  pressureStrategy: string;
  description: string;
  strengths: string[];
  growthEdges: string[];
  typicalBehaviors: string[];
  reflectionQuestion: string;
};

export type ProcessingContent = {
  label: ProcessingStyle;
  description: string;
  characteristics: string[];
  strengths: string[];
  growthEdges: string[];
  reflectionQuestion: string;
};

export type PeaceCycle = {
  seek: string[];
  lose: string[];
  protect: string[];
  restore: string[];
};

export type TeamImpact = {
  whatPeopleAppreciate: string[];
  potentialChallenges: string[];
  inTeams: string;
  inRelationships: string;
  inLeadership: string;
  inConflict: string;
};

export type ReadinessStageLabels = {
  emerging: string;
  developing: string;
  established: string;
  transforming: string;
};

export type PeaceProfileDefinition = {
  key: PeaceProfileKey;

  /**
   * Participant-facing profile name.
   * Example: "The Steady Presence"
   */
  title: string;

  /**
   * Deeper descriptive profile name.
   * Example: "The Relational Security Keeper"
   */
  subtitle: string;

  /**
   * Display version of the full profile combination.
   * Example: "Prosperity • Performance • Please • Internal Processing"
   */
  profileCode: string;

  summary: string;

  identityAnchor: IdentityAnchor;
  secondaryPeaceStrategy: IdentityAnchor;
  pressureResponse: PressureResponse;
  secondaryPressureResponse?: PressureResponse;
  processingStyle: ProcessingStyle;

  peaceAnchor: ContentBlock;
  secondaryStrategy: ContentBlock;

  peaceAnchorStrengths: string[];
  peaceAnchorGrowthEdges: string[];
  peaceAnchorReflectionQuestion: string;

  pressure: ProfilePressureSection;
  processing: ProfileProcessingSection;

  internalPeace: ContentBlock;
  communityPeace: ContentBlock;
  leadershipInsight: string;

  peaceCycle: PeaceCycle;
  teamImpact: TeamImpact;

  personalPractices: Practice[];
  relationalPractices: Practice[];

  practiceReadiness: string;
  readinessStageLabels: ReadinessStageLabels;

  wayOfPeace: string;
};

export type BuiltPeaceProfile = PeaceProfileDefinition & {
  identityContent: IdentityContent;
  responseContent: ResponseContent;
  processingContent: ProcessingContent;
};