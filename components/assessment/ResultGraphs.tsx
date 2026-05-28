import type { PeaceAssessmentScores } from "../../lib/peaceAssessmentScoring";

type ResultGraphsProps = {
  scores: PeaceAssessmentScores;
};

export default function ResultGraphs({ scores }: ResultGraphsProps) {
  const identity = normalizeScores({
    Performance: scores.Performance,
    Prestige: scores.Prestige,
    Prosperity: scores.Prosperity,
  });

  const pressure = normalizeScores({
    Push: scores.Push,
    Prove: scores.Prove,
    Please: scores.Please,
    PullAway: scores.PullAway,
  });

  const identityPolygon = getIdentityPolygon(identity);
  const identityCenter = getWeightedTriangleCenter(identity);

  const pressurePolygon = getPressurePolygon(pressure);
  const pressureCenter = getWeightedPressureCenter(pressure);

  const processingTotal = scores.Internal + scores.External || 1;
  const externalPercent = (scores.External / processingTotal) * 100;

  return (
    <div className="result-graphs">
      <div className="graph-card">
        <h4>Identity Tension</h4>

        <svg className="identity-graph" viewBox="0 0 260 235">
          <polygon
            points="130,22 32,196 228,196"
            fill="rgba(143,171,142,0.08)"
            stroke="rgba(90,122,92,0.38)"
            strokeWidth="2"
          />

          <line x1="130" y1="22" x2="130" y2="138" className="graph-guide" />
          <line x1="32" y1="196" x2="130" y2="138" className="graph-guide" />
          <line x1="228" y1="196" x2="130" y2="138" className="graph-guide" />

          <polygon points={identityPolygon} className="graph-fill" />

          <circle cx={identityCenter.x} cy={identityCenter.y} r="7" className="graph-dot" />

          <text x="130" y="14" textAnchor="middle" className="graph-label">
            Performance
          </text>

          <text x="22" y="218" textAnchor="start" className="graph-label">
            Prestige
          </text>

          <text x="238" y="218" textAnchor="end" className="graph-label">
            Prosperity
          </text>
        </svg>
      </div>

      <div className="graph-card">
        <h4>Pressure Response</h4>

        <svg className="pressure-graph" viewBox="0 0 260 235">
          <rect
            x="35"
            y="28"
            width="190"
            height="170"
            rx="18"
            fill="rgba(246,243,238,0.76)"
            stroke="rgba(20,20,20,0.12)"
          />

          <line x1="130" y1="28" x2="130" y2="198" className="graph-guide" />
          <line x1="35" y1="113" x2="225" y2="113" className="graph-guide" />

          <polygon points={pressurePolygon} className="graph-fill" />

          <circle cx={pressureCenter.x} cy={pressureCenter.y} r="7" className="graph-dot" />

          <text x="80" y="62" textAnchor="middle" className="graph-label">
            Push
          </text>

          <text x="180" y="62" textAnchor="middle" className="graph-label">
            Prove
          </text>

          <text x="80" y="170" textAnchor="middle" className="graph-label">
            Please
          </text>

          <text x="180" y="170" textAnchor="middle" className="graph-label">
            Pull Away
          </text>
        </svg>
      </div>

      <div className="graph-card graph-card-wide">
        <h4>Processing Style</h4>

        <div className="processing-line">
          <span>Internal</span>

          <div className="line-track">
            <span className="line-dot" style={{ left: `${externalPercent}%` }} />
          </div>

          <span>External</span>
        </div>
      </div>
    </div>
  );
}

function normalizeScores<T extends string>(rawScores: Record<T, number>) {
  const values = Object.values(rawScores) as number[];
  const max = Math.max(...values, 1);

  return Object.fromEntries(
    Object.entries(rawScores).map(([key, value]) => [
      key,
      Math.max(0.18, Number(value) / max),
    ])
  ) as Record<T, number>;
}

function pointBetween(
  center: { x: number; y: number },
  target: { x: number; y: number },
  ratio: number
) {
  return {
    x: center.x + (target.x - center.x) * ratio,
    y: center.y + (target.y - center.y) * ratio,
  };
}

function getIdentityPolygon(scores: Record<"Performance" | "Prestige" | "Prosperity", number>) {
  const center = { x: 130, y: 138 };

  const performancePoint = pointBetween(center, { x: 130, y: 22 }, scores.Performance);
  const prestigePoint = pointBetween(center, { x: 32, y: 196 }, scores.Prestige);
  const prosperityPoint = pointBetween(center, { x: 228, y: 196 }, scores.Prosperity);

  return `${performancePoint.x},${performancePoint.y} ${prosperityPoint.x},${prosperityPoint.y} ${prestigePoint.x},${prestigePoint.y}`;
}

function getWeightedTriangleCenter(
  scores: Record<"Performance" | "Prestige" | "Prosperity", number>
) {
  const total = scores.Performance + scores.Prestige + scores.Prosperity || 1;

  const p1 = { x: 130, y: 22 };
  const p2 = { x: 32, y: 196 };
  const p3 = { x: 228, y: 196 };

  return {
    x:
      (scores.Performance * p1.x +
        scores.Prestige * p2.x +
        scores.Prosperity * p3.x) /
      total,
    y:
      (scores.Performance * p1.y +
        scores.Prestige * p2.y +
        scores.Prosperity * p3.y) /
      total,
  };
}

function getPressurePolygon(scores: Record<"Push" | "Prove" | "Please" | "PullAway", number>) {
  const center = { x: 130, y: 113 };

  const pushPoint = pointBetween(center, { x: 80, y: 62 }, scores.Push);
  const provePoint = pointBetween(center, { x: 180, y: 62 }, scores.Prove);
  const pullAwayPoint = pointBetween(center, { x: 180, y: 170 }, scores.PullAway);
  const pleasePoint = pointBetween(center, { x: 80, y: 170 }, scores.Please);

  return `${pushPoint.x},${pushPoint.y} ${provePoint.x},${provePoint.y} ${pullAwayPoint.x},${pullAwayPoint.y} ${pleasePoint.x},${pleasePoint.y}`;
}

function getWeightedPressureCenter(
  scores: Record<"Push" | "Prove" | "Please" | "PullAway", number>
) {
  const total = scores.Push + scores.Prove + scores.Please + scores.PullAway || 1;

  const push = { x: 80, y: 62 };
  const prove = { x: 180, y: 62 };
  const please = { x: 80, y: 170 };
  const pullAway = { x: 180, y: 170 };

  return {
    x:
      (scores.Push * push.x +
        scores.Prove * prove.x +
        scores.Please * please.x +
        scores.PullAway * pullAway.x) /
      total,
    y:
      (scores.Push * push.y +
        scores.Prove * prove.y +
        scores.Please * please.y +
        scores.PullAway * pullAway.y) /
      total,
  };
}