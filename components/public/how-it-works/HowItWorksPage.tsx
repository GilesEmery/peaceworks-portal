import {
  ArrowDown,
  ArrowRight,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { routes } from "../../../lib/navigation";
import styles from "./HowItWorksPage.module.css";

const pressureStages = [
  {
    number: "01",
    title: "Seek",
    copy: "What a person or group is trying to secure—such as safety, worth, belonging, control, approval, stability, or meaning.",
  },
  {
    number: "02",
    title: "Lose",
    copy: "The moment peace is disrupted and the person experiences threat, uncertainty, disappointment, exclusion, or loss of control.",
  },
  {
    number: "03",
    title: "Protect",
    copy: "The response used to regain safety or stability—such as controlling, withdrawing, pleasing, defending, over-functioning, blaming, or avoiding.",
  },
  {
    number: "04",
    title: "Restore",
    copy: "The practiced movement toward awareness, responsibility, honest engagement, repair, and renewed relationship.",
  },
];

const systemParts = [
  {
    title: "Shared Language",
    copy: "A common vocabulary for pressure, protection, responsibility, repair, and return that helps people name what is happening without reducing one person to the problem.",
  },
  {
    title: "Personal Awareness",
    copy: "The Peace Assessment and Peace Profiles help individuals notice what they seek, what disrupts their peace, how they protect themselves, and how they can practice restoration.",
  },
  {
    title: "Practical Tools",
    copy: "Simple, teachable practices support listening, honest conversation, responsibility, conflict engagement, decision-making, and repair.",
  },
  {
    title: "Relational Rhythms",
    copy: "PeaceWorks practices are integrated into meetings, coaching, leadership conversations, reflection, and the routines the organization already uses.",
  },
  {
    title: "Organizational Listening",
    copy: "Listening Previews, the Cultural Peace Index, and Listening Labs help make relational strengths, patterns, tensions, and hidden experience more visible.",
  },
  {
    title: "Repair and Return",
    copy: "The work does not end with insight. Leaders and teams learn to address what happened, own their part, make repair possible, and return to shared work.",
  },
];

const entryPoints = [
  {
    title: "Peace Assessment",
    role: "Personal awareness",
    copy: "Reveals patterns under pressure and creates a personal doorway into the Relational Operating System.",
  },
  {
    title: "PeaceWorks Circles",
    role: "Leader formation and recurring practice",
    copy: "Leaders practice the work in trusted community and carry it back into their relationships, decisions, teams, and organizations.",
  },
  {
    title: "Organizational Listening",
    role: "Seeing the relational environment",
    copy: "Listening Previews, diagnostics, and Listening Labs make organizational experience more visible before prescribing solutions.",
  },
  {
    title: "Tools and Coaching",
    role: "Practice in real situations",
    copy: "Leaders and teams use PeaceWorks tools in the tensions, conversations, and decisions they are already carrying.",
  },
  {
    title: "Whole-Organization Practice",
    role: "Shared language and integrated rhythms",
    copy: "The system becomes part of leadership, meetings, conflict engagement, and the organization’s normal way of working.",
  },
  {
    title: "Internal Ownership",
    role: "Sustainment",
    copy: "Internal leaders increasingly carry the language, practices, rhythms, and responsibility forward.",
  },
];

const journeyStages = [
  ["See", "Listen carefully and understand the current relational environment, including strengths, tensions, patterns, and readiness."],
  ["Name", "Create shared language for what happens under pressure and make difficult realities discussable without blame."],
  ["Practice", "Use practical tools in real conversations, decisions, tensions, and leadership moments."],
  ["Rhythm", "Build the practices into meetings, reflection, coaching, accountability, and existing organizational routines."],
  ["Restore", "Strengthen the capacity to address disruption, take responsibility, repair what is possible, and return to shared work."],
  ["Sustain", "Develop internal ownership so the organization can increasingly carry the language, tools, rhythms, and practices forward."],
];

const outcomes = [
  "Tension is named earlier.",
  "People speak more directly and listen more carefully.",
  "Responsibility replaces some patterns of blame and triangulation.",
  "Leaders recognize how pressure shapes their own behavior.",
  "Repair becomes a practiced leadership capacity rather than an emergency response.",
  "Teams return to shared work with greater clarity and trust.",
];

const isItems = [
  "A shared relational language",
  "A practical system of tools and rhythms",
  "A formation process for leaders",
  "A way to make relational realities more visible",
  "A framework for responsibility, repair, and return",
  "A path toward greater internal organizational capacity",
];

const isNotItems = [
  "A personality label",
  "A diagnostic of a person’s worth or health",
  "A one-time motivational seminar",
  "A promise that conflict will disappear",
  "A substitute for therapy, legal counsel, or formal HR processes",
  "A guarantee of profit, retention, or productivity",
];

function SectionIntro({
  eyebrow,
  title,
  copy,
  light = false,
}: {
  eyebrow: string;
  title: string;
  copy?: string;
  light?: boolean;
}) {
  return (
    <header className={`${styles.sectionIntro} ${light ? styles.sectionIntroLight : ""}`}>
      <div className={styles.eyebrow}>{eyebrow}</div>
      <h2>{title}</h2>
      {copy && <p>{copy}</p>}
    </header>
  );
}

export default function HowItWorksPage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={`${styles.container} ${styles.heroGrid}`}>
          <div className={styles.heroCopy}>
            <div className={styles.eyebrow}>How PeaceWorks Works</div>
            <h1>The PeaceWorks Relational Operating System</h1>
            <p>
              Every organization has systems for strategy, execution, and accountability. PeaceWorks strengthens the system beneath them—the shared way people recognize pressure, navigate tension, take responsibility, repair disruption, and return to healthier work together.
            </p>
            <p className={styles.heroSecondary}>
              The Relational Operating System is not one program. It is the framework that connects every PeaceWorks experience, from personal awareness and Circles to organizational listening and whole-company practice.
            </p>
            <a className={`${styles.button} ${styles.buttonDark}`} href="#what-is-the-ros">
              Explore the System <ArrowDown aria-hidden="true" size={18} />
            </a>
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

      <section className={`${styles.section} ${styles.comparisonSection}`} id="what-is-the-ros">
        <div className={styles.container}>
          <SectionIntro
            light
            eyebrow="The Missing System"
            title="Most organizations know how work should move. Fewer know how people should move through pressure together."
            copy="Goals, roles, meetings, budgets, and performance systems organize the technical work. But tension, uncertainty, disappointment, power, conflict, and change are carried through relationships. When an organization has no shared relational system, people improvise."
          />
          <div className={styles.contrastGrid}>
            <article className={styles.technicalPanel}>
              <span className={styles.panelLabel}>01 — Technical</span>
              <h3>The technical operating system</h3>
              <p>Organizes goals, roles, decisions, processes, accountability, and execution.</p>
            </article>
            <article className={styles.relationalPanel}>
              <span className={styles.panelLabel}>02 — Relational</span>
              <h3>The relational operating system</h3>
              <p>Shapes how people listen, speak honestly, respond under pressure, exercise power, take responsibility, repair harm, and return to shared work.</p>
            </article>
          </div>
          <p className={styles.closingStatement}>
            PeaceWorks does not replace strategy, management, accountability, or sound operations. It helps people carry them with greater trust, candor, dignity, and relational capacity.
          </p>
        </div>
      </section>

      <section className={`${styles.section} ${styles.pressureSection}`}>
        <div className={styles.container}>
          <SectionIntro
            eyebrow="Under Pressure"
            title="Pressure does not create every relational pattern. It reveals and intensifies the ones already present."
            copy="When safety, worth, approval, control, belonging, or stability feel threatened, people protect what matters to them. Those responses may be understandable and even useful in moderation. But when protection becomes automatic, relationships and teams begin to fragment."
          />
          <div className={styles.pressureFlow} aria-label="Seek, Lose, Protect, Restore">
            {pressureStages.map((stage) => (
              <article className={styles.pressureCard} key={stage.title}>
                <span className={styles.stageNumber}>{stage.number}</span>
                <h3>{stage.title}</h3>
                <p>{stage.copy}</p>
              </article>
            ))}
          </div>
          <p className={styles.closingStatement}>
            The goal is not to eliminate every protective response. It is to recognize it earlier, reduce the harm it creates, and strengthen the capacity to return. This is a practice of awareness, not a diagnosis or fixed personality type.
          </p>
        </div>
      </section>

      <section className={`${styles.section} ${styles.darkSection}`}>
        <div className={styles.container}>
          <SectionIntro
            light
            eyebrow="Inside the System"
            title="Shared language. Practical tools. Repeatable rhythms. Real repair."
            copy="A Relational Operating System becomes useful when it can be remembered, practiced, applied in real situations, and carried by the organization itself."
          />
          <div className={styles.systemGrid}>
            {systemParts.map(({ title, copy }, index) => (
              <article className={styles.systemCard} key={title}>
                <div className={styles.systemCardHeading}>
                  <span aria-label={`Item ${index + 1}`}>{String(index + 1).padStart(2, "0")}</span>
                  <h3>{title}</h3>
                </div>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <SectionIntro
            eyebrow="One System, Different Entry Points"
            title="People and organizations may begin in different places without entering different PeaceWorks systems."
            copy="A leader may begin with personal insight. Another may join a Circle. An organization may begin with listening, an active tension, or a leadership conversation. Each entry point supports the same deeper capacity: recognizing, navigating, repairing, and returning."
          />
          <div className={styles.entryGrid}>
            {entryPoints.map((entry, index) => (
              <article className={styles.entryCard} key={entry.title}>
                <span className={styles.entryNumber} aria-label={`Pathway ${index + 1}`}>{String(index + 1).padStart(2, "0")}</span>
                <h3>{entry.title}</h3>
                <strong>{entry.role}</strong>
                <p>{entry.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.journeySection}`} id="installation-journey">
        <div className={styles.container}>
          <SectionIntro
            eyebrow="The Organizational Journey"
            title="From relational strain to sustainable practice."
            copy="PeaceWorks does not force every organization into the same starting point or pace. The work develops through a clear sequence while remaining responsive to context, trust, power, readiness, and the realities people are carrying."
          />
          <ol className={styles.journey}>
            {journeyStages.map(([title, copy], index) => (
              <li key={title}>
                <span className={styles.journeyNumber}>{String(index + 1).padStart(2, "0")}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </li>
            ))}
          </ol>
          <p className={styles.closingStatement}>
            The aim is not dependence on PeaceWorks. It is growing internal capacity for truth, responsibility, repair, and return.
          </p>
        </div>
      </section>

      <section className={`${styles.section} ${styles.observableSection}`}>
        <div className={styles.container}>
          <SectionIntro
            light
            eyebrow="Observable Movement"
            title="The goal is not a conflict-free organization. It is an organization increasingly capable of working through tension well."
          />
          <div className={styles.outcomesPanel}>
            <div className={styles.outcomesGrid}>
              {outcomes.map((outcome, index) => (
                <article key={outcome}>
                  <span aria-label={`Outcome ${index + 1}`}>{String(index + 1).padStart(2, "0")}</span>
                  <p>{outcome}</p>
                </article>
              ))}
            </div>
            <aside className={styles.qualification}>
              <span className={styles.qualificationLabel}>A grounded promise</span>
              <p>
                PeaceWorks does not promise permanent harmony, guaranteed productivity, or the absence of conflict. It helps organizations build the relational capacity to meet pressure with greater awareness, honesty, responsibility, dignity, and repair.
              </p>
            </aside>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.isSection}`}>
        <div className={styles.container}>
          <header className={styles.centeredHeading}>
            <h2>A practical system, not a promise of perfect peace.</h2>
          </header>
          <div className={styles.isGrid}>
            <article>
              <span className={styles.panelLabel}>01 — What it is</span>
              <h3>PeaceWorks is</h3>
              <ul>{isItems.map((item) => <li key={item}>{item}</li>)}</ul>
            </article>
            <article>
              <span className={styles.panelLabel}>02 — What it is not</span>
              <h3>PeaceWorks is not</h3>
              <ul>{isNotItems.map((item) => <li key={item}>{item}</li>)}</ul>
            </article>
          </div>
        </div>
      </section>

      <section className={styles.nextSection}>
        <div className={`${styles.container} ${styles.nextPanel}`}>
          <div className={styles.eyebrow}>Begin Here</div>
          <h2>There are different ways to begin. They all lead toward practiced peace.</h2>
          <p>Begin with personal awareness, leader formation, or a deeper understanding of PeaceWorks.</p>
          <div className={styles.buttonRow}>
            <Link className={`${styles.button} ${styles.buttonLight}`} href={routes.peaceAssessment}>Take the Peace Assessment</Link>
            <Link className={`${styles.button} ${styles.buttonOutline}`} href={routes.join}>Join a Circle</Link>
            <Link className={styles.textLink} href={routes.about}>About PeaceWorks <ArrowRight aria-hidden="true" size={17} /></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
