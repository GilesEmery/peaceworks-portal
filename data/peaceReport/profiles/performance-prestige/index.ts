import { relationalApprovalHarmonizer } from "./relational-approval-harmonizer";
import { privateApprovalHarmonizer } from "./private-approval-harmonizer";
import { expressiveRecognitionBuilder } from "./expressive-recognition-builder";
import { privateRecognitionBuilder } from "./private-recognition-builder";
import { selectiveRecognitionKeeper } from "./selective-recognition-keeper";
import { guardedRecognitionKeeper } from "./guarded-recognition-keeper";
import { expressiveWorthAdvocate } from "./expressive-worth-advocate";
import { privateWorthAdvocate } from "./private-worth-advocate";

export { relationalApprovalHarmonizer, privateApprovalHarmonizer, expressiveRecognitionBuilder, privateRecognitionBuilder, selectiveRecognitionKeeper, guardedRecognitionKeeper, expressiveWorthAdvocate, privateWorthAdvocate };

export const performancePrestigeProfiles = {
  [relationalApprovalHarmonizer.key]: relationalApprovalHarmonizer,
  [privateApprovalHarmonizer.key]: privateApprovalHarmonizer,
  [expressiveRecognitionBuilder.key]: expressiveRecognitionBuilder,
  [privateRecognitionBuilder.key]: privateRecognitionBuilder,
  [selectiveRecognitionKeeper.key]: selectiveRecognitionKeeper,
  [guardedRecognitionKeeper.key]: guardedRecognitionKeeper,
  [expressiveWorthAdvocate.key]: expressiveWorthAdvocate,
  [privateWorthAdvocate.key]: privateWorthAdvocate,
};
