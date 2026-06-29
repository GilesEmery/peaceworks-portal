import { relationalContributionHarmonizer } from "./relational-contribution-harmonizer";
import { privateContributionHarmonizer } from "./private-contribution-harmonizer";
import { visibleImpactBuilder } from "./visible-impact-builder";
import { privateImpactBuilder } from "./private-impact-builder";
import { selectiveContributionKeeper } from "./selective-contribution-keeper";
import { guardedContributionKeeper } from "./guarded-contribution-keeper";
import { expressiveContributionAdvocate } from "./expressive-contribution-advocate";
import { principledContributionAdvocate } from "./principled-contribution-advocate";

export { relationalContributionHarmonizer, privateContributionHarmonizer, visibleImpactBuilder, privateImpactBuilder, selectiveContributionKeeper, guardedContributionKeeper, expressiveContributionAdvocate, principledContributionAdvocate };

export const prestigePerformanceProfiles = {
  [relationalContributionHarmonizer.key]: relationalContributionHarmonizer,
  [privateContributionHarmonizer.key]: privateContributionHarmonizer,
  [visibleImpactBuilder.key]: visibleImpactBuilder,
  [privateImpactBuilder.key]: privateImpactBuilder,
  [selectiveContributionKeeper.key]: selectiveContributionKeeper,
  [guardedContributionKeeper.key]: guardedContributionKeeper,
  [expressiveContributionAdvocate.key]: expressiveContributionAdvocate,
  [principledContributionAdvocate.key]: principledContributionAdvocate,
};
