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
    copy: "The moment peace is disrupted and threat, uncertainty, disappointment, exclusion, or loss of control is experienced.",
  },
  {
    number: "03",
    title: "Protect",
    copy: "The response used to regain safety or stability, including controlling, withdrawing, pleasing, defending, blaming, over-functioning, or avoiding.",
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
    copy: "Name pressure, protection, responsibility, repair, and return without reducing one person to the problem.",
  },
  {
    title: "Practical Tools",
    copy: "Use simple, memorable practices for listening, honest conversation, conflict engagement, and decision-making.",
  },
  {
    title: "Relational Practice",
    copy: "Apply the tools in real meetings, tensions, leadership moments, and everyday work.",
  },
  {
    title: "Rhythms of Reflection, Accountability, and Repair",
    copy: "Build the practices into coaching, reflection, accountability, and organizational routines.",
  },
];

const journeyStages = [
  ["See", "Understand the relational environment, including strengths, tensions, patterns, and readiness."],
  ["Name", "Create shared language for what happens under pressure without reducing one person to the problem."],
  ["Practice", "Use practical tools in real conversations, decisions, tensions, and leadership moments."],
  ["Rhythm", "Build the practices into meetings, coaching, reflection, and accountability."],
  ["Restore", "Address disruption, take responsibility, repair what is possible, and return to shared work."],
  ["Sustain", "Develop internal ownership so the organization can carry the work forward."],
];

const isItems = [
  "A practical relational system",
  "A shared language for pressure and repair",
  "A set of learnable practices",
  "A path toward internal ownership",
];

const isNotItems = [
  "Therapy",
  "A promise of permanent harmony",
  "A substitute for legal, HR, or clinical responsibilities",
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
              Every organization has systems for strategy, roles, execution, and accountability. PeaceWorks strengthens the relational system beneath them—the shared way people respond to pressure, navigate tension, take responsibility, repair disruption, and return to shared work.
            </p>
            <p className={styles.heroSecondary}>
              The system is practical, learnable, and designed to become part of everyday leadership and organizational life.
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
            title="The work needs both technical strength and relational capacity."
          />
          <div className={styles.contrastGrid}>
            <article className={styles.technicalPanel}>
              <span className={styles.panelLabel}>01 — Technical</span>
              <h3>The technical operating system</h3>
              <p>How the organization plans, decides, executes, measures, and holds work accountable.</p>
            </article>
            <article className={styles.relationalPanel}>
              <span className={styles.panelLabel}>02 — Relational</span>
              <h3>The relational operating system</h3>
              <p>How people respond to pressure, speak honestly, listen, take responsibility, repair disruption, and return to shared work.</p>
            </article>
          </div>
          <p className={styles.closingStatement}>
            Both systems matter. Technical strength without relational capacity eventually creates friction, avoidance, control, or distrust.
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <SectionIntro
            eyebrow="Under Pressure"
            title="Pressure reveals how people and groups seek, lose, protect, and restore peace."
            copy="Protective responses are understandable. PeaceWorks helps people recognize them earlier and practice a more responsible return."
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
            title="What the system includes."
            copy="The framework becomes useful when it can be remembered, practiced, and applied in real situations."
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
            eyebrow="From Practice to Internal Ownership"
            title="The system develops through practice, rhythm, repair, and sustainment."
            copy="PeaceWorks may begin through an assessment, a Circle, organizational listening, coaching, or whole-organization practice. The entry point may differ, but the system remains the same."
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
          <p className={styles.outcomeNote}>Over time, tension may be named earlier, ownership may become clearer, and repair may happen sooner.</p>
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
          <p>PeaceWorks helps leaders and organizations build the shared language, tools, and rhythms needed to face pressure with greater awareness, responsibility, dignity, and repair.</p>
          <div className={styles.buttonRow}>
            <Link className={`${styles.button} ${styles.buttonLight}`} href={routes.organizations}>Explore PeaceWorks for Organizations</Link>
            <Link className={`${styles.button} ${styles.buttonOutline}`} href={routes.about}>About PeaceWorks</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
