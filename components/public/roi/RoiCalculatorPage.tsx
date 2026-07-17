"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";

import {
  calculateRoi,
  clampWidth,
  defaultRoiInputs,
  formatCurrency,
  formatNumber,
  formatPercent,
  type RoiInputs,
  type RoiResults,
} from "../../../lib/roi/calculations";
import { routes } from "../../../lib/navigation";
import styles from "./RoiCalculator.module.css";

type InputKey = keyof RoiInputs;

type FieldConfig = {
  key: InputKey;
  label: string;
  type: "number" | "range";
  min: number;
  max?: number;
  step: number;
  display?: (value: number) => string;
};

const numberFields: FieldConfig[] = [
  { key: "annualRevenue", label: "Annual revenue", type: "number", min: 0, step: 10000 },
  { key: "annualPayroll", label: "Annual payroll", type: "number", min: 0, step: 10000 },
  { key: "employees", label: "Number of full-time employees", type: "number", min: 1, step: 1 },
  { key: "keySalary", label: "Key salary at risk", type: "number", min: 0, step: 1000 },
];

const engagementFields: FieldConfig[] = [
  {
    key: "engagedPct",
    label: "% engaged",
    type: "range",
    min: 0,
    max: 100,
    step: 1,
    display: (value) => `${Math.round(value)}%`,
  },
  {
    key: "productivityDrag",
    label: "Estimated productivity drag",
    type: "range",
    min: 0,
    max: 40,
    step: 1,
    display: (value) => `${Math.round(value)}%`,
  },
  {
    key: "extraDays",
    label: "Extra unproductive days per employee",
    type: "range",
    min: 0,
    max: 10,
    step: 1,
    display: (value) => `${value} day${value === 1 ? "" : "s"}`,
  },
  {
    key: "replacementPct",
    label: "Replacement cost %",
    type: "range",
    min: 0,
    max: 150,
    step: 5,
    display: (value) => `${Math.round(value)}%`,
  },
];

const peaceWorksFields: FieldConfig[] = [
  { key: "monthlyCost", label: "Monthly PeaceWorks cost", type: "number", min: 0, step: 50 },
  {
    key: "improvementPct",
    label: "Estimated cultural improvement",
    type: "range",
    min: 0,
    max: 30,
    step: 1,
    display: (value) => `${Math.round(value)}%`,
  },
];

const inputGroups = [
  { title: "Company inputs", fields: numberFields },
  {
    title: "Engagement assumptions",
    copy:
      "These default assumptions reflect Gallup engagement findings and common workplace cost benchmarks so leaders can begin with a realistic baseline before adjusting for their own context.",
    fields: engagementFields,
  },
  { title: "PeaceWorks assumptions", fields: peaceWorksFields },
];

const validationRules: Record<InputKey, { label: string; min: number; max?: number }> = {
  annualRevenue: { label: "Annual revenue", min: 0 },
  annualPayroll: { label: "Annual payroll", min: 0 },
  employees: { label: "Number of full-time employees", min: 1 },
  keySalary: { label: "Key salary at risk", min: 0 },
  engagedPct: { label: "% engaged", min: 0, max: 100 },
  productivityDrag: { label: "Estimated productivity drag", min: 0, max: 40 },
  extraDays: { label: "Extra unproductive days per employee", min: 0, max: 10 },
  replacementPct: { label: "Replacement cost %", min: 0, max: 150 },
  monthlyCost: { label: "Monthly PeaceWorks cost", min: 0 },
  improvementPct: { label: "Estimated cultural improvement", min: 0, max: 30 },
};

function inputsToStrings(inputs: RoiInputs) {
  return Object.fromEntries(
    Object.entries(inputs).map(([key, value]) => [key, String(value)])
  ) as Record<InputKey, string>;
}

