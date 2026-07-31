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
    copy: "The moment that sense of peace is disrupted by threat, uncertainty, disappointment, exclusion, or loss of control.",
  },
  {
    number: "03",
    title: "Protect",
    copy: "The response used to regain stability—such as controlling, withdrawing, pleasing, defending, blaming, over-functioning, or avoiding.",
  },
  {
    number: "04",
    title: "Restore",
    copy: "The practiced movement toward awareness, honest engagement, responsibility, repair, and renewed relationship.",
  },
];

const systemParts = [
  {
    title: "Shared Language",
    copy: "Name what is happening without reducing one person to the problem.",
  },
  {
    title: "Practical Tools",
    copy: "Use simple practices for listening, honest conversation, conflict engagement, and decision-making.",
  },
  {
    title: "Relational Practice",
    copy: "Apply the framework in the situations where trust, clarity, and cooperation are actually tested.",
  },
  {
    title: "Rhythms of Reflection, Accountability, and Repair",
    copy: "Build the practices into coaching, meetings, reflection, accountability, and organizational routines.",
  },
];

const journeyStages = [
  ["See", "Understand the current environment, including strengths, strain, patterns, and readiness."],
  ["Name", "Create shared language for what happens when the work between people becomes difficult."],
  ["Practice", "Use practical tools in real conversations, decisions, tensions, and leadership moments."],
  ["Rhythm", "Build the practices into meetings, coaching, reflection, and accountability."],
  ["Restore", "Address disruption, take responsibility, repair what is possible, and return to shared work."],
  ["Sustain", "Develop internal ownership so the organization can carry the work forward."],
];

const isItems = [
  "A practical relational operating system",
  "A shared language for difficult moments",
  "A set of learnable practices",
  "A path toward internal ownership",
];

const isNotItems = [
  "Therapy",
  "A promise of permanent harmony",
  "A substitute for legal, HR, clinical, or operational responsibility",
  "A one-time motivational workshop",
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
              Every organization has systems for strategy, roles, execution, and accountability. PeaceWorks strengthens the system between people—how they respond under pressure, speak honestly, take responsibility, repair disruption, and return to shared work.
            </p>
            <p className={styles.heroSecondary}>
              It is a practical framework leaders and teams can learn, practice, and build into everyday organizational life.
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

      <section className={`${styles.section} ${styles.anchorTarget}`} id="what-is-the-ros">
        <div className={`${styles.container} ${styles.comparisonPanel}`}>
          <SectionIntro
            light
            eyebrow="Two Operating Systems"
            title="Strong execution depends on more than strategy."
            copy="Organizations need both a technical system for the work and a relational system for how people carry it together."
          />
          <div className={styles.contrastGrid}>
            <article className={styles.technicalPanel}>
              <span className={styles.panelLabel}>01 — Technical</span>
              <h3>The technical operating system</h3>
              <p>How the organization sets direction, assigns roles, makes decisions, executes work, measures progress, and holds performance accountable.</p>
            </article>
            <article className={styles.relationalPanel}>
              <span className={styles.panelLabel}>02 — Relational</span>
              <h3>The relational operating system</h3>
              <p>How people listen, speak honestly, respond to strain, exercise responsibility, work through disruption, and rebuild trust.</p>
            </article>
          </div>
          <p className={styles.closingStatement}>
            When the technical system is strong but the relational system is weak, friction eventually reaches the work.
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <SectionIntro
            eyebrow="Under Pressure"
            title="Pressure reveals the pattern."
            copy="PeaceWorks helps people recognize what they are trying to protect, how disruption changes their behavior, and what a more responsible return can look like."
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
        </div>
      </section>

      <section className={styles.section}>
        <div className={`${styles.container} ${styles.systemPanel}`}>
          <SectionIntro
            light
            eyebrow="Inside the System"
            title="A framework people can remember and use."
            copy="The system becomes valuable when it can guide real conversations, decisions, tensions, and leadership moments."
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

      <section className={`${styles.section} ${styles.anchorTarget}`} id="installation-journey">
        <div className={styles.container}>
          <SectionIntro
            eyebrow="From Practice to Ownership"
            title="The system becomes sustainable through use."
            copy="PeaceWorks may begin in different places, but the developmental movement remains consistent."
          />
          <Link className={styles.organizationsLink} href={routes.organizations}>Explore PeaceWorks for Organizations <ArrowRight aria-hidden="true" size={17} /></Link>
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

      <section className={styles.section}>
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
          <div className={styles.eyebrow}>Practice Peace</div>
          <h2>Peace becomes practical when it becomes practiced.</h2>
          <p>PeaceWorks helps leaders and organizations build the shared language, practices, and rhythms needed to work through pressure with greater honesty, responsibility, and care.</p>
          <div className={styles.buttonRow}>
            <Link className={`${styles.button} ${styles.buttonLight}`} href={routes.organizations}>Explore PeaceWorks for Organizations</Link>
            <Link className={`${styles.button} ${styles.buttonOutline}`} href={routes.about}>About PeaceWorks</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
