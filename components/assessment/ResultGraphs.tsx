import type { PeaceAssessmentScores } from "../../lib/peaceAssessmentScoring";

type ResultGraphsProps = {
  scores: PeaceAssessmentScores;
};

type IdentityKey = "Performance" | "Prestige" | "Prosperity";
type PressureKey = "Push" | "Prove" | "Please" | "PullAway";

export default function ResultGraphs({ scores }: ResultGraphsProps) {
  const identityRaw = {
    Performance: scores.Performance,
    Prestige: scores.Prestige,
    Prosperity: scores.Prosperity,
  };

  const pressureRaw = {
    Push: scores.Push,
    Prove: scores.Prove,
    Please: scores.Please,
    PullAway: scores.PullAway,
  };

  const identity = normalizeScores(identityRaw);
  const pressure = normalizeScores(pressureRaw);

  const identityPolygon = getIdentityCirclePolygon(identity);
  const identityCenter = getWeightedIdentityCircleCenter(identity);

  const pressurePolygon = getPressurePolygon(pressure);
  const pressureCenter = getWeightedPressureCenter(pressure);

  const identityPrimary = getTopScore(identityRaw);
  const identitySecondary = getSecondScore(identityRaw);

  const pressurePrimary = getTopScore(pressureRaw);
  const pressureSecondary = getSecondScore(pressureRaw);

  const processingTotal = scores.Internal + scores.External || 1;
  const externalPercent = (scores.External / processingTotal) * 100;
  const processingPrimary =
    scores.External > scores.Internal ? "External" : "Internal";

  return (
    <div className="result-graphs">
      <div className="graph-card">
        <h4>Identity Tension</h4>

        <svg className="identity-graph" viewBox="0 0 260 250">
          <defs>
            <clipPath id="identityCircleClip">
              <circle cx="130" cy="124" r="90" />
            </clipPath>
          </defs>

          <circle
            cx="130"
            cy="124"
            r="90"
            fill="rgba(246,243,238,0.78)"
            stroke="rgba(20,20,20,0.10)"
            strokeWidth="2"
          />

          <g clipPath="url(#identityCircleClip)">
            <path
              d="M130 124 L52.1 79 A90 90 0 0 1 207.9 79 Z"
              fill="rgba(143,171,142,0.22)"
            />

            <path
              d="M130 124 L207.9 79 A90 90 0 0 1 130 214 Z"
              fill="rgba(143,171,142,0.15)"
            />

            <path
              d="M130 124 L130 214 A90 90 0 0 1 52.1 79 Z"
              fill="rgba(143,171,142,0.11)"
            />

            <line x1="130" y1="124" x2="52.1" y2="79" className="graph-divider" />
            <line x1="130" y1="124" x2="207.9" y2="79" className="graph-divider" />
            <line x1="130" y1="124" x2="130" y2="214" className="graph-divider" />
          </g>

          <polygon points={identityPolygon} className="graph-fill" />

          <circle
            cx={identityCenter.x}
            cy={identityCenter.y}
            r="8"
            className="graph-dot"
          />

          <text x="130" y="64" textAnchor="middle" className="graph-label">
            Performance
          </text>

          <text x="188" y="155" textAnchor="middle" className="graph-label">
            Prestige
          </text>

          <text x="72" y="155" textAnchor="middle" className="graph-label">
            Prosperity
          </text>
        </svg>

        <p className="graph-explainer">
          Primary Driver: <strong>{identityPrimary.label}</strong>. Secondary
          Driver: <strong>{identitySecondary.label}</strong>. This shows what
          most often tends to pull your peace off center.
        </p>
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

          <circle
            cx={pressureCenter.x}
            cy={pressureCenter.y}
            r="7"
            className="graph-dot"
          />

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

        <p className="graph-explainer">
          Primary Response: <strong>{formatLabel(pressurePrimary.label)}</strong>.
          Secondary Response:{" "}
          <strong>{formatLabel(pressureSecondary.label)}</strong>. This shows
          how pressure most often moves through you.
        </p>
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

        <p className="graph-explainer">
          Your processing leans <strong>{processingPrimary}</strong>. This shows
          whether pressure tends to move inward privately or outward relationally.
        </p>
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

function getIdentityCirclePolygon(scores: Record<IdentityKey, number>) {
  const center = { x: 130, y: 124 };

  const performancePoint = pointBetween(
    center,
    { x: 130, y: 44 },
    scores.Performance
  );

  const prestigePoint = pointBetween(
    center,
    { x: 199.3, y: 164 },
    scores.Prestige
  );

  const prosperityPoint = pointBetween(
    center,
    { x: 60.7, y: 164 },
    scores.Prosperity
  );

  return `${performancePoint.x},${performancePoint.y} ${prestigePoint.x},${prestigePoint.y} ${prosperityPoint.x},${prosperityPoint.y}`;
}

function getWeightedIdentityCircleCenter(scores: Record<IdentityKey, number>) {
  const total = scores.Performance + scores.Prestige + scores.Prosperity || 1;

  const performance = { x: 130, y: 44 };
  const prestige = { x: 199.3, y: 164 };
  const prosperity = { x: 60.7, y: 164 };

  return {
    x:
      (scores.Performance * performance.x +
        scores.Prestige * prestige.x +
        scores.Prosperity * prosperity.x) /
      total,
    y:
      (scores.Performance * performance.y +
        scores.Prestige * prestige.y +
        scores.Prosperity * prosperity.y) /
      total,
  };
}

function getPressurePolygon(scores: Record<PressureKey, number>) {
  const center = { x: 130, y: 113 };

  const pushPoint = pointBetween(center, { x: 80, y: 62 }, scores.Push);
  const provePoint = pointBetween(center, { x: 180, y: 62 }, scores.Prove);
  const pullAwayPoint = pointBetween(
    center,
    { x: 180, y: 170 },
    scores.PullAway
  );
  const pleasePoint = pointBetween(center, { x: 80, y: 170 }, scores.Please);

  return `${pushPoint.x},${pushPoint.y} ${provePoint.x},${provePoint.y} ${pullAwayPoint.x},${pullAwayPoint.y} ${pleasePoint.x},${pleasePoint.y}`;
}

function getWeightedPressureCenter(scores: Record<PressureKey, number>) {
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

function getTopScore<T extends string>(scores: Record<T, number>) {
  return Object.entries(scores)
    .map(([label, value]) => ({ label, value: Number(value) }))
    .sort((a, b) => b.value - a.value)[0];
}

function getSecondScore<T extends string>(scores: Record<T, number>) {
  return Object.entries(scores)
    .map(([label, value]) => ({ label, value: Number(value) }))
    .sort((a, b) => b.value - a.value)[1];
}

function formatLabel(label: string) {
  if (label === "PullAway") return "Pull Away";
  return label;
}