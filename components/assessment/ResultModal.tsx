import type { PeaceAssessmentResult } from "../../lib/peaceAssessmentScoring";
import { generatePeacePdf } from "../../lib/generatePeacePdf";
import {
  buildPeaceReportProfile,
  getPeaceMainType,
} from "../../data/peaceReport";
import PdfReport from "./PdfReport";
import ResultGraphs from "./ResultGraphs";

type ResultModalProps = {
  result: PeaceAssessmentResult;
  onClose: () => void;
  onGoToDashboard: () => void;
};

export default function ResultModal({
  result,
  onClose,
  onGoToDashboard,
}: ResultModalProps) {
  const expandedProfile = buildPeaceReportProfile({
    identityAnchor: result.identityType,
    secondaryPeaceStrategy: result.secondaryIdentityType || result.identityType,
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

  const fileName = `Peace-Assessment-${subtype.replaceAll(" ", "-")}.pdf`;

  return (
    <>
      <PdfReport result={result} />

      <div className="pi-result-overlay">
        <div className="pi-result-modal premium-result">
          <div className="pi-result-hero">
            <div>
              <div className="pi-result-label">Your Peace Assessment Profile</div>
              <h2 className="pi-result-main-type">{mainType}</h2>
              <div className="pi-result-subtype">{subtype}</div>
              <div className="pi-profile-code">{profileCode}</div>

              <div className="pi-result-pill-row">
                <span>{result.capacityStage} Capacity</span>
              </div>
            </div>
          </div>

          <div className="pi-result-content">
            <section className="pi-result-section intro-section">
              <div className="pi-result-lede">
                {renderParagraphs(expandedProfile?.summary || profile.description)}
              </div>
            </section>

            <section className="pi-result-section">
              <div className="pi-section-heading">
                <span>00</span>
                <h3>Your Peace Index Map</h3>
              </div>

              <ResultGraphs scores={result.scores} />
            </section>

            <section className="pi-result-section">
              <div className="pi-section-heading">
                <span>01</span>
                <h3>Understanding Your Results</h3>
              </div>

              <div className="pi-two-column">
                <div className="pi-list-card pi-emphasis-card">
                  <small>Primary Pattern</small>
                  <h4>{expandedProfile?.peaceAnchor.title || "Your Peace Anchor"}</h4>
                  <div>
                    {renderParagraphs(
                      expandedProfile?.peaceAnchor.body || result.identityType
                    )}
                  </div>
                </div>

                <div className="pi-list-card pi-emphasis-card">
                  <small>Secondary Pattern</small>
                  <h4>
                    {expandedProfile?.secondaryStrategy.title ||
                      "Your Secondary Peace Strategy"}
                  </h4>
                  <div>
                    {renderParagraphs(
                      expandedProfile?.secondaryStrategy.body ||
                        result.secondaryIdentityType ||
                        ""
                    )}
                  </div>
                </div>
              </div>

              {expandedProfile && (
                <>
                  <div className="pi-two-column pi-modal-space">
                    <div className="pi-list-card strength-card">
                      <small>Peace Anchor</small>
                      <h4>Peace Anchor Strengths</h4>
                      <ul>
                        {expandedProfile.peaceAnchorStrengths.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="pi-list-card growth-card">
                      <small>Peace Anchor</small>
                      <h4>Peace Anchor Growth Edges</h4>
                      <ul>
                        {expandedProfile.peaceAnchorGrowthEdges.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pi-wide-card pi-reflection-card pi-modal-space">
                    <small>Reflection Question</small>
                    <p>{expandedProfile.peaceAnchorReflectionQuestion}</p>
                  </div>
                </>
              )}
            </section>

            <section className="pi-result-section">
              <div className="pi-section-heading">
                <span>02</span>
                <h3>How Pressure Moves Through You</h3>
              </div>

              <div className="pi-wide-card pi-emphasis-card">
                <small>Primary Response</small>
                <h4>
                  {expandedProfile?.pressure.title ||
                    formatResponseType(result.responseType)}
                </h4>

                <div>
                  {renderParagraphs(
                    expandedProfile?.pressure.body || profile.othersExperience
                  )}
                </div>

                {expandedProfile?.secondaryPressureResponse && (
                  <p className="pi-soft-note">
                    Secondary Response:{" "}
                    <strong>
                      {formatResponseType(expandedProfile.secondaryPressureResponse)}
                    </strong>
                  </p>
                )}
              </div>

              {expandedProfile && (
                <>
                  <div className="pi-two-column pi-modal-space">
                    <div className="pi-list-card strength-card">
                      <h4>Pressure Strengths</h4>
                      <ul>
                        {expandedProfile.pressure.strengths.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="pi-list-card growth-card">
                      <h4>Pressure Growth Areas</h4>
                      <ul>
                        {expandedProfile.pressure.growthAreas.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pi-two-column pi-modal-space">
                    <div className="pi-list-card">
                      <small>Pressure Pattern</small>
                      <h4>Typical Pressure Behaviors</h4>
                      <ul>
                        {expandedProfile.pressure.typicalBehaviors.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="pi-list-card pi-reflection-card">
                      <small>Reflection Question</small>
                      <h4>Pressure Reflection</h4>
                      <p>{expandedProfile.pressure.reflectionQuestion}</p>
                    </div>
                  </div>
                </>
              )}
            </section>

            <section className="pi-result-section">
              <div className="pi-section-heading">
                <span>03</span>
                <h3>How You Process Peace</h3>
              </div>

              <div className="pi-wide-card">
                <small>Processing Style</small>
                <h4>
                  {expandedProfile?.processing.title ||
                    `${result.processingStyle} Processing`}
                </h4>

                <div>
                  {renderParagraphs(
                    expandedProfile?.processing.body || result.processingStyle
                  )}
                </div>

                {expandedProfile && (
                  <p className="pi-soft-note">
                    <strong>Reflection Question:</strong>{" "}
                    {expandedProfile.processing.reflectionQuestion}
                  </p>
                )}
              </div>
            </section>

            <section className="pi-result-section">
              <div className="pi-section-heading">
                <span>04</span>
                <h3>How You Experience Peace Internally</h3>
              </div>

              <div className="pi-wide-card">
                <h4>
                  {expandedProfile?.internalPeace.title ||
                    "How You Experience Peace Internally"}
                </h4>

                <div>
                  {renderParagraphs(
                    expandedProfile?.internalPeace.body ||
                      profile.expandedReflection
                  )}
                </div>
              </div>
            </section>

            {expandedProfile && (
              <section className="pi-result-section pi-feature-section">
                <div className="pi-section-heading">
                  <span>05</span>
                  <h3>The Peace Cycle</h3>
                </div>

                <div className="pi-cycle-grid">
                  <div className="pi-cycle-card">
                    <small>Seek Peace</small>
                    <h4>How You Seek Peace</h4>
                    <ul>
                      {expandedProfile.peaceCycle.seek.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="pi-cycle-card">
                    <small>Lose Peace</small>
                    <h4>How You Lose Peace</h4>
                    <ul>
                      {expandedProfile.peaceCycle.lose.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="pi-cycle-card">
                    <small>Protect Peace</small>
                    <h4>How You Protect Peace</h4>
                    <ul>
                      {expandedProfile.peaceCycle.protect.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="pi-cycle-card">
                    <small>Restore Peace</small>
                    <h4>How You Restore Peace</h4>
                    <ul>
                      {expandedProfile.peaceCycle.restore.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>
            )}

            <section className="pi-result-section">
              <div className="pi-section-heading">
                <span>06</span>
                <h3>How You Bring Peace to Others</h3>
              </div>

              <div className="pi-wide-card pi-emphasis-card">
                <h4>
                  {expandedProfile?.communityPeace.title ||
                    "How You Bring Peace to Others"}
                </h4>

                <div>
                  {renderParagraphs(
                    expandedProfile?.communityPeace.body ||
                      profile.othersExperience
                  )}
                </div>
              </div>

              {expandedProfile && (
                <>
                  <div className="pi-two-column pi-modal-space">
                    <div className="pi-list-card strength-card">
                      <h4>What People Appreciate</h4>
                      <ul>
                        {expandedProfile.teamImpact.whatPeopleAppreciate.map(
                          (item) => (
                            <li key={item}>{item}</li>
                          )
                        )}
                      </ul>
                    </div>

                    <div className="pi-list-card growth-card">
                      <h4>Potential Challenges</h4>
                      <ul>
                        {expandedProfile.teamImpact.potentialChallenges.map(
                          (item) => (
                            <li key={item}>{item}</li>
                          )
                        )}
                      </ul>
                    </div>
                  </div>

                  <div className="pi-community-block">
                    <h4>Peace in Community</h4>

                    <div className="pi-community-grid">
                      <div className="pi-community-card">
                        <small>In Teams</small>
                        <p>{expandedProfile.teamImpact.inTeams}</p>
                      </div>

                      <div className="pi-community-card">
                        <small>In Relationships</small>
                        <p>{expandedProfile.teamImpact.inRelationships}</p>
                      </div>

                      <div className="pi-community-card">
                        <small>In Leadership</small>
                        <p>{expandedProfile.teamImpact.inLeadership}</p>
                      </div>

                      <div className="pi-community-card">
                        <small>In Conflict</small>
                        <p>{expandedProfile.teamImpact.inConflict}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </section>

            <section className="pi-result-section">
              <div className="pi-section-heading">
                <span>07</span>
                <h3>Leadership Insight</h3>
              </div>

              <div className="pi-wide-card reflection-card">
                <div>
                  {renderParagraphs(
                    expandedProfile?.leadershipInsight ||
                      profile.expandedReflection
                  )}
                </div>
              </div>
            </section>

            <section className="pi-result-section">
              <div className="pi-section-heading">
                <span>08</span>
                <h3>Your Practice Pathway</h3>
              </div>

              {expandedProfile ? (
                <div className="pi-two-column">
                  <div className="pi-list-card">
                    <small>Personal Growth</small>
                    <h4>Personal Growth Practices</h4>
                    <ul>
                      {expandedProfile.personalPractices.map((practice) => (
                        <li key={practice.title}>
                          <strong>{practice.title}:</strong>{" "}
                          {practice.description}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pi-list-card">
                    <small>Relational Growth</small>
                    <h4>Relational Growth Practices</h4>
                    <ul>
                      {expandedProfile.relationalPractices.map((practice) => (
                        <li key={practice.title}>
                          <strong>{practice.title}:</strong>{" "}
                          {practice.description}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="pi-practice-grid">
                  <div className="pi-practice-card">
                    <small>Internal Practice</small>
                    <p>{profile.internalPractice}</p>
                  </div>

                  <div className="pi-practice-card">
                    <small>Relational Practice</small>
                    <p>{profile.relationalPractice}</p>
                  </div>

                  <div className="pi-practice-card">
                    <small>Step of Peace</small>
                    <p>{profile.stepOfPeace}</p>
                  </div>
                </div>
              )}

              <div className="pi-wide-card pi-readiness-card">
                <small>Practice Readiness</small>
                <h4>{result.capacityStage}</h4>
                <div>
                  {renderParagraphs(
                    expandedProfile?.practiceReadiness ||
                      `Your current peace capacity is ${result.capacityStage}. This is not a final label. It is a snapshot of your current capacity to practice peace under pressure.`
                  )}
                </div>
              </div>
            </section>

            <section className="pi-result-section">
              <div className="pi-section-heading">
                <span>09</span>
                <h3>The Way of Peace</h3>
              </div>

              <div className="pi-way-card">
                {renderParagraphs(
                  expandedProfile?.wayOfPeace || profile.wayOfPeace
                )}
              </div>
            </section>

            <section className="pi-result-join">
              <div>
                <strong>Join us on your Journey to Peace</strong>
                <p>
                  The PeaceWorks Circle is an ongoing cohort for leaders who
                  want practical structure, relational strength, and steadier
                  leadership under pressure through monthly roundtables,
                  practical tools, and guided one-on-one learning.
                </p>
              </div>
            </section>

            <div className="pi-result-footer">
              <button className="btn btn-secondary" type="button" onClick={onClose}>
                Close
              </button>

              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => generatePeacePdf(fileName)}
              >
                Download PDF
              </button>

              <button
                className="btn btn-primary"
                type="button"
                onClick={onGoToDashboard}
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
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
