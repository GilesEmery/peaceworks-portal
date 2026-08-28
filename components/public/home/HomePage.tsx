import Image from "next/image";
import Link from "next/link";

import { routes } from "../../../lib/navigation";
import styles from "./HomePage.module.css";

const entryPaths = [
  ["Understand Your Peace", "Take the Peace Assessment", "See how you seek, lose, protect, and restore peace and understand what pressure may bring out in you.", "Begin the Assessment", routes.peaceAssessment],
  ["Practice With Others", "Join a Circle", "Practice reflection, conversation, and peace alongside people committed to growing in how they live and relate.", "Explore the Circle", routes.join],
  ["Build a Healthier Culture", "PeaceWorks for Organizations", "Strengthen trust, communication, repair, and the relational habits that shape the culture people experience at work.", "For Organizations", routes.organizations],
] as const;

const pressureSignals = [
  "Leadership feels heavier than it used to.",
  "Good people are spending too much energy managing tension.",
  "Teams can solve the problem but struggle with what happens between them.",
  "Everyone wants a healthy culture. Fewer organizations know how to practice one.",
] as const;

const practices = [
  "Carry pressure without passing it on.",
  "Address tension before it becomes distance.",
  "Listen without immediately fixing or controlling.",
  "Tell the truth while protecting dignity.",
] as const;

const assessmentDimensions = [
  ["Peace Anchors", "What helps you feel grounded, secure, and at peace."],
  ["Pressure Response", "How you tend to react when peace feels threatened."],
  ["Processing Style", "How you make sense of tension within yourself or with others."],
  ["Relational Impact", "What your patterns may feel like to the people around you."],
] as const;

const circleRhythm = ["Question", "Reflect", "Gather", "Practice"] as const;

const cultureCapabilities = [
  ["Organizational Listening", "Hear what people are actually experiencing."],
  ["Relational Operating System", "Create shared language and practices for relational health."],
  ["Cultural Peace Index", "Notice where trust, communication, and relational health are strengthening or breaking down."],
  ["Listening Lab", "Practice the skills that help people hear and respond differently."],
] as const;

function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return <div className={`${styles.eyebrow} ${light ? styles.eyebrowLight : ""}`}>{children}</div>;
}

