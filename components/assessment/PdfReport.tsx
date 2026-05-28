import type { PeaceAssessmentResult } from "../../lib/peaceAssessmentScoring";
import ResultGraphs from "./ResultGraphs";

type PdfReportProps = {
  result: PeaceAssessmentResult;
};

export default function PdfReport({ result }: PdfReportProps) {
  const profile = result.profileContent;

  return (
    <div id="peace-pdf-report" className="pdf-report">
      <section className="pdf-page">
        <div className="pdf-kicker">Your Peace Index Profile</div>

        <h1>{result.peaceProfile}</h1>

        <div className="pdf-pill">
          {result.basePattern} • {result.processingStyle} Processing •{" "}
          {result.capacityStage} Capacity
        </div>

        <p className="pdf-description">{profile.description}</p>

        <div className="pdf-graphs">
          <ResultGraphs scores={result.scores} />
        </div>

        <div className="pdf-footer">
          <span>PeaceWorks Peace Index</span>
          <span>1 / 3</span>
        </div>
      </section>

      <section className="pdf-page">
        <div className="pdf-kicker">Your Peace Pattern</div>

        <div className="pdf-two-col">
          <div className="pdf-card">
            <h2>Where you may make peace well</h2>
            <ul>
              {profile.strengths.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="pdf-card">
            <h2>Where peace may be harder</h2>
            <ul>
              {profile.harder.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pdf-card pdf-wide">
          <h2>What others may experience</h2>
          <p>{profile.othersExperience}</p>
        </div>

        <div className="pdf-way">
          <h2>The Way of Peace</h2>
          <p>{profile.wayOfPeace}</p>
        </div>

        <div className="pdf-footer">
          <span>Peace is practiced relationally.</span>
          <span>2 / 3</span>
        </div>
      </section>

      <section className="pdf-page">
        <div className="pdf-kicker">Your Practice Pathway</div>

        <div className="pdf-two-col">
          <div className="pdf-card">
            <h2>Internal practice</h2>
            <p>{profile.internalPractice}</p>
          </div>

          <div className="pdf-card">
            <h2>Relational practice</h2>
            <p>{profile.relationalPractice}</p>
          </div>

          <div className="pdf-card">
            <h2>Take a Step of Peace</h2>
            <p>{profile.stepOfPeace}</p>
          </div>

          <div className="pdf-card">
            <h2>Practice readiness</h2>
            <p>
              Your current peace capacity is{" "}
              <strong>{result.capacityStage}</strong>.
            </p>
          </div>
        </div>

        <div className="pdf-card pdf-wide">
          <h2>Reflection</h2>
          <p>{profile.expandedReflection}</p>
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

        <div className="pdf-footer">
          <span>Peace grows through one practiced response at a time.</span>
          <span>3 / 3</span>
        </div>
      </section>
    </div>
  );
}