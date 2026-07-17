import Image from "next/image";
import Link from "next/link";

import { routes } from "../../../lib/navigation";
import styles from "./JoinPage.module.css";

const benefits = [
  {
    title: "Monthly roundtables",
    description:
      "Join other owners and leaders navigating similar pressures and learn in a high-trust environment.",
  },
  {
    title: "Practical tools",
    description:
      "Use frameworks and rhythms that can be applied immediately inside your company.",
  },
  {
    title: "Guided 1 on 1 learning",
    description:
      "Strengthen trust, navigate conflict, and grow in calm leadership with focused support.",
  },
];

export default function JoinPage() {
  return (
    <div className={styles.joinPage}>
      <section className={styles.hero}>
        <div className={`${styles.container} ${styles.heroGrid}`}>
          <div className={styles.heroCopy}>
            <div className={styles.eyebrow}>Join PeaceWorks</div>
            <h1 className={`${styles.display} ${styles.heroTitle}`}>
              A cohort for leaders who want healthier, more resilient cultures.
            </h1>
            <p>
              The PeaceWorks cohort experience is for business leaders who want
              to build healthier, more resilient cultures. Through monthly
              roundtables, practical tools, and guided 1 on 1 learning,
              PeaceWorks helps leaders strengthen trust, navigate conflict, and
              lead with greater calm under pressure. It is designed for those
              who believe peace is not passive—it is something we practice
              together.
            </p>
            <div className={styles.btnRow}>
              <a className={`${styles.btn} ${styles.btnPrimary}`} href="#payment-options">
                Choose a Payment Method
              </a>
            </div>
          </div>

          <div className={styles.heroVisual} aria-hidden="true">
            <div className={styles.heroGlow} />
            <div className={styles.orbits}>
              <div className={`${styles.orbit} ${styles.orbit1}`} />
              <div className={`${styles.orbit} ${styles.orbit2}`} />
              <div className={`${styles.orbit} ${styles.orbit3}`} />
              <div className={styles.logoWrap}>
                <Image
                  src="/images/home/peaceworks-circle.svg"
                  alt=""
                  width={420}
                  height={420}
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.shell}>
            <div className={styles.splitHead}>
              <div>
                <div className={styles.eyebrow}>The Cohort Experience</div>
                <h2>Designed for leaders who want to practice peace together.</h2>
              </div>
              <p>
                PeaceWorks is not simply a one-time workshop or a leadership
                seminar. It is an ongoing experience for leaders who want
                practical structure, deeper relational strength, and steadier
                leadership under pressure.
              </p>
            </div>
            <div className={styles.benefitsGrid}>
              {benefits.map((benefit) => (
                <article className={styles.card} key={benefit.title}>
                  <h3>{benefit.title}</h3>
                  <p>{benefit.description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.paymentSection}`} id="payment-options">
        <div className={styles.container}>
          <div className={styles.shell}>
            <div className={styles.splitHead}>
              <div>
                <div className={styles.eyebrow}>Choose Your Payment Method</div>
                <h2>The PeaceWorks Cohort is offered at $500 per month.</h2>
              </div>
              <p>
                Please choose your preferred payment method below. Both paths
                lead to the same cohort experience and membership access.
              </p>
            </div>
            <div className={styles.price}>$500 / month</div>
            <div className={styles.paymentGrid}>
              <article className={styles.card}>
                <h3>Credit Card</h3>
                <p>
                  Choose this option if you would like to register and pay using
                  a credit card.
                </p>
                <div className={styles.btnRow}>
                  <Link className={`${styles.btn} ${styles.btnPrimary}`} href={routes.joinCreditCard}>
                    Sign Up with Credit Card
                  </Link>
                </div>
              </article>
              <article className={styles.card}>
                <h3>ACH / Bank Account</h3>
                <p>
                  Choose this option if you would prefer to register and pay
                  through ACH or bank account draft.
                </p>
                <div className={styles.btnRow}>
                  <Link className={`${styles.btn} ${styles.btnSecondary}`} href={routes.joinAch}>
                    Sign Up with ACH
                  </Link>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
