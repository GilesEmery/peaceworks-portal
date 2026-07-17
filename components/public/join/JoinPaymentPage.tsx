import Image from "next/image";
import Link from "next/link";

import { routes } from "../../../lib/navigation";
import styles from "./JoinPage.module.css";

const paymentDetails = {
  "credit-card": {
    eyebrow: "Join by Credit Card",
    intro:
      "You are completing the PeaceWorks cohort signup using a credit card. Fill out the form below to submit your information and begin your membership.",
    alternative:
      "If you meant to register by ACH or bank account instead, return to the Join page and choose that option there.",
    heading: "Credit card signup",
    formUrl: "https://pci.jotform.com/form/260572718904058",
    formTitle: "PeaceWorks credit card signup form",
  },
  ach: {
    eyebrow: "Join by ACH / Bank Account",
    intro:
      "You are completing the PeaceWorks cohort signup using ACH or bank account payment. Fill out the form below to submit your information and begin your membership.",
    alternative:
      "If you meant to register by credit card instead, return to the Join page and choose that option there.",
    heading: "ACH / bank account signup",
    formUrl: "https://form.jotform.com/260676730172155",
    formTitle: "PeaceWorks ACH signup form",
  },
} as const;

type JoinPaymentPageProps = {
  method: keyof typeof paymentDetails;
};

export default function JoinPaymentPage({ method }: JoinPaymentPageProps) {
  const details = paymentDetails[method];

  return (
    <div className={`${styles.joinPage} ${styles.paymentPage}`}>
      <section className={styles.paymentHero}>
        <div className={`${styles.container} ${styles.heroGrid}`}>
          <div className={styles.heroCopy}>
            <div className={styles.eyebrow}>{details.eyebrow}</div>
            <h1 className={`${styles.display} ${styles.paymentHeroTitle}`}>
              Complete your PeaceWorks cohort registration.
            </h1>
            <p>{details.intro}</p>
            <div className={styles.btnRow}>
              <Link className={`${styles.btn} ${styles.btnSecondary}`} href={routes.join}>
                Back to Join Page
              </Link>
            </div>
            <aside className={styles.heroNote}>
              <strong>Need a different payment method?</strong>
              <span>{details.alternative}</span>
            </aside>
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

      <section className={`${styles.section} ${styles.formSection}`}>
        <div className={styles.container}>
          <div className={styles.shell}>
            <div className={styles.splitHead}>
              <div>
                <div className={styles.eyebrow}>Registration Form</div>
                <h2>{details.heading}</h2>
              </div>
              <p>
                Complete the secure form below to register for the PeaceWorks
                cohort. Your spot will be tied to the information you submit
                here.
              </p>
            </div>
            <div className={styles.embedWrap}>
              <iframe
                src={details.formUrl}
                title={details.formTitle}
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