export default function HomePage() {
  return (
    <div className={styles.homePage}>
      <section className={styles.hero}>
        <div className={`${styles.container} ${styles.heroGrid}`}>
          <div className={styles.heroCopy}>
            <Eyebrow>PeaceWorks • Relational Operating System</Eyebrow>
            <h1>Make peace practical.</h1>
            <strong>For people. For relationships. For the cultures they create.</strong>
            <p>PeaceWorks helps people understand what steals their peace, practice better responses, and build healthier relationships and organizational cultures that hold under pressure.</p>
            <p className={styles.heroNote}>Because the way people carry pressure eventually becomes the way a culture feels.</p>
            <div className={styles.buttonRow}><Link className={`${styles.button} ${styles.buttonDark}`} href={routes.howItWorks}>See How PeaceWorks Works</Link><Link className={`${styles.button} ${styles.buttonLight}`} href={routes.peaceAssessment}>Take the Peace Assessment</Link></div>
          </div>
          <div className={styles.heroVisual} aria-hidden="true"><div className={styles.heroGlow} /><div className={styles.orbits}><div className={`${styles.orbit} ${styles.orbitOuter}`} /><div className={`${styles.orbit} ${styles.orbitMiddle}`} /><div className={`${styles.orbit} ${styles.orbitInner}`} /><div className={styles.logoWrap}><Image src="/images/home/peaceworks-circle.svg" alt="" width={420} height={420} priority /></div></div></div>
        </div>
      </section>

      <section className={styles.entrySection} aria-label="Ways to begin">
        <div className={`${styles.container} ${styles.entryGrid}`}>{entryPaths.map(([label, title, copy, linkText, href], index) => <Link className={styles.entryCard} href={href} key={title}><span className={styles.entryNumber}>{String(index + 1).padStart(2, "0")}</span><small>{label}</small><h2>{title}</h2><p>{copy}</p><strong>{linkText}</strong></Link>)}</div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <header className={styles.splitIntro}><div><Eyebrow>The Problem</Eyebrow><h2>Every organization has two operating systems.</h2></div><p>One drives performance. The other shapes relationships. When the relational system is weak, pressure spreads faster, trust erodes, communication gets harder, and leadership carries more weight.</p></header>
          <div className={styles.signalGrid}>{pressureSignals.map((signal, index) => <blockquote key={signal}><span>{String(index + 1).padStart(2, "0")}</span><p>{signal}</p></blockquote>)}</div>
          <div className={styles.problemClose}><strong>The result is relational drag.</strong><p>It rarely appears as a line item. People feel it in every room.</p></div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={`${styles.container} ${styles.ideaPanel}`}>
          <Eyebrow>The PeaceWorks Idea</Eyebrow><h2>Build a Relational Operating System.</h2><p className={styles.ideaCopy}>Organizations already have systems for strategy, finance, operations, and execution. PeaceWorks helps build the relational practices that shape how people listen, respond, repair, and restore trust when pressure rises.</p>
          <ol className={styles.practiceList}>{practices.map((practice, index) => <li key={practice}><span>{String(index + 1).padStart(2, "0")}</span>{practice}</li>)}</ol>
          <div className={styles.ideaClose}><strong>Healthy cultures are not built by accident. They are practiced.</strong><Link className={`${styles.button} ${styles.buttonLight}`} href={routes.howItWorks}>See How PeaceWorks Works</Link></div>
        </div>
      </section>

      <section className={styles.compactSection}>
        <div className={styles.container}>
          <header className={styles.sectionIntro}><Eyebrow>From Person to Culture</Eyebrow><h2>Peace begins within people. Culture is formed between them.</h2><p>What happens inside a person affects how they enter a conversation. Conversations shape relationships. Relationships repeated over time shape teams, and teams shape culture.</p></header>
          <ol className={styles.scaleList}>{["Person", "Relationship", "Team", "Culture"].map((item, index) => <li key={item}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item}</strong></li>)}</ol>
          <p className={styles.scaleClose}>PeaceWorks works across that whole movement.</p>
        </div>
      </section>

      <section className={styles.section}>
        <div className={`${styles.container} ${styles.editorialPanel}`}>
          <div className={styles.editorialCopy}><Eyebrow>The Peace Assessment</Eyebrow><h2>See what happens to your peace when pressure rises.</h2><p>The Peace Assessment helps you recognize the patterns shaping how you seek, lose, protect, and restore peace. Your results give you a personalized Peace Profile and practical language for understanding how those patterns affect your relationships.</p><Link className={`${styles.button} ${styles.buttonDark}`} href={routes.peaceAssessment}>Take the Peace Assessment</Link></div>
          <dl className={styles.detailList}>{assessmentDimensions.map(([title, copy], index) => <div key={title}><span>{String(index + 1).padStart(2, "0")}</span><dt>{title}</dt><dd>{copy}</dd></div>)}</dl>
        </div>
      </section>

      <section className={styles.section}>
        <div className={`${styles.container} ${styles.circleSection}`}>
          <div className={styles.circleCopy}><Eyebrow>The PeaceWorks Circle</Eyebrow><h2>Practice peace with people who are practicing it too.</h2><p>A PeaceWorks Circle is a small, trusted community built around reflection, honest conversation, and practical application. The work begins within each person and becomes something the group learns to practice together.</p><strong>Small enough to be known. Structured enough to go somewhere. Honest enough to matter.</strong><Link className={`${styles.button} ${styles.buttonDark}`} href={routes.join}>Explore the Circle Experience</Link></div>
          <ol className={styles.rhythmList}>{circleRhythm.map((item, index) => <li key={item}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item}</strong></li>)}</ol>
        </div>
      </section>

      <section className={styles.section}>
        <div className={`${styles.container} ${styles.culturePanel}`}>
          <div className={styles.cultureIntro}><Eyebrow light>Culture</Eyebrow><h2>Culture is relational before it is operational.</h2><p>Strategies, systems, and values matter. But people experience culture in the moments between them: how leaders carry pressure, how teams listen, how disagreement is handled, how truth is spoken, and how trust is repaired.</p></div>
          <blockquote>Healthy culture is not simply what an organization says it values. It is what people experience in relationship with one another.</blockquote>
          <div className={styles.capabilityGrid}>{cultureCapabilities.map(([title, copy], index) => <article key={title}><span>{String(index + 1).padStart(2, "0")}</span><h3>{title}</h3><p>{copy}</p></article>)}</div>
          <Link className={`${styles.button} ${styles.buttonLight} ${styles.cultureButton}`} href={routes.organizations}>Explore PeaceWorks for Organizations</Link>
        </div>
      </section>

      <section className={styles.section}>
        <div className={`${styles.container} ${styles.businessPanel}`}><div><Eyebrow>The Business Case</Eyebrow><h2>Healthy cultures are good for business.</h2><p>Relational friction consumes time, attention, trust, and leadership energy. Over time it can affect communication, retention, execution, decision making, and the ability of people to do their best work together.</p></div><aside><strong>PeaceWorks helps leaders make that hidden cost easier to see.</strong><Link className={`${styles.button} ${styles.buttonLight}`} href={routes.roiCalculator}>Explore the ROI Calculator</Link></aside></div>
      </section>

      <section className={styles.finalSection}>
        <div className={`${styles.container} ${styles.finalPanel}`}><Eyebrow light>The Invitation</Eyebrow><h2>What changes when peace becomes something your people know how to practice?</h2><p>Begin with yourself, practice with others, or explore what stronger relational health could make possible for your organization.</p><div className={styles.finalLinks}><Link href={routes.peaceAssessment}><span>01</span>Take the Peace Assessment</Link><Link href={routes.join}><span>02</span>Join a Circle</Link><Link href={routes.organizations}><span>03</span>For Organizations</Link></div></div>
      </section>
    </div>
  );
}
