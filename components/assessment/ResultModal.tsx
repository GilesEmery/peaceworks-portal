import type { PeaceAssessmentResult } from "../../lib/peaceAssessmentScoring";
import { generatePeacePdf } from "../../lib/generatePeacePdf";
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
  const profile = result.profileContent;
  const fileName = `PeaceWorks-${result.peaceProfile.replaceAll(" ", "-")}.pdf`;

  return (
    <>
      <PdfReport result={result} />

      <div className="pi-result-overlay">
        <div className="pi-result-modal premium-result">
          <div className="pi-result-hero">
            <div>
              <div className="pi-result-label">Your Peace Index Profile</div>
              <h2 className="pi-result-title">{result.peaceProfile}</h2>

              <div className="pi-result-pill-row">
                <span>{result.basePattern}</span>
                <span>{result.processingStyle} Processing</span>
                <span>{result.capacityStage} Capacity</span>
              </div>
            </div>
          </div>

          <div className="pi-result-content">
            <section className="pi-result-section intro-section">
              <p className="pi-result-lede">{profile.description}</p>
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
                <h3>Your Peace Pattern</h3>
              </div>

              <div className="pi-result-insight-grid">
                <div className="pi-insight-card">
                  <small>What tends to steal your peace</small>
                  <strong>{result.identityType}</strong>
                </div>

                <div className="pi-insight-card">
                  <small>Your pressure response</small>
                  <strong>{formatResponseType(result.responseType)}</strong>
                </div>

                <div className="pi-insight-card">
                  <small>How pressure moves</small>
                  <strong>{result.processingStyle}</strong>
                </div>

                <div className="pi-insight-card">
                  <small>Current peace capacity</small>
                  <strong>{result.capacityStage}</strong>
                </div>
              </div>
            </section>

            <section className="pi-result-section">
              <div className="pi-section-heading">
                <span>02</span>
                <h3>How You May Make Peace Well</h3>
              </div>

              <div className="pi-two-column">
                <div className="pi-list-card strength-card">
                  <h4>Natural Strengths</h4>
                  <ul>
                    {profile.strengths.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="pi-list-card growth-card">
                  <h4>Where Peace Can Become Harder</h4>
                  <ul>
                    {profile.harder.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            <section className="pi-result-section">
              <div className="pi-section-heading">
                <span>03</span>
                <h3>What Others May Experience</h3>
              </div>

              <div className="pi-wide-card">
                <p>{profile.othersExperience}</p>
              </div>
            </section>

            <section className="pi-result-section">
              <div className="pi-section-heading">
                <span>04</span>
                <h3>The Way of Peace</h3>
              </div>

              <div className="pi-way-card">
                <p>{profile.wayOfPeace}</p>
              </div>
            </section>

            <section className="pi-result-section">
              <div className="pi-section-heading">
                <span>05</span>
                <h3>Your Practice Pathway</h3>
              </div>

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
            </section>

            <section className="pi-result-section">
              <div className="pi-section-heading">
                <span>06</span>
                <h3>Reflection</h3>
              </div>

              <div className="pi-wide-card reflection-card">
                <p>{profile.expandedReflection}</p>
              </div>
            </section>

            <section className="pi-result-join">
              <div>
                <strong>Join us on your Journey to Peace</strong>
                <p>
                  The PeaceWorks Circle is an ongoing cohort for leaders who want
                  practical structure, relational strength, and steadier leadership
                  under pressure through monthly roundtables, practical tools, and
                  guided one-on-one learning.
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
function formatResponseType(value: string) {

  if (value === "PullAway") return "Pull Away";

  return value;

}