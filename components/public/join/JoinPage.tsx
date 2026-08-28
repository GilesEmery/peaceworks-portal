import Image from "next/image";
import Link from "next/link";

import { routes } from "../../../lib/navigation";
import styles from "./JoinPage.module.css";

const journey = [
  ["Understand Yourself", "Recognize the patterns and pressures that shape your peace."],
  ["Practice Peace", "Learn practical ways to respond differently under pressure."],
  ["Strengthen Relationships", "Practice listening, response, repair, and restoration with others."],
  ["Notice Growth", "See what is changing in the way you live, lead, and relate."],
] as const;

const monthlyRhythm = [
  ["Question", "A meaningful question gives the month its focus."],
  ["Reflect", "Notice what it reveals in your own life."],
  ["Gather", "Listen, share, and learn with your Circle."],
  ["Practice", "Carry what you are learning into everyday relationships."],
] as const;

const included = [
  "Peace Assessment & Profile",
  "Monthly Question",
  "Facilitated Circle gatherings",
  "PeaceWorks tools & resources",
  "Member portal / app",
] as const;

const commitments = [
  "Show up.",
  "Protect confidentiality.",
  "Listen with curiosity.",
  "Speak honestly.",
  "Practice between gatherings.",
] as const;

const nextSteps = [
  ["Join", "Choose your payment method and complete registration."],
  ["Complete Your Peace Assessment", "Begin building language for your patterns and Peace Profile."],
  ["Connect with Your Circle", "Receive the information you need for your Circle."],
  ["Begin", "Prepare for your first gathering and enter the monthly rhythm."],
] as const;

function SectionIntro({ eyebrow, title, copy }: { eyebrow: string; title: string; copy?: string }) {
  return (
    <header className={styles.sectionIntro}>
      <div className={styles.eyebrow}>{eyebrow}</div>
      <h2>{title}</h2>
      {copy && <p>{copy}</p>}
    </header>
  );
}

export default function JoinPage() {
  return (
    <div className={styles.joinPage}>
      <section className={styles.hero}>
        <div className={`${styles.container} ${styles.heroGrid}`}>
          <div className={styles.heroCopy}>
            <div className={styles.eyebrow}>Join a PeaceWorks Circle</div>
            <h1><span>Join a Circle.</span><span>Practice peace together.</span></h1>
            <p>A PeaceWorks Circle is a small, trusted community where reflection, conversation, and practice help you build peace within yourself and carry it into the relationships and places that matter most.</p>
            <div className={styles.buttonRow}>
              <a className={`${styles.button} ${styles.buttonDark}`} href="#circle-experience">Explore the Circle</a>
              <a className={`${styles.button} ${styles.buttonLight}`} href="#investment">Join a Circle</a>
            </div>
          </div>
          <div className={styles.heroVisual} aria-hidden="true">
            <div className={styles.heroGlow} />
            <div className={styles.orbits}>
              <div className={`${styles.orbit} ${styles.orbit1}`} />
              <div className={`${styles.orbit} ${styles.orbit2}`} />
              <div className={`${styles.orbit} ${styles.orbit3}`} />
              <div className={styles.logoWrap}><Image src="/images/home/peaceworks-circle.svg" alt="" width={420} height={420} priority /></div>
            </div>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.anchorTarget}`} id="circle-experience">
        <div className={`${styles.container} ${styles.circleIntro}`}>
          <div className={styles.eyebrow}>The Circle Experience</div>
          <h2><span>Small enough to be known.</span><span>Structured enough to go somewhere.</span><span>Honest enough to matter.</span></h2>
          <p>A Circle is a consistent place to reflect honestly, listen well, and practice responding differently with people who are committed to doing the same.</p>
          <strong>Not another place to perform. A place to practice.</strong>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <SectionIntro eyebrow="The PeaceWorks Journey" title="A practical path for peace and growth." />
          <ol className={styles.journeyList}>{journey.map(([title, copy], index) => <li key={title}><span className={styles.stepNumber}>{String(index + 1).padStart(2, "0")}</span><div><h3>{title}</h3><p>{copy}</p></div></li>)}</ol>
          <div className={styles.systemNote}><p>PeaceWorks helps move peace from something formed within us to something we practice with others.</p><Link href={routes.howItWorks}>See how PeaceWorks works <span aria-hidden="true">→</span></Link></div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={`${styles.container} ${styles.darkPanel}`}>
          <header className={styles.sectionIntroLight}><div className={styles.eyebrow}>The Monthly Rhythm</div><h2>A question becomes a practice.</h2></header>
          <ol className={styles.rhythmList}>{monthlyRhythm.map(([title, copy], index) => <li key={title}><span className={styles.stepNumber}>{String(index + 1).padStart(2, "0")}</span><div><h3>{title}</h3><p>{copy}</p></div></li>)}</ol>
        </div>
      </section>

      <section className={styles.section}>
        <div className={`${styles.container} ${styles.experiencePanel}`}>
          <SectionIntro eyebrow="The Circle Commitment" title="A simple rhythm. A meaningful commitment." />
          <div className={styles.experienceGrid}>
            <div><h3>What&apos;s included</h3><ul>{included.map((item) => <li key={item}>{item}</li>)}</ul><p>Everything you need to reflect, gather, practice, and stay connected.</p></div>
            <div><h3>What makes it work</h3><ul>{commitments.map((item) => <li key={item}>{item}</li>)}</ul><p>A Circle becomes meaningful because its members participate in it together.</p></div>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.anchorTarget}`} id="investment">
        <div className={`${styles.container} ${styles.investmentPanel}`}>
          <div className={styles.investmentHead}><div><div className={styles.eyebrow}>Investment</div><h2>Ready to join a Circle?</h2></div><div className={styles.price}><strong>$500</strong><span>/ month</span></div></div>
          <p className={styles.investmentCopy}>Your PeaceWorks Circle membership includes the full Circle experience and member access.</p>
          <div className={styles.paymentGrid}>
            <article><span className={styles.paymentLabel}>Credit Card</span><h3>Pay by credit card.</h3><Link className={`${styles.button} ${styles.buttonDark}`} href={routes.joinCreditCard}>Join with Credit Card</Link></article>
            <article><span className={styles.paymentLabel}>ACH / Bank Account</span><h3>Pay from a bank account.</h3><Link className={`${styles.button} ${styles.buttonSage}`} href={routes.joinAch}>Join with ACH</Link></article>
          </div>
        </div>
      </section>

      <section className={styles.finalMovement}>
        <div className={styles.container}>
          <SectionIntro eyebrow="What Happens Next" title="A clear beginning." />
          <ol className={styles.nextSteps}>{nextSteps.map(([title, copy], index) => <li key={title}><span className={styles.stepNumber}>{String(index + 1).padStart(2, "0")}</span><div><h3>{title}</h3><p>{copy}</p></div></li>)}</ol>
          <div className={styles.closingPanel}><div className={styles.eyebrow}>Practice Together</div><h2>Peace becomes practical when we practice it together.</h2><p>A Circle gives you a place to begin noticing, practicing, and participating in peace with others.</p><div className={styles.buttonRow}><a className={`${styles.button} ${styles.buttonCream}`} href="#investment">Join a Circle</a><Link className={`${styles.button} ${styles.buttonOutline}`} href={routes.howItWorks}>See How PeaceWorks Works</Link></div></div>
        </div>
      </section>
    </div>
  );
}
