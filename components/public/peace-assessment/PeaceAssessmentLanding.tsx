import Image from "next/image";
import Link from "next/link";

import { routes } from "../../../lib/navigation";
import styles from "./PeaceAssessmentLanding.module.css";

const dimensions = [
  ["Your Peace Anchors", "What helps you feel grounded, secure, and at peace."],
  ["Your Pressure Response", "How you tend to react when peace feels threatened."],
  ["Your Processing Style", "How you make sense of tension internally or with others."],
  ["Your Relational Impact", "What your patterns may feel like to the people around you."],
] as const;

type PeaceAssessmentLandingProps = {
  isAuthenticated: boolean;
  hasResult: boolean;
  onSignIn: () => void;
  onCreateAccount: () => void;
  onStart: () => void;
  onViewResult: () => void;
};

function LandingActions({
  isAuthenticated,
  hasResult,
  onSignIn,
  onCreateAccount,
  onStart,
  onViewResult,
}: PeaceAssessmentLandingProps) {
  if (!isAuthenticated) {
    return (
      <>
        <button className={`${styles.button} ${styles.buttonDark}`} type="button" onClick={onSignIn}>Sign In to Begin</button>
        <button className={`${styles.button} ${styles.buttonLight}`} type="button" onClick={onCreateAccount}>Create an Account to Begin</button>
      </>
    );
  }

  if (hasResult) {
    return (
      <>
        <button className={`${styles.button} ${styles.buttonDark}`} type="button" onClick={onViewResult}>View Results</button>
        <button className={`${styles.button} ${styles.buttonLight}`} type="button" onClick={onStart}>Retake Assessment</button>
      </>
    );
  }

  return <button className={`${styles.button} ${styles.buttonDark}`} type="button" onClick={onStart}>Start Assessment</button>;
}

export default function PeaceAssessmentLanding(props: PeaceAssessmentLandingProps) {
  const heroAction = !props.isAuthenticated
    ? ["Begin the Peace Assessment", props.onSignIn] as const
    : props.hasResult
      ? ["View My Results", props.onViewResult] as const
      : ["Start Assessment", props.onStart] as const;

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={`${styles.container} ${styles.heroGrid}`}>
          <div className={styles.heroCopy}>
            <div className={styles.eyebrow}>The Peace Assessment</div>
            <h1>Understand what happens to your peace under pressure.</h1>
            <p>The Peace Assessment helps you recognize the patterns that shape how you seek, lose, protect, and restore peace. Your results give you language for understanding yourself and practical insight for how you relate to others.</p>
            <div className={styles.buttonRow}>
              <button className={`${styles.button} ${styles.buttonDark}`} type="button" onClick={heroAction[1]}>{heroAction[0]}</button>
              {props.isAuthenticated && props.hasResult && <button className={`${styles.button} ${styles.buttonLight}`} type="button" onClick={props.onStart}>Retake Assessment</button>}
            </div>
          </div>
          <div className={styles.heroVisual} aria-hidden="true">
            <div className={styles.heroGlow} />
            <div className={styles.orbits}>
              <div className={`${styles.orbit} ${styles.orbitOuter}`} />
              <div className={`${styles.orbit} ${styles.orbitMiddle}`} />
              <div className={`${styles.orbit} ${styles.orbitInner}`} />
              <div className={styles.logoWrap}><Image src="/images/home/peaceworks-circle.svg" alt="" width={420} height={420} priority /></div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <header className={styles.sectionIntro}><div className={styles.eyebrow}>What You&apos;ll Learn</div><h2>See the patterns beneath the pressure.</h2></header>
          <ol className={styles.dimensionList}>{dimensions.map(([title, copy], index) => <li key={title}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{title}</h3><p>{copy}</p></div></li>)}</ol>
        </div>
      </section>

      <section className={styles.section}>
        <div className={`${styles.container} ${styles.darkPanel}`}>
          <div><div className={styles.eyebrow}>More Than a Personality Type</div><h2>Not a label. A language for growth.</h2></div>
          <div className={styles.darkCopy}><p>The Peace Assessment is not designed to put you in a box. It helps you notice patterns—what you seek, how pressure changes you, and where a more peaceful response can begin.</p><strong>Awareness is useful when it leads to practice.</strong><Link href={routes.howItWorks}>See How PeaceWorks Works <span aria-hidden="true">→</span></Link></div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={`${styles.container} ${styles.profilePanel}`}>
          <div className={styles.profileCopy}><div className={styles.eyebrow}>Your Results</div><h2>A profile built around how you experience and respond to peace.</h2><p>Your answers combine into a personalized Peace Profile that brings together your peace strategy, pressure response, processing style, and relational impact.</p><p>PeaceWorks includes 12 Peace Profiles, each offering more specific language for strengths, pressure patterns, relational impact, and growth.</p></div>
          <div className={styles.profileVisual} aria-hidden="true">
            <div className={styles.profileDiagram}>
              <div className={styles.profileOrbit} />
              <div className={`${styles.profileDimension} ${styles.strategy}`}>Peace<span>Strategy</span></div>
              <div className={`${styles.profileDimension} ${styles.response}`}>Pressure<span>Response</span></div>
              <div className={`${styles.profileDimension} ${styles.processing}`}>Processing<span>Style</span></div>
              <div className={`${styles.profileDimension} ${styles.impact}`}>Relational<span>Impact</span></div>
              <strong className={styles.profileCore}><small>Your</small>Peace<br />Profile</strong>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.beginSection}>
        <div className={`${styles.container} ${styles.beginPanel}`}>
          <div><div className={styles.eyebrow}>Begin</div><h2>Ready to understand your patterns?</h2><p>The assessment gives you a starting point for noticing what shapes your peace and how you can practice it more intentionally.</p></div>
          <div className={styles.beginActions}><LandingActions {...props} /></div>
        </div>
      </section>
    </div>
  );
}
