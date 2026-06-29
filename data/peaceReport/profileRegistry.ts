import type { PeaceProfileDefinition, PeaceProfileKey } from "./types";

import {
  performancePrestigeProfiles,
  performanceProsperityProfiles,
  prestigePerformanceProfiles,
  prestigeProsperityProfiles,
  prosperityPerformanceProfiles,
  prosperityPrestigeProfiles,
} from "./profiles";

export const peaceProfileRegistry = {
  ...performancePrestigeProfiles,
  ...performanceProsperityProfiles,
  ...prestigePerformanceProfiles,
  ...prestigeProsperityProfiles,
  ...prosperityPerformanceProfiles,
  ...prosperityPrestigeProfiles,
} as Partial<Record<PeaceProfileKey, PeaceProfileDefinition>>;

export function getPeaceProfileDefinition(
  key: PeaceProfileKey
): PeaceProfileDefinition | undefined {
  return peaceProfileRegistry[key];
}