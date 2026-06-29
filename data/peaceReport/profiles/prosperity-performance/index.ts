import { relationalSecurityKeeper } from "./relational-security-keeper";
import { quietSecurityKeeper } from "./quiet-security-keeper";
import { strategicStabilityBuilder } from "./strategic-stability-builder";
import { privateStabilityBuilder } from "./private-stability-builder";
import { selectiveStabilityKeeper } from "./selective-stability-keeper";
import { guardedStabilityKeeper } from "./guarded-stability-keeper";
import { strategicStabilityAdvocate } from "./strategic-stability-advocate";
import { protectiveStabilityAdvocate } from "./protective-stability-advocate";

export { relationalSecurityKeeper, quietSecurityKeeper, strategicStabilityBuilder, privateStabilityBuilder, selectiveStabilityKeeper, guardedStabilityKeeper, strategicStabilityAdvocate, protectiveStabilityAdvocate };

export const prosperityPerformanceProfiles = {
  [relationalSecurityKeeper.key]: relationalSecurityKeeper,
  [quietSecurityKeeper.key]: quietSecurityKeeper,
  [strategicStabilityBuilder.key]: strategicStabilityBuilder,
  [privateStabilityBuilder.key]: privateStabilityBuilder,
  [selectiveStabilityKeeper.key]: selectiveStabilityKeeper,
  [guardedStabilityKeeper.key]: guardedStabilityKeeper,
  [strategicStabilityAdvocate.key]: strategicStabilityAdvocate,
  [protectiveStabilityAdvocate.key]: protectiveStabilityAdvocate,
};
