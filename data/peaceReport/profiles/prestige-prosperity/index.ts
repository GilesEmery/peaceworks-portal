import { relationalBelongingStabilizer } from "./relational-belonging-stabilizer";
import { quietBelongingStabilizer } from "./quiet-belonging-stabilizer";
import { visibleSecurityBuilder } from "./visible-security-builder";
import { privateSecurityBuilder } from "./private-security-builder";
import { selectiveSecurityKeeper } from "./selective-security-keeper";
import { guardedSecurityKeeper } from "./guarded-security-keeper";
import { expressiveSecurityAdvocate } from "./expressive-security-advocate";
import { principledSecurityAdvocate } from "./principled-security-advocate";

export { relationalBelongingStabilizer, quietBelongingStabilizer, visibleSecurityBuilder, privateSecurityBuilder, selectiveSecurityKeeper, guardedSecurityKeeper, expressiveSecurityAdvocate, principledSecurityAdvocate };

export const prestigeProsperityProfiles = {
  [relationalBelongingStabilizer.key]: relationalBelongingStabilizer,
  [quietBelongingStabilizer.key]: quietBelongingStabilizer,
  [visibleSecurityBuilder.key]: visibleSecurityBuilder,
  [privateSecurityBuilder.key]: privateSecurityBuilder,
  [selectiveSecurityKeeper.key]: selectiveSecurityKeeper,
  [guardedSecurityKeeper.key]: guardedSecurityKeeper,
  [expressiveSecurityAdvocate.key]: expressiveSecurityAdvocate,
  [principledSecurityAdvocate.key]: principledSecurityAdvocate,
};
