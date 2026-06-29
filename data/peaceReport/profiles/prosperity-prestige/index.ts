import { relationalBelongingKeeper } from "./relational-belonging-keeper";
import { privateBelongingKeeper } from "./private-belonging-keeper";
import { visibleWorthBuilder } from "./visible-worth-builder";
import { privateWorthBuilder } from "./private-worth-builder";
import { selectiveBelongingKeeper } from "./selective-belonging-keeper";
import { guardedBelongingKeeper } from "./guarded-belonging-keeper";
import { expressiveBelongingAdvocate } from "./expressive-belonging-advocate";
import { protectiveBelongingAdvocate } from "./protective-belonging-advocate";

export { relationalBelongingKeeper, privateBelongingKeeper, visibleWorthBuilder, privateWorthBuilder, selectiveBelongingKeeper, guardedBelongingKeeper, expressiveBelongingAdvocate, protectiveBelongingAdvocate };

export const prosperityPrestigeProfiles = {
  [relationalBelongingKeeper.key]: relationalBelongingKeeper,
  [privateBelongingKeeper.key]: privateBelongingKeeper,
  [visibleWorthBuilder.key]: visibleWorthBuilder,
  [privateWorthBuilder.key]: privateWorthBuilder,
  [selectiveBelongingKeeper.key]: selectiveBelongingKeeper,
  [guardedBelongingKeeper.key]: guardedBelongingKeeper,
  [expressiveBelongingAdvocate.key]: expressiveBelongingAdvocate,
  [protectiveBelongingAdvocate.key]: protectiveBelongingAdvocate,
};
