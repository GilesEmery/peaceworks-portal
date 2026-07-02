"use client";

import { useMemo, useState } from "react";

import ResultModal from "../../../components/assessment/ResultModal";
import { peaceProfileRegistry } from "../../../data/peaceReport/profileRegistry";
import { getPeaceMainType } from "../../../data/peaceReport/profileNaming";

import type { PeaceAssessmentResult } from "../../../lib/peaceAssessmentScoring";
import type {
  IdentityAnchor,
  PeaceProfileDefinition,
  PressureResponse,
  ProcessingStyle,
} from "../../../data/peaceReport/types";

function splitProfileKey(key: string) {
  const [identityType, secondaryIdentityType, responseType, processingStyle] =
    key.split("|");

  return {
    identityType: identityType as IdentityAnchor,
    secondaryIdentityType: secondaryIdentityType as IdentityAnchor,
    responseType: responseType as PressureResponse,
    processingStyle: processingStyle as ProcessingStyle,
  };
}

function buildMockScores(parts: ReturnType<typeof splitProfileKey>) {
  return {
    Performance:
      parts.identityType === "Performance"
        ? 90
        : parts.secondaryIdentityType === "Performance"
          ? 75
          : 45,
    Prestige:
      parts.identityType === "Prestige"
        ? 90
        : parts.secondaryIdentityType === "Prestige"
          ? 75
          : 45,
    Prosperity:
      parts.identityType === "Prosperity"
        ? 90
        : parts.secondaryIdentityType === "Prosperity"
          ? 75
          : 45,

    Push: parts.responseType === "Push" ? 90 : 45,
    Prove: parts.responseType === "Prove" ? 90 : 45,
    Please: parts.responseType === "Please" ? 90 : 45,
    PullAway: parts.responseType === "PullAway" ? 90 : 45,

    Internal: parts.processingStyle === "Internal" ? 90 : 45,
    External: parts.processingStyle === "External" ? 90 : 45,

    PeaceCapacity: 24,
  };
}

function buildMockResult(
  key: string,
  profile: PeaceProfileDefinition
): PeaceAssessmentResult {
  const parts = splitProfileKey(key);

  return {
    scores: buildMockScores(parts) as PeaceAssessmentResult["scores"],

    identityType: parts.identityType,
    secondaryIdentityType: parts.secondaryIdentityType,
    responseType: parts.responseType,
    processingStyle: parts.processingStyle,

    capacityStage: "Established",

    peaceProfile: profile.title,
    basePattern: profile.subtitle,

    profileContent: {
      profileName: profile.title,
      baseName: profile.subtitle,
      description: profile.summary,
      strengths: profile.peaceAnchorStrengths,
      harder: profile.peaceAnchorGrowthEdges,
      internalPractice:
        profile.personalPractices[0]?.description ||
        "Practice noticing what is happening within you before responding.",
      relationalPractice:
        profile.relationalPractices[0]?.description ||
        "Practice staying present and connected during moments of pressure.",
      stepOfPeace:
        profile.personalPractices[1]?.description ||
        "Take one small, honest step toward peace today.",
      wayOfPeace: profile.wayOfPeace,
      othersExperience: profile.communityPeace.body,
      expandedReflection: profile.leadershipInsight,
    },
  };
}

export default function PeaceProfilesPreview() {
  const profileEntries = useMemo(
    () =>
      Object.entries(peaceProfileRegistry).sort(([, a], [, b]) =>
        a.title.localeCompare(b.title)
      ),
    []
  );

  const [selectedKey, setSelectedKey] = useState(profileEntries[0]?.[0] || "");
  const [modalResult, setModalResult] = useState<PeaceAssessmentResult | null>(
    null
  );

  const selectedProfile = selectedKey
    ? peaceProfileRegistry[selectedKey as keyof typeof peaceProfileRegistry]
    : undefined;

  function openSelectedProfile() {
    if (!selectedKey || !selectedProfile) return;
    setModalResult(buildMockResult(selectedKey, selectedProfile));
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 32,
        background: "#f4f1ea",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 960,
          margin: "0 auto",
          background: "#fff",
          borderRadius: 24,
          padding: 32,
          boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
        }}
      >
        <p
          style={{
            margin: 0,
            color: "#5f7f62",
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          Dev Preview
        </p>

        <h1 style={{ marginTop: 12, marginBottom: 8 }}>
          PeaceWorks Profile Preview
        </h1>

        <p style={{ marginTop: 0, color: "#666", lineHeight: 1.6 }}>
          Preview all {profileEntries.length} PeaceWorks profiles without taking
          the Peace Assessment. Select a profile, open the modal, and download
          the PDF to test the full result experience.
        </p>

        <div style={{ display: "grid", gap: 18, marginTop: 28 }}>
          <label
            style={{
              display: "grid",
              gap: 8,
              fontWeight: 700,
            }}
          >
            Select Profile
            <select
              value={selectedKey}
              onChange={(event) => setSelectedKey(event.target.value)}
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: 14,
                border: "1px solid #ddd",
                fontSize: 16,
                background: "#fff",
              }}
            >
              {profileEntries.map(([key, profile]) => (
                <option key={key} value={key}>
                  {getPeaceMainType(profile)} — {profile.title} —{" "}
                  {profile.profileCode}
                </option>
              ))}
            </select>
          </label>

          {selectedProfile && (
            <div
              style={{
                border: "1px solid #e3e0d8",
                borderRadius: 20,
                padding: 24,
                background: "#faf9f5",
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: "#5f7f62",
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                }}
              >
                Selected Profile
              </p>

              <p
                style={{
                  margin: "18px 0 0",
                  color: "#141414",
                  fontSize: "clamp(2.8rem, 7vw, 5rem)",
                  fontWeight: 700,
                  letterSpacing: 0,
                  lineHeight: 0.95,
                }}
              >
                {getPeaceMainType(selectedProfile)}
              </p>

              <h2
                style={{
                  margin: "6px 0 0",
                  color: "#355c38",
                  fontSize: "clamp(1.4rem, 3vw, 2rem)",
                  fontWeight: 650,
                  letterSpacing: 0,
                  lineHeight: 1.1,
                }}
              >
                {selectedProfile.title}
              </h2>

              <p
                style={{
                  marginTop: 20,
                  color: "#5f7f62",
                  fontSize: 13,
                  fontWeight: 800,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}
              >
                {selectedProfile.profileCode}
              </p>

              <p
                style={{
                  display: "inline-flex",
                  margin: "2px 0 16px",
                  padding: "9px 13px",
                  borderRadius: 999,
                  background: "rgba(143, 171, 142, 0.15)",
                  color: "#5f7f62",
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Established Capacity
              </p>

              <code
                style={{
                  display: "inline-block",
                  padding: "8px 10px",
                  borderRadius: 10,
                  background: "#eee",
                  fontSize: 13,
                }}
              >
                {selectedProfile.key}
              </code>
            </div>
          )}

          <button
            type="button"
            onClick={openSelectedProfile}
            disabled={!selectedProfile}
            style={{
              padding: "14px 22px",
              borderRadius: 999,
              border: "none",
              background: "#111",
              color: "#fff",
              cursor: selectedProfile ? "pointer" : "not-allowed",
              fontWeight: 800,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Open Result Modal
          </button>
        </div>
      </div>

      {modalResult && (
        <ResultModal
          result={modalResult}
          onClose={() => setModalResult(null)}
          onGoToDashboard={() => setModalResult(null)}
        />
      )}
    </main>
  );
}
