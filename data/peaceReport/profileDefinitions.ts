import type { PeaceProfileDefinition } from "./types";

import {
  performancePrestigeProfiles,
  performanceProsperityProfiles,
  prestigePerformanceProfiles,
  prestigeProsperityProfiles,
  prosperityPerformanceProfiles,
  prosperityPrestigeProfiles,
} from "./profiles";

export const profileDefinitions = {
  ...performancePrestigeProfiles,
  ...performanceProsperityProfiles,
  ...prestigePerformanceProfiles,
  ...prestigeProsperityProfiles,
  ...prosperityPerformanceProfiles,
  ...prosperityPrestigeProfiles,
} satisfies Record<string, PeaceProfileDefinition>;
