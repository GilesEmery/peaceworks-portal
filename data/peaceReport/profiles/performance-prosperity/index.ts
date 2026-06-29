import { relationalStabilityPerformer } from "./relational-stability-performer";
import { quietStabilityPerformer } from "./quiet-stability-performer";
import { strategicStabilityAchiever } from "./strategic-stability-achiever";
import { privateStabilityAchiever } from "./private-stability-achiever";
import { selectiveStabilityPerformer } from "./selective-stability-performer";
import { guardedStabilityPerformer } from "./guarded-stability-performer";
import { strategicStabilityPerformer } from "./strategic-stability-performer";
import { protectiveStabilityPerformer } from "./protective-stability-performer";

export { relationalStabilityPerformer, quietStabilityPerformer, strategicStabilityAchiever, privateStabilityAchiever, selectiveStabilityPerformer, guardedStabilityPerformer, strategicStabilityPerformer, protectiveStabilityPerformer };

export const performanceProsperityProfiles = {
  [relationalStabilityPerformer.key]: relationalStabilityPerformer,
  [quietStabilityPerformer.key]: quietStabilityPerformer,
  [strategicStabilityAchiever.key]: strategicStabilityAchiever,
  [privateStabilityAchiever.key]: privateStabilityAchiever,
  [selectiveStabilityPerformer.key]: selectiveStabilityPerformer,
  [guardedStabilityPerformer.key]: guardedStabilityPerformer,
  [strategicStabilityPerformer.key]: strategicStabilityPerformer,
  [protectiveStabilityPerformer.key]: protectiveStabilityPerformer,
};