function parseInputs(values: Record<InputKey, string>) {
  const errors: Partial<Record<InputKey, string>> = {};
  const parsed = {} as RoiInputs;

  (Object.keys(validationRules) as InputKey[]).forEach((key) => {
    const rule = validationRules[key];
    const raw = values[key].trim();
    const numberValue = Number(raw);

    if (raw === "") {
      errors[key] = `${rule.label} is required.`;
      parsed[key] = 0;
      return;
    }

    if (!Number.isFinite(numberValue)) {
      errors[key] = `Enter a valid number for ${rule.label.toLowerCase()}.`;
      parsed[key] = 0;
      return;
    }

    if (numberValue < rule.min) {
      errors[key] = `${rule.label} must be ${rule.min === 0 ? "zero or higher" : `at least ${rule.min}`}.`;
    }

    if (rule.max !== undefined && numberValue > rule.max) {
      errors[key] = `${rule.label} must be ${rule.max} or lower.`;
    }

    parsed[key] = numberValue;
  });

  return { parsed, errors };
}

export default function RoiCalculatorPage() {
  const [values, setValues] = useState<Record<InputKey, string>>(
    inputsToStrings(defaultRoiInputs)
  );
  const [pdfStatus, setPdfStatus] = useState<"idle" | "loading" | "error">("idle");
  const [pdfError, setPdfError] = useState("");
  const pdfRef = useRef<HTMLDivElement | null>(null);

  const { parsed, errors } = useMemo(() => parseInputs(values), [values]);
  const hasErrors = Object.keys(errors).length > 0;
  const results = useMemo(() => calculateRoi(parsed), [parsed]);

  function updateValue(key: InputKey, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function resetCalculator() {
    setValues(inputsToStrings(defaultRoiInputs));
    setPdfError("");
    setPdfStatus("idle");
  }

  async function downloadVisualPdf() {
    if (hasErrors || !pdfRef.current) {
      setPdfError("Resolve the highlighted fields before downloading the report.");
      return;
    }

    setPdfStatus("loading");
    setPdfError("");

    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      await new Promise((resolve) => requestAnimationFrame(resolve));

      const canvas = await html2canvas(pdfRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: 816,
        windowHeight: 1056,
      });

      const pdfDoc = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "letter",
      });

      pdfDoc.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 612, 792);
      pdfDoc.save("PeaceWorks-ROI-Report.pdf");
      setPdfStatus("idle");
    } catch (error) {
      console.error("PDF download failed:", error);
      setPdfStatus("error");
      setPdfError("The PDF could not be created. Please try again in a moment.");
    }
  }

  const errorCount = Object.keys(errors).length;

  return (
    <div className={styles.roiPage}>
      <main>
        <section className={styles.hero}>
          <div className={`${styles.container} ${styles.heroGrid}`}>
            <div className={styles.heroCopy}>
              <div className={styles.eyebrow}>PeaceWorks ROI Calculator</div>
              <h1 className={`${styles.display} ${styles.heroTitle}`}>
                Make relational drag visible.
              </h1>
              <p>
                Most leaders can feel the cost of tension, disengagement, and
                low trust. Very few can see it clearly. This calculator helps
                you estimate the hidden business cost of relational drag inside
                your organization — and what could change if healthier
                leadership and culture recovered even part of that lost
                capacity.
              </p>
              <div className={styles.btnRow}>
                <a className={`${styles.btn} ${styles.btnPrimary}`} href="#calculator">
                  Start the Calculator
                </a>
                <Link className={`${styles.btn} ${styles.btnSecondary}`} href={routes.join}>
                  Join the Founders Circle
                </Link>
              </div>
              <div className={styles.heroNote}>
                <strong>This is not abstract culture talk.</strong>
                <span>
                  It is a practical way to translate trust, calm leadership, and
                  relational health into business language leaders can actually
                  see, discuss, and act on.
                </span>
              </div>
            </div>

            <div className={styles.heroVisual} aria-hidden="true">
              <div className={styles.heroGlow} />
              <div className={styles.orbits}>
                <div className={`${styles.orbit} ${styles.orbit1}`} />
                <div className={`${styles.orbit} ${styles.orbit2}`} />
                <div className={`${styles.orbit} ${styles.orbit3}`} />
                <div className={styles.logoWrap}>
                  <Image src="/images/home/peaceworks-circle.svg" alt="" width={420} height={420} priority />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={`${styles.section} ${styles.sectionTight}`} id="calculator">
          <div className={styles.container}>
            <div className={styles.calculatorShell}>
              <div className={styles.splitHead}>
                <div>
                  <div className={styles.eyebrow}>Interactive Calculator</div>
                  <h2>Run the numbers live.</h2>
                </div>
                <p>
                  Adjust the inputs below to reflect your organization. The
                  calculator updates instantly to estimate productivity loss,
                  absentee costs, turnover exposure, total culture exposure, and
                  the potential value of improvement.
                </p>
              </div>

              <div className={styles.calculatorGrid}>
                <section className={styles.inputsPanel} aria-labelledby="roi-inputs-title">
                  <h2 className={styles.panelTitle} id="roi-inputs-title">Inputs</h2>
                  <p className={styles.panelCopy}>
                    Start with a realistic picture of your company and use the
                    sliders to test different assumptions.
                  </p>
                  {errorCount > 0 && (
                    <div className={styles.errorSummary} role="alert">
                      Please fix {errorCount} field{errorCount === 1 ? "" : "s"} before using the PDF download.
                    </div>
                  )}

                  <div className={styles.inputGroups}>
                    {inputGroups.map((group) => (
                      <section className={styles.inputGroup} key={group.title}>
                        <h3>{group.title}</h3>
                        {group.copy && <p className={styles.groupCopy}>{group.copy}</p>}
                        <div className={styles.fieldGrid}>
                          {group.fields.map((field) => (
                            <CalculatorField
                              field={field}
                              key={field.key}
                              value={values[field.key]}
                              error={errors[field.key]}
                              onChange={updateValue}
                            />
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                </section>

                <section className={styles.resultsPanel} aria-labelledby="roi-results-title">
                  <h2 className={styles.panelTitle} id="roi-results-title">Live results</h2>
                  <p className={styles.panelCopy}>
                    A clearer view of what relational drag may already be
                    costing — and what could be recovered.
                  </p>

                  <RoiResultsPanel results={results} hasErrors={hasErrors} />

                  <div className={styles.downloadRow}>
                    <button
                      className={`${styles.btn} ${styles.btnPrimary}`}
                      disabled={pdfStatus === "loading" || hasErrors}
                      onClick={downloadVisualPdf}
                      type="button"
                    >
                      {pdfStatus === "loading" ? "Preparing PDF..." : "Download Visual ROI PDF"}
                    </button>
                    <button
                      className={`${styles.btn} ${styles.btnGhost}`}
                      onClick={resetCalculator}
                      type="button"
                    >
                      Reset
                    </button>
                    <span className={styles.downloadNote}>
                      Downloads a polished, branded one-page report using the current calculator values.
                    </span>
                    {pdfError && <span className={styles.errorText} role="alert">{pdfError}</span>}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </section>

        <RoiContentSections />
      </main>

      <PdfReport refNode={pdfRef} results={results} />
    </div>
  );
}

function CalculatorField({
  field,
  value,
  error,
  onChange,
}: {
  field: FieldConfig;
  value: string;
  error?: string;
  onChange: (key: InputKey, value: string) => void;
}) {
  const id = `roi-${field.key}`;
  const numberValue = Number(value);
  const displayValue = field.display?.(Number.isFinite(numberValue) ? numberValue : 0);

  return (
    <div className={styles.field}>
      <label htmlFor={id}>{field.label}</label>
      {displayValue && <div className={styles.valueChip}>{displayValue}</div>}
      <input
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={Boolean(error)}
        id={id}
        max={field.max}
        min={field.min}
        onChange={(event) => onChange(field.key, event.target.value)}
        step={field.step}
        type={field.type}
        value={value}
      />
      {error && (
        <span className={styles.errorText} id={`${id}-error`}>
          {error}
        </span>
      )}
    </div>
  );
}

function RoiResultsPanel({ results, hasErrors }: { results: RoiResults; hasErrors: boolean }) {
  return (
    <div aria-live="polite" className={hasErrors ? styles.resultsInvalid : undefined}>
      <div className={styles.resultsTop}>
        <div className={styles.bigStat}>
          <strong>{formatCurrency(results.totalCultureCost)}</strong>
          <span>Total estimated culture cost</span>
        </div>
        <div className={styles.bigStat}>
          <strong>{formatCurrency(results.netGain)}</strong>
          <span>Estimated net gain after PeaceWorks investment</span>
        </div>
      </div>

      <div className={styles.metricGrid}>
        <Metric value={results.fteEquivalent.toFixed(1)} label="Full-time employee equivalent" />
        <Metric value={formatCurrency(results.avgHourlyRate)} label="Average hourly rate" />
        <Metric value={formatNumber(results.annualHours)} label="Annual work hours" />
        <Metric value={formatPercent(results.notEngagedPct, 0)} label="Not fully engaged" />
        <Metric value={formatCurrency(results.productivityCost)} label="Productivity cost" />
        <Metric value={formatCurrency(results.absenteeCost)} label="Absentee cost" />
        <Metric value={formatCurrency(results.turnoverCost)} label="Turnover cost" />
      </div>

      <div className={styles.chartStack}>
        <ChartCard
          title="Culture cost composition"
          rows={[
            ["Productivity loss", results.productivityCost, results.productivityShare],
            ["Absenteeism", results.absenteeCost, results.absenteeShare],
            ["Turnover exposure", results.turnoverCost, results.turnoverShare],
          ]}
        />
        <RecoveryCard results={results} />
      </div>
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className={styles.metricCard}>
      <strong>{value}</strong>
      <div className={styles.metricNote}>{label}</div>
    </div>
  );
}

function ChartCard({ title, rows }: { title: string; rows: Array<[string, number, number]> }) {
  return (
    <div className={styles.chartCard}>
      <div className={styles.chartHead}>
        <h3>{title}</h3>
        <div className={styles.chartValue}>Live view</div>
      </div>
      {rows.map(([label, value, share]) => (
        <div className={styles.chartItem} key={label}>
          <div className={styles.chartLabel}>{label}</div>
          <div className={styles.barTrack}>
            <div className={styles.barFill} style={{ width: `${clampWidth(share * 100)}%` }} />
          </div>
          <div className={styles.chartRow}>
            <span>{formatCurrency(value)}</span>
            <span>{formatPercent(share, 1)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function RecoveryCard({ results }: { results: RoiResults }) {
  const rows = [
    {
      label: "Annual PeaceWorks cost",
      width: (results.annualCost / results.maxRecoveryScale) * 100,
      left: formatCurrency(results.annualCost),
      right: `${formatPercent(results.annualCostPctOfRevenue, 1)} of revenue`,
    },
    {
      label: "Estimated value recovered",
      width: (results.recoveredValue / results.maxRecoveryScale) * 100,
      left: formatCurrency(results.recoveredValue),
      right: `${formatPercent(results.improvementPct, 0)} improvement modeled`,
    },
    {
      label: "Improvement needed to break even",
      width: Math.min(results.breakEvenNeeded, 1) * 100,
      left: formatPercent(results.breakEvenNeeded, 1),
      right: "of total culture exposure",
    },
  ];

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartHead}>
        <h3>Recovery model</h3>
        <div className={styles.chartValue}>Break-even view</div>
      </div>
      {rows.map((row) => (
        <div className={styles.chartItem} key={row.label}>
          <div className={styles.chartLabel}>{row.label}</div>
          <div className={styles.barTrack}>
            <div className={styles.barFill} style={{ width: `${clampWidth(row.width)}%` }} />
          </div>
          <div className={styles.chartRow}>
            <span>{row.left}</span>
            <span>{row.right}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function RoiContentSections() {
  return (
    <>
      <section className={`${styles.section} ${styles.sectionTight}`}>
        <div className={styles.container}>
          <div className={styles.whyShell}>
            <div className={styles.splitHead}>
              <div>
                <div className={styles.eyebrow}>What The Calculator Shows</div>
                <h2>The business case becomes clearer when leaders can see the pattern.</h2>
              </div>
              <p>
                The calculator is not trying to reduce culture to a spreadsheet.
                It is helping leaders name what is usually invisible: how
                relational weakness lowers productivity, increases unproductive
                time, and raises the cost of leadership strain and turnover.
              </p>
            </div>
            <div className={styles.reasonsGrid}>
              <MetricCard
                title="Productivity loss"
                text="When engagement is low and pressure is mishandled, time is lost through hesitation, confusion, emotional drag, and indirect communication."
              />
              <MetricCard
                title="Absentee exposure"
                text="Relational stress does not stay in meetings. It affects focus, energy, and people’s actual capacity to bring their best to work."
              />
              <MetricCard
                title="Turnover risk"
                text="When key people leave because of unresolved tension, the cost is not only relational. It is financial, operational, and strategic."
              />
            </div>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.sectionTight}`}>
        <div className={styles.container}>
          <div className={styles.advantageShell}>
            <div className={styles.splitHead}>
              <div>
                <div className={styles.eyebrowLight}>The PeaceWorks Advantage</div>
                <h2>Peace is not passive. It is practiced.</h2>
              </div>
              <p>
                PeaceWorks helps leaders move from awareness to implementation —
                not only seeing the hidden cost of relational drag, but building
                the practices that actually change how a culture responds under
                pressure.
              </p>
            </div>
            <div className={styles.advantageGrid}>
              <AdvantageCard title="Calmer leadership" text="Leaders learn to guide pressure without spreading panic through the organization." />
              <AdvantageCard title="Stronger trust" text="Teams gain more honesty, earlier repair, and healthier ways to carry disagreement." />
              <AdvantageCard title="Recovered capacity" text="Even modest gains in relational health can unlock meaningful financial and organizational value." />
            </div>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.sectionTight}`}>
        <div className={styles.container}>
          <div className={styles.ctaShell}>
            <div className={styles.ctaGrid}>
              <div>
                <div className={styles.eyebrowLight}>What Comes Next</div>
                <h2 className={styles.display}>If the numbers get your attention, the culture already should.</h2>
                <p>
                  PeaceWorks helps leaders move from awareness to practice —
                  building the relational operating system that allows trust to
                  hold under pressure.
                </p>
                <div className={styles.ctaHighlight}>
                  What would change if your leaders became the calmest people in the room?
                </div>
                <div className={styles.btnRow}>
                  <Link className={`${styles.btn} ${styles.btnPrimary}`} href={routes.join}>Join the Founders Circle</Link>
                  <Link className={`${styles.btn} ${styles.btnSecondary}`} href={routes.about}>Contact PeaceWorks</Link>
                </div>
              </div>
              <div className={styles.darkNote}>
                <strong>From ROI to real change.</strong>
                <span>
                  The calculator helps leaders quantify the problem. PeaceWorks
                  helps them practice a different way of leading — through
                  cohorts, practical tools, and relational rhythms that
                  strengthen the culture over time.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function MetricCard({ title, text }: { title: string; text: string }) {
  return (
    <article className={styles.metricCard}>
      <strong>{title}</strong>
      <div className={styles.metricNote}>{text}</div>
    </article>
  );
}

function AdvantageCard({ title, text }: { title: string; text: string }) {
  return (
    <article className={styles.advantageCard}>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

function PdfReport({
  refNode,
  results,
}: {
  refNode: React.RefObject<HTMLDivElement | null>;
  results: RoiResults;
}) {
  return (
    <div className={styles.pdfReport} ref={refNode} aria-hidden="true">
      <div className={styles.pdfCard}>
        <div className={styles.pdfTitleBrand}>
          <div className={styles.pdfTitleMain}>PeaceWorks</div>
        </div>
        <div className={styles.pdfEyebrow}>PeaceWorks ROI Calculator</div>
        <h1 className={styles.pdfTitle}>Relational drag, made visible.</h1>
        <p className={styles.pdfCopy}>
          This report estimates the hidden business cost of disengagement,
          absenteeism, leadership strain, productivity loss, and turnover
          exposure — and models what healthier leadership and stronger
          relational culture could recover.
        </p>
        <div className={styles.pdfBigGrid}>
          <PdfBigCard label="Total estimated culture cost / net loss exposure" value={formatCurrency(results.totalCultureCost)} variant="loss" />
          <PdfBigCard label="Estimated net gain after one year of PeaceWorks investment" value={formatCurrency(results.netGain)} variant="gain" />
        </div>
        <div className={styles.pdfChart}>
          <h2>Company inputs used</h2>
          <div className={`${styles.pdfSummaryGrid} ${styles.companyInputGrid}`}>
            <PdfSummary label="Annual revenue" value={formatCurrency(results.annualRevenue)} />
            <PdfSummary label="Annual payroll" value={formatCurrency(results.annualPayroll)} />
            <PdfSummary label="Full-time employees" value={formatNumber(results.employees)} />
            <PdfSummary label="Key salary at risk" value={formatCurrency(results.keySalary)} />
            <PdfSummary label="Monthly PeaceWorks cost" value={formatCurrency(results.monthlyCost)} />
            <PdfSummary label="Annual PeaceWorks cost" value={formatCurrency(results.annualCost)} />
          </div>
        </div>
        <div className={styles.pdfMetricGrid}>
          <PdfMetric label="Productivity cost" value={formatCurrency(results.productivityCost)} />
          <PdfMetric label="Absentee cost" value={formatCurrency(results.absenteeCost)} />
          <PdfMetric label="Turnover exposure" value={formatCurrency(results.turnoverCost)} />
        </div>
        <PdfChart
          title="Culture cost composition"
          rows={[
            ["Productivity loss", results.productivityShare, formatPercent(results.productivityShare, 1)],
            ["Absenteeism", results.absenteeShare, formatPercent(results.absenteeShare, 1)],
            ["Turnover exposure", results.turnoverShare, formatPercent(results.turnoverShare, 1)],
          ]}
        />
        <PdfChart
          title="Recovery model"
          rows={[
            ["Annual PeaceWorks cost", results.annualCost / results.maxRecoveryScale, formatCurrency(results.annualCost)],
            ["Estimated value recovered", results.recoveredValue / results.maxRecoveryScale, formatCurrency(results.recoveredValue)],
            ["Break-even improvement", Math.min(results.breakEvenNeeded, 1), formatPercent(results.breakEvenNeeded, 1)],
          ]}
        />
        <div className={styles.pdfSummaryGrid}>
          <PdfSummary label="FTE equivalent" value={results.fteEquivalent.toFixed(1)} />
          <PdfSummary label="Average hourly rate" value={formatCurrency(results.avgHourlyRate)} />
          <PdfSummary label="Not fully engaged" value={formatPercent(results.notEngagedPct, 0)} />
          <PdfSummary label="Improvement modeled" value={formatPercent(results.improvementPct, 0)} />
        </div>
        <div className={styles.pdfCta}>
          <h2>Peace is not passive. It is practiced.</h2>
          <p>
            PeaceWorks helps leaders move from awareness to implementation —
            building the relational operating system that allows trust to hold
            under pressure.
          </p>
        </div>
        <div className={styles.pdfFooterNote}>
          This report is an estimate for strategic conversation, not a financial
          audit. The numbers are based on the assumptions entered into the
          PeaceWorks ROI Calculator.
          <br />
          <br />
          Questions or ready to schedule a meeting? Contact contact@peaceworks.network.
        </div>
      </div>
    </div>
  );
}

function PdfBigCard({ label, value, variant }: { label: string; value: string; variant: "loss" | "gain" }) {
  return (
    <div className={`${styles.pdfBigCard} ${styles[variant]}`}>
      <div className={styles.pdfBigValue}>{value}</div>
      <div className={styles.pdfBigLabel}>{label}</div>
    </div>
  );
}

function PdfMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.pdfMetric}>
      <div className={styles.pdfMetricValue}>{value}</div>
      <div className={styles.pdfMetricLabel}>{label}</div>
    </div>
  );
}

function PdfSummary({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.pdfSummary}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function PdfChart({ title, rows }: { title: string; rows: Array<[string, number, string]> }) {
  return (
    <div className={styles.pdfChart}>
      <h2>{title}</h2>
      {rows.map(([label, width, value]) => (
        <div className={styles.pdfChartRow} key={label}>
          <div className={styles.pdfChartLabel}>{label}</div>
          <div className={styles.pdfBarTrack}>
            <div className={styles.pdfBarFill} style={{ width: `${clampWidth(width * 100)}%` }} />
          </div>
          <div className={styles.pdfChartValue}>{value}</div>
        </div>
      ))}
    </div>
  );
}
