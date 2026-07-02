import type { ReactNode } from "react";
import type { PeaceAssessmentResult } from "../../lib/peaceAssessmentScoring";
import {
  buildPeaceReportProfile,
  getPeaceMainType,
} from "../../data/peaceReport";
import ResultGraphs from "./ResultGraphs";

type PdfReportProps = {
  result: PeaceAssessmentResult;
};

export default function PdfReport({ result }: PdfReportProps) {
  const expandedProfile = buildPeaceReportProfile({
    identityAnchor: result.identityType,
    secondaryPeaceStrategy:
      result.secondaryIdentityType || result.identityType,
    pressureResponse: result.responseType,
    processingStyle: result.processingStyle,
  });

  const profile = result.profileContent;
  const mainType = expandedProfile
    ? getPeaceMainType(expandedProfile)
    : getPeaceMainType(result.identityType, result.responseType);
  const subtype = expandedProfile?.title || result.peaceProfile;
  const profileCode =
    expandedProfile?.profileCode ||
    `${result.identityType} • ${result.secondaryIdentityType || ""} • ${
      result.responseType === "PullAway" ? "Pull Away" : result.responseType
    } • ${result.processingStyle} Processing`;

  return (
    <div id="peace-pdf-report" className="pdf-report" aria-hidden="true">
      <PdfPage pageNumber={1} footerText="Peace Assessment Results">
        <div className="pdf-eyebrow">Your Peace Assessment Profile</div>
        <h1 className="pdf-title">{mainType}</h1>
        <div className="pdf-subtype">{subtype}</div>
        <div className="pdf-profile-code">{profileCode}</div>

        <div className="pdf-subtitle pdf-capacity-pill">
          {result.capacityStage} Capacity
        </div>

        <div className="pdf-summary pdf-summary-compact">
          {renderParagraphs(expandedProfile?.summary || profile.description)}
        </div>

        <div className="pdf-graph-wrap">
          <ResultGraphs scores={result.scores} />
        </div>
      </PdfPage>

      <PdfPage pageNumber={2} footerText="Peace begins with awareness.">
        <div className="pdf-eyebrow">Understanding Your Results</div>

        <div className="pdf-two-column">
          <div className="pdf-card pdf-card-feature">
            <small>Primary Pattern</small>
            <h2>{expandedProfile?.peaceAnchor.title || "Your Peace Anchor"}</h2>
            {renderParagraphs(
              expandedProfile?.peaceAnchor.body || result.identityType
            )}
          </div>

          <div className="pdf-card pdf-card-feature">
            <small>Secondary Pattern</small>
            <h2>
              {expandedProfile?.secondaryStrategy.title ||
                "Your Secondary Peace Strategy"}
            </h2>
            {renderParagraphs(
              expandedProfile?.secondaryStrategy.body ||
                result.secondaryIdentityType ||
                ""
            )}
          </div>
        </div>

        {expandedProfile && (
          <>
            <div className="pdf-two-column pdf-section-space">
              <div className="pdf-card">
                <h3>Peace Anchor Strengths</h3>
                <ul>
                  {expandedProfile.peaceAnchorStrengths.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="pdf-card">
                <h3>Peace Anchor Growth Edges</h3>
                <ul>
                  {expandedProfile.peaceAnchorGrowthEdges.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pdf-reflection-callout pdf-section-space">
              <small>Reflection Question</small>
              <p>{expandedProfile.peaceAnchorReflectionQuestion}</p>
            </div>
          </>
        )}
      </PdfPage>

      <PdfPage pageNumber={3} footerText="Peace is practiced under pressure.">
        <div className="pdf-eyebrow">How Pressure Moves Through You</div>

        <div className="pdf-card pdf-card-wide pdf-pressure-card">
          <small>Primary Response</small>
          <h2>
            {expandedProfile?.pressure.title ||
              formatResponseType(result.responseType)}
          </h2>

          {renderParagraphs(
            expandedProfile?.pressure.body || profile.othersExperience
          )}

          {expandedProfile?.secondaryPressureResponse && (
            <p className="pdf-soft-note">
              Secondary Response:{" "}
              <strong>
                {formatResponseType(expandedProfile.secondaryPressureResponse)}
              </strong>
            </p>
          )}
        </div>

        {expandedProfile && (
          <>
            <div className="pdf-two-column pdf-section-space">
              <div className="pdf-card">
                <h3>Pressure Strengths</h3>
                <ul>
                  {expandedProfile.pressure.strengths.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="pdf-card">
                <h3>Pressure Growth Areas</h3>
                <ul>
                  {expandedProfile.pressure.growthAreas.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pdf-two-column pdf-section-space">
              <div className="pdf-card">
                <h3>Typical Pressure Behaviors</h3>
                <ul>
                  {expandedProfile.pressure.typicalBehaviors.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="pdf-card pdf-reflection-card">
                <h3>Pressure Reflection</h3>
                <p>{expandedProfile.pressure.reflectionQuestion}</p>
              </div>
            </div>
          </>
        )}
      </PdfPage>

      <PdfPage
        pageNumber={4}
        footerText="Peace is gained, lost, protected, and restored."
      >
        <div className="pdf-eyebrow">How You Process Peace</div>

        <div className="pdf-card pdf-card-wide">
          <small>Processing Style</small>
          <h2>
            {expandedProfile?.processing.title ||
              `${result.processingStyle} Processing`}
          </h2>

          {renderParagraphs(
            expandedProfile?.processing.body || result.processingStyle
          )}

          {expandedProfile && (
            <p className="pdf-soft-note">
              <strong>Reflection Question:</strong>{" "}
              {expandedProfile.processing.reflectionQuestion}
            </p>
          )}
        </div>

        <div className="pdf-card pdf-card-wide pdf-section-space">
          <h2>
            {expandedProfile?.internalPeace.title ||
              "How You Experience Peace Internally"}
          </h2>

          {renderParagraphs(
            expandedProfile?.internalPeace.body || profile.expandedReflection
          )}
        </div>

        {expandedProfile && (
          <div className="pdf-section-space">
            <h2 className="pdf-cycle-title">The Peace Cycle</h2>

            <div className="pdf-cycle-grid pdf-cycle-grid-boxes">
              <div className="pdf-card pdf-cycle-box">
                <h3>How You Seek Peace</h3>
                <ul>
                  {expandedProfile.peaceCycle.seek.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="pdf-card pdf-cycle-box">
                <h3>How You Lose Peace</h3>
                <ul>
                  {expandedProfile.peaceCycle.lose.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="pdf-card pdf-cycle-box">
                <h3>How You Protect Peace</h3>
                <ul>
                  {expandedProfile.peaceCycle.protect.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="pdf-card pdf-cycle-box">
                <h3>How You Restore Peace</h3>
                <ul>
                  {expandedProfile.peaceCycle.restore.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </PdfPage>

      <PdfPage pageNumber={5} footerText="Peace grows relationally.">
        <div className="pdf-eyebrow">How You Bring Peace to Others</div>

        <div className="pdf-card pdf-card-wide pdf-card-feature pdf-community-peace-card">
          <h2>
            {expandedProfile?.communityPeace.title ||
              "How You Bring Peace to Others"}
          </h2>

          {renderParagraphs(
            expandedProfile?.communityPeace.body || profile.othersExperience
          )}
        </div>

        {expandedProfile && (
          <>
            <div className="pdf-two-column pdf-section-space">
              <div className="pdf-card">
                <h2>What People Appreciate</h2>
                <ul>
                  {expandedProfile.teamImpact.whatPeopleAppreciate.map(
                    (item) => (
                      <li key={item}>{item}</li>
                    )
                  )}
                </ul>
              </div>

              <div className="pdf-card">
                <h2>Potential Challenges</h2>
                <ul>
                  {expandedProfile.teamImpact.potentialChallenges.map(
                    (item) => (
                      <li key={item}>{item}</li>
                    )
                  )}
                </ul>
              </div>
            </div>

            <div className="pdf-card pdf-card-wide pdf-section-space pdf-community-card">
              <h2>Peace in Community</h2>

              <div className="pdf-community-grid">
                <div className="pdf-community-item">
                  <h3>In Teams</h3>
                  <p>{expandedProfile.teamImpact.inTeams}</p>
                </div>

                <div className="pdf-community-item">
                  <h3>In Relationships</h3>
                  <p>{expandedProfile.teamImpact.inRelationships}</p>
                </div>

                <div className="pdf-community-item">
                  <h3>In Leadership</h3>
                  <p>{expandedProfile.teamImpact.inLeadership}</p>
                </div>

                <div className="pdf-community-item">
                  <h3>In Conflict</h3>
                  <p>{expandedProfile.teamImpact.inConflict}</p>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="pdf-card pdf-card-wide pdf-section-space pdf-leadership-card">
          <h2>Leadership Insight</h2>
          {renderParagraphs(
            expandedProfile?.leadershipInsight || profile.expandedReflection
          )}
        </div>
      </PdfPage>

      <PdfPage
        pageNumber={6}
        footerText="Peace grows through one practiced response at a time."
      >
        <div className="pdf-eyebrow">Your Practice Pathway</div>

        {expandedProfile ? (
          <div className="pdf-two-column">
            <div className="pdf-card">
              <h2>Personal Growth Practices</h2>
              <ul>
                {expandedProfile.personalPractices.map((practice) => (
                  <li key={practice.title}>
                    <strong>{practice.title}:</strong> {practice.description}
                  </li>
                ))}
              </ul>
            </div>

            <div className="pdf-card">
              <h2>Relational Growth Practices</h2>
              <ul>
                {expandedProfile.relationalPractices.map((practice) => (
                  <li key={practice.title}>
                    <strong>{practice.title}:</strong> {practice.description}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="pdf-card pdf-card-wide">
            <h2>Practice Pathway</h2>
            <p>{profile.internalPractice}</p>
            <p>{profile.relationalPractice}</p>
            <p>{profile.stepOfPeace}</p>
          </div>
        )}

        <div className="pdf-card pdf-card-wide pdf-section-space">
          <h2>Practice Readiness</h2>
          {renderParagraphs(
            expandedProfile?.practiceReadiness ||
              `Your current peace capacity is ${result.capacityStage}. This is not a final label. It is a snapshot of your current capacity to practice peace under pressure.`
          )}
        </div>

        <div className="pdf-way pdf-section-space">
          <h2>The Way of Peace</h2>
          {renderParagraphs(expandedProfile?.wayOfPeace || profile.wayOfPeace)}
        </div>

        <div className="pdf-join">
          <h2>Join us on your Journey to Peace</h2>
          <p>
            The PeaceWorks Circle is an ongoing cohort for leaders who want
            practical structure, relational strength, and steadier leadership
            under pressure through monthly roundtables, practical tools, and
            guided one-on-one learning.
          </p>
          <strong>PEACEWORKS.NETWORK/JOIN</strong>
        </div>
      </PdfPage>
    </div>
  );
}

function PdfPage({
  children,
  pageNumber,
  footerText,
}: {
  children: ReactNode;
  pageNumber: number;
  footerText: string;
}) {
  return (
    <section className="pdf-page">
      <div className="pdf-page-inner">{children}</div>

      <div className="pdf-footer">
        <span>{footerText}</span>
        <span>{pageNumber} / 6</span>
      </div>
    </section>
  );
}

function renderParagraphs(text?: string) {
  if (!text) return null;

  return text
    .split("\n\n")
    .filter(Boolean)
    .map((paragraph, index) => (
      <p key={`${paragraph.slice(0, 20)}-${index}`}>{paragraph}</p>
    ));
}

function formatResponseType(value: string) {
  if (value === "PullAway") return "Pull Away";
  return value;
}
