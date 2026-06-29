import {
  identityContent,
  processingContent,
  responseContent,
} from ".";

import { getPeaceProfileDefinition } from "./profileRegistry";

import type {
  IdentityAnchor,
  PressureResponse,
  ProcessingStyle,
  BuiltPeaceProfile,
  PeaceProfileKey,
} from "./types";

export function buildPeaceReportProfile({
  identityAnchor,
  secondaryPeaceStrategy,
  pressureResponse,
  processingStyle,
}: {
  identityAnchor: IdentityAnchor;
  secondaryPeaceStrategy: IdentityAnchor;
  pressureResponse: PressureResponse;
  processingStyle: ProcessingStyle;
}): BuiltPeaceProfile | null {
  const key =
    `${identityAnchor}|${secondaryPeaceStrategy}|${pressureResponse}|${processingStyle}` as PeaceProfileKey;

  const profile = getPeaceProfileDefinition(key);

  if (!profile) return null;

  return {
    ...profile,
    identityContent: identityContent[identityAnchor],
    responseContent: responseContent[pressureResponse],
    processingContent: processingContent[processingStyle],
  };
}