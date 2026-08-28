import Image from "next/image";
import Link from "next/link";

import { routes } from "../../../lib/navigation";
import styles from "./HomePage.module.css";

const journey = [
  ["Understand", "See the patterns, pressures, and dynamics shaping peace."],
  ["Practice", "Build healthier responses when pressure rises."],
  ["Strengthen", "Grow trust, listening, response, repair, and relational resilience."],
  ["Notice", "Recognize what is changing in people, relationships, and culture."],
] as const;

const cultureCapabilities = [
  ["Organizational Listening", "Hear what people are actually experiencing."],
  ["Relational Operating System", "Give teams shared language and practical practices."],
  ["Cultural Peace Index", "Notice where relational health is strengthening or breaking down."],
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
            <Eyebrow>PeaceWorks</Eyebrow>
            <h1>Make peace practical.</h1>
            <strong>For people. For relationships. For the cultures they create.</strong>
            <p>PeaceWorks helps people understand what steals their peace, practice better responses, and build healthier relationships and organizational cultures that hold under pressure.</p>
            <div className={styles.buttonRow}>
              <Link className={`${styles.button} ${styles.buttonDark}`} href={routes.howItWorks}>See How PeaceWorks Works</Link>
              <Link className={`${styles.button} ${styles.buttonLight}`} href={routes.peaceAssessment}>Take the Peace Assessment</Link>
            </div>
          </div>
          <div className={styles.heroVisual} aria-hidden="true">
            <div className={styles.heroGlow} />
            <div className={styles.orbits}>
              <div className={`${styles.orbit} ${styles.orbitOuter}`}><span /></div>
              <div className={`${styles.orbit} ${styles.orbitMiddle}`}><span /></div>
              <div className={`${styles.orbit} ${styles.orbitInner}`}><span /></div>
              <div className={styles.logoWrap}><Image src="/images/home/peaceworks-circle.svg" alt="" width={420} height={420} priority /></div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <header className={styles.sectionIntro}><Eyebrow>One work. Two places it shows up.</Eyebrow><h2><span>Peace begins with people.</span><span>Culture is what happens between them.</span></h2></header>
          <div className={styles.pathGrid}>
            <article className={styles.pathPanel}><span className={styles.pathNumber}>01</span><h3>For You</h3><p>Understand your patterns. Practice peace under pressure. Strengthen the relationships you influence every day.</p><Link href={routes.peaceAssessment}>Explore Your Peace <span aria-hidden="true">→</span></Link></article>
            <article className={`${styles.pathPanel} ${styles.pathPanelSage}`}><span className={styles.pathNumber}>02</span><h3>For Your Organization</h3><p>Build the relational habits that shape trust, communication, repair, resilience, and the culture people experience at work.</p><Link href={routes.organizations}>Explore PeaceWorks for Organizations <span aria-hidden="true">→</span></Link></article>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <header className={styles.sectionIntro}><Eyebrow>The PeaceWorks Journey</Eyebrow><h2>A practical way to grow peace from the inside out.</h2></header>
          <ol className={styles.journeyList}>{journey.map(([title, copy], index) => <li key={title}><span className={styles.stepNumber}>{String(index + 1).padStart(2, "0")}</span><div><h3>{title}</h3><p>{copy}</p></div></li>)}</ol>
        </div>
      </section>

      <section className={styles.section}>
        <div className={`${styles.container} ${styles.culturePanel}`}>
          <div className={styles.cultureIntro}><Eyebrow light>Culture</Eyebrow><h2>Culture is relational before it is operational.</h2><p>Strategies, systems, and values matter. But culture is experienced in the moments between people: how they listen, respond under pressure, handle disagreement, repair what breaks, and restore trust.</p></div>
          <div className={styles.cultureStatement}><strong>Healthy culture is not simply what an organization says it values. It is what people experience in relationship with one another.</strong><p>PeaceWorks helps organizations listen more clearly, identify relational friction, build shared practices, and create healthier ways of working together.</p></div>
          <div className={styles.capabilityList}>{cultureCapabilities.map(([title, copy], index) => <article key={title}><span>{String(index + 1).padStart(2, "0")}</span><h3>{title}</h3><p>{copy}</p></article>)}</div>
          <Link className={styles.lightLink} href={routes.organizations}>For Organizations <span aria-hidden="true">→</span></Link>
        </div>
      </section>

      <section className={styles.section}>
        <div className={`${styles.container} ${styles.entryPanel}`}>
          <div><Eyebrow>Begin with understanding</Eyebrow><h2>See what shapes your peace.</h2><p>The Peace Assessment helps you recognize how you seek, lose, protect, and restore peace and gives you a personalized Peace Profile for understanding your patterns under pressure.</p><Link className={`${styles.button} ${styles.buttonDark}`} href={routes.peaceAssessment}>Take the Peace Assessment</Link></div>
          <div className={styles.entryVisual} aria-hidden="true"><span>Peace strategy</span><span>Pressure response</span><strong>Peace<br />Profile</strong><span>Processing style</span><span>Relational impact</span></div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={`${styles.container} ${styles.circlePanel}`}>
          <div className={styles.circleVisual} aria-hidden="true"><div className={styles.circleRing}><div><span /></div></div></div>
          <div><Eyebrow>Practice with others</Eyebrow><h2>Join a Circle.</h2><p>A PeaceWorks Circle is a small, trusted community where reflection, conversation, and practice help peace move from an idea into the way you actually live and relate.</p><Link className={`${styles.button} ${styles.buttonDark}`} href={routes.join}>Explore the Circle Experience</Link></div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <header className={styles.sectionIntro}><Eyebrow>For organizations</Eyebrow><h2>Relational health has a business impact.</h2><p>Relational friction affects trust, speed, retention, decision making, communication, and the energy people carry into their work. PeaceWorks helps leaders understand that cost and build healthier ways of operating.</p></header>
          <div className={styles.impactGrid}>
            <article><span>Organizational Listening</span><h3>Listen before you prescribe.</h3><p>Begin by understanding where relational drag is showing up in the organization and what people are experiencing beneath the surface.</p><Link href={routes.organizations}>Explore Organizational Work <span aria-hidden="true">→</span></Link></article>
            <article><span>Relational ROI</span><h3>Make the business case visible.</h3><p>Use the PeaceWorks ROI Calculator to explore how relational friction may be affecting time, energy, and performance.</p><Link href={routes.roiCalculator}>Explore the ROI Calculator <span aria-hidden="true">→</span></Link></article>
          </div>
        </div>
      </section>

      <section className={styles.finalSection}>
        <div className={`${styles.container} ${styles.finalPanel}`}>
          <Eyebrow light>PeaceWorks</Eyebrow><h2>Build peace where it matters most.</h2><p>Begin with yourself, bring the work into your relationships, or explore what a healthier relational culture could make possible for your organization.</p>
          <div className={styles.buttonRow}><Link className={`${styles.button} ${styles.buttonCream}`} href={routes.peaceAssessment}>Take the Peace Assessment</Link><Link className={`${styles.button} ${styles.buttonOutline}`} href={routes.organizations}>For Organizations</Link></div>
        </div>
      </section>
    </div>
  );
}
