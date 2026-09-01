import Image from "next/image";
import Link from "next/link";

import { routes } from "../../../lib/navigation";
import PublicPageIntro from "../shared/PublicPageIntro";
import styles from "./AboutPage.module.css";
import ContactForm from "./ContactForm";

const commonQuestions = [
  {
    question: "Could this help our leadership team?",
    answer:
      "Especially if tension, trust, communication, or recurring relational strain are affecting how the organization works together.",
  },
  {
    question: "Is a Circle the right fit?",
    answer:
      "If you are looking for a place to reflect, practice peace with others, and carry that work into your leadership and relationships, a Circle may be a good place to begin.",
  },
  {
    question: "How does this connect to our business reality?",
    answer:
      "PeaceWorks takes seriously the practical pressures leaders carry and the ways relational strain can affect communication, decision making, trust, and the work itself.",
  },
];

export default function AboutPage() {
  return (
    <div className={styles.aboutPage}>
      <main>
        <section className={styles.hero}>
          <div className={`${styles.container} ${styles.heroGrid}`}>
            <PublicPageIntro
              eyebrow="Contact PeaceWorks"
              title="Questions are welcome."
              actions={
                <a className={`${styles.btn} ${styles.btnPrimary}`} href="#contact-form">
                  Contact PeaceWorks
                </a>
              }
            >
              <p>
                If you have questions about PeaceWorks, the Circle experience,
                the Relational ROI work, or whether PeaceWorks may be a fit for your organization, the
                simplest next step is to send the team a message.
              </p>
            </PublicPageIntro>

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
            <div className={styles.questionsShell}>
              <div className={styles.splitHead}>
                <div>
                  <div className={styles.eyebrow}>Common Starting Questions</div>
                  <h2>Questions people often bring first.</h2>
                </div>
                <p>
                  These are some of the most common starting points for a first
                  conversation with PeaceWorks.
                </p>
              </div>

              <div className={styles.questionGrid}>
                {commonQuestions.map((item) => (
                  <article className={styles.questionCard} key={item.question}>
                    <strong>{item.question}</strong>
                    <p>{item.answer}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className={`${styles.section} ${styles.sectionTight}`}>
          <div className={styles.container}>
            <div className={styles.contactShell}>
              <div className={styles.splitHead}>
                <div>
                  <div className={styles.eyebrow}>Get In Touch</div>
                  <h2>Send the team a message.</h2>
                </div>
                <p>Your message will go directly to the PeaceWorks team. We will read it together and the right person will respond.</p>
              </div>
              <ContactForm />
            </div>
          </div>
        </section>

        <section className={styles.afterword}>
          <div className={`${styles.container} ${styles.afterwordInner}`}>
            <p>
              Ready to practice peace with others?{" "}
              <Link href={routes.join}>Join a Circle</Link>
            </p>
            <p>
              Want to understand the business case?{" "}
              <Link href={routes.roiCalculator}>Explore the Relational ROI Calculator</Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
