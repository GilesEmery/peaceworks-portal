import type {
  IdentityAnchor,
  PeaceProfileDefinition,
  PressureResponse,
} from "./types";

export type PeaceMainType =
  | "The Mobilizer"
  | "The Achiever"
  | "The Contributor"
  | "The Strategist"
  | "The Advocate"
  | "The Inspirer"
  | "The Connector"
  | "The Observer"
  | "The Protector"
  | "The Provider"
  | "The Stabilizer"
  | "The Guardian";

export const peaceMainTypeByAnchorAndResponse = {
  Performance: {
    Push: "The Mobilizer",
    Prove: "The Achiever",
    Please: "The Contributor",
    PullAway: "The Strategist",
  },
  Prestige: {
    Push: "The Advocate",
    Prove: "The Inspirer",
    Please: "The Connector",
    PullAway: "The Observer",
  },
  Prosperity: {
    Push: "The Protector",
    Prove: "The Provider",
    Please: "The Stabilizer",
    PullAway: "The Guardian",
  },
} as const satisfies Record<
  IdentityAnchor,
  Record<PressureResponse, PeaceMainType>
>;

export function getPeaceMainType(
  profile: Pick<PeaceProfileDefinition, "identityAnchor" | "pressureResponse">
): PeaceMainType;
export function getPeaceMainType(
  identityAnchor: IdentityAnchor,
  pressureResponse: PressureResponse
): PeaceMainType;
export function getPeaceMainType(
  profileOrIdentityAnchor:
    | Pick<PeaceProfileDefinition, "identityAnchor" | "pressureResponse">
    | IdentityAnchor,
  pressureResponse?: PressureResponse
): PeaceMainType {
  const identityAnchor =
    typeof profileOrIdentityAnchor === "string"
      ? profileOrIdentityAnchor
      : profileOrIdentityAnchor.identityAnchor;
  const response =
    typeof profileOrIdentityAnchor === "string"
      ? pressureResponse
      : profileOrIdentityAnchor.pressureResponse;

  if (!response) {
    throw new Error("pressureResponse is required to resolve a Peace main type.");
  }

  return peaceMainTypeByAnchorAndResponse[identityAnchor][response];
}
