import Image from "next/image";
import Link from "next/link";

import { routes } from "../../../lib/navigation";
import styles from "./HomePage.module.css";

const pathways = [
  {
    number: "01",
    title: "Join a Circle",
    description:
      "Practice calm, honest leadership alongside a small group of leaders committed to building healthier cultures.",
    linkText: "Explore the Circle",
    href: routes.join,
  },
  {
    number: "02",
    title: "Take the Peace Assessment",
    description:
      "Discover how you seek, lose, protect, and restore peace—and what others may experience from you when pressure rises.",
    linkText: "Begin the assessment",
    href: routes.peaceAssessment,
  },
  {
    number: "03",
    title: "Calculate Relational ROI",
    description:
      "Make the hidden cost of relational drag visible and explore what greater trust, clarity, and retention could mean for your organization.",
    linkText: "Open the calculator",
    href: routes.roiCalculator,
  },
];

const pressureSignals = [
  "“Leadership feels heavier than it used to.”",
  "“High performers are competing instead of collaborating.”",
  "“We’re good at solving problems. Not great at absorbing stress.”",
  "“Everyone’s looking to leadership for calm. Leadership is asking GPT how.”",
  "“We have managers. We’re missing peacemakers.”",
  "“The hardest part of leadership isn’t strategy, it’s carrying people.”",
];

const ideaPoints = [
  ["Handle pressure", "without transmitting anxiety into the system."],
  ["Repair conflict", "before it settles into distrust and avoidance."],
  ["Listen well", "without fixing, controlling, or shutting down."],
  ["Lead calmly", "with maturity, clarity, and steadiness."],
  ["Protect dignity", "while addressing truth directly."],
];

const assessmentPoints = [
  [
    "Your peace anchors",
    "See the needs and strategies that most often help you feel grounded and secure.",
  ],
  [
    "Your pressure response",
    "Recognize whether you tend to please, prove, push, or pull away when peace feels threatened.",
  ],
  [
    "Your processing style",
    "Understand how internal or external processing shapes your response to tension.",
  ],
  [
    "Your relational impact",
    "Explore the strengths you bring, the challenges others may experience, and practices for growth.",
  ],
];

const featureCards = [
  {
    title: "Leadership Cohorts",
    description:
      "Monthly facilitated roundtables with other owners and leaders navigating similar pressures.",
    items: [
      "Think clearly with peers",
      "Learn from shared leadership pressures",
      "Build the discipline of calm leadership",
    ],
  },
  {
    title: "Listening Labs",
    description:
      "Structured sessions that teach leaders and teams to surface tension early and handle disagreement constructively.",
    items: [
      "Listen without fixing",
      "Handle disagreement constructively",
      "Rebuild trust after conflict",
    ],
  },
  {
    title: "Resource Library",
    description:
      "A growing library of tools built for real implementation inside your company.",
    items: [
      "Leadership reflection guides",
      "Conflict repair frameworks",
      "Listening scripts and team exercises",
    ],
  },
  {
    title: "The Peace Index",
    description:
      "Simple tools that help leaders track relational health over time.",
    items: [
      "Trust and meeting honesty",
      "Conflict repair speed",
      "Psychological safety and calm under pressure",
    ],
  },
];

const foundersItems = [
  ["Monthly leadership cohorts", "Roundtables for owners and senior leaders."],
  ["Listening labs", "Practical training in how leaders hear and respond."],
  ["Resource library", "Tools and frameworks for immediate use."],
  ["Peace Index assessments", "Measurement that makes relational health visible."],
];

export default function HomePage() {
  return (
    <div className={styles.homePage}>
      <section className={styles.hero}>
        <div className={`${styles.container} ${styles.heroGrid}`}>
          <div className={`${styles.heroCopy} ${styles.reveal}`}>
            <div className={styles.eyebrow}>
              PeaceWorks • Relational Operating System
            </div>
            <h1 className={`${styles.display} ${styles.heroTitle}`}>
              Peace isn’t passive.
              <br />
              It’s practiced.
            </h1>
            <p className={styles.heroSub}>
              Most companies invest in strategy and execution. Very few invest
              in the relational operating system that holds everything together.
              PeaceWorks equips business leaders to build cultures where trust
              holds under pressure.
            </p>
            <p className={styles.heroKicker}>
              For leaders who want calm, honest, durable cultures.
            </p>
          </div>

          <div className={`${styles.heroVisual} ${styles.reveal}`} aria-hidden="true">
            <div className={styles.heroGlow} />
            <div className={styles.orbits}>
              <div className={`${styles.orbit} ${styles.orbit1}`} />
              <div className={`${styles.orbit} ${styles.orbit2}`} />
              <div className={`${styles.orbit} ${styles.orbit3}`} />

              <div className={`${styles.floatingCard} ${styles.float1}`}>
                <strong>Calm leadership</strong>
                <span>Lead through pressure without transmitting panic.</span>
              </div>
              <div className={`${styles.floatingCard} ${styles.float2}`}>
                <strong>Conflict repair</strong>
                <span>Address tension before it hardens.</span>
              </div>
              <div className={`${styles.floatingCard} ${styles.float3}`}>
                <strong>Relational strength</strong>
                <span>Build cultures where trust holds.</span>
              </div>

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

          <div className={`${styles.heroPathways} ${styles.reveal}`} aria-label="Explore PeaceWorks">
            {pathways.map((pathway) => (
              <Link className={styles.heroPathway} href={pathway.href} key={pathway.number}>
                <span className={styles.pathwayNumber}>{pathway.number}</span>
                <h2>{pathway.title}</h2>
                <p>{pathway.description}</p>
                <span className={styles.pathwayLink}>{pathway.linkText}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className={styles.marqueeWrap}>
        <div className={styles.marquee}>
          {[0, 1, 2].map((item) => (
            <span key={item}>
              Trust under pressure <i>•</i> Calm leadership <i>•</i> Meeting
              honesty <i>•</i> Conflict repair <i>•</i> Dignity at work <i>•</i>
            </span>
          ))}
        </div>
      </div>

      <section className={styles.section}>
        <div className={styles.container}>
          <div className={`${styles.splitHead} ${styles.reveal}`}>
            <div>
              <div className={styles.eyebrow}>The Problem</div>
              <h2>Every organization has two operating systems.</h2>
            </div>
            <p>
              One drives performance. The other drives relationships. When the
              relational system is weak, performance suffers.
            </p>
          </div>

          <div className={styles.problemGrid}>
            {pressureSignals.map((signal) => (
              <div className={`${styles.signal} ${styles.reveal}`} key={signal}>
                <p>{signal}</p>
              </div>
            ))}
          </div>

          <div className={`${styles.problemClose} ${styles.reveal}`}>
            <strong>The result is relational drag.</strong>
            <p>Not visible on the balance sheet. But felt in every room.</p>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <div className={`${styles.ideaShell} ${styles.reveal}`}>
            <div className={styles.eyebrow}>The PeaceWorks Idea</div>
            <h2 className={styles.ideaTitle}>
              Install a Relational Operating System.
            </h2>
            <p className={styles.lede}>
              PeaceWorks helps leaders install a Relational Operating System
              inside their organization. Not another leadership seminar, but a
              rhythm of practices that strengthen how people work together when
              pressure rises.
            </p>

            <div className={styles.ideaGrid}>
              <div className={styles.ideaPoints}>
                {ideaPoints.map(([title, description]) => (
                  <div className={styles.ideaPoint} key={title}>
                    <strong>{title}</strong>
                    <span>{description}</span>
                  </div>
                ))}
              </div>

              <div className={styles.ideaQuote}>
                <strong>Strong cultures are not built by accident.</strong>
                <p>
                  They are practiced. PeaceWorks strengthens the relational
                  habits behind trust, honesty, accountability, and calm
                  leadership.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section} id="peace-assessment">
        <div className={styles.container}>
          <div className={`${styles.assessmentShell} ${styles.reveal}`}>
            <div className={styles.assessmentGrid}>
              <div>
                <div className={styles.eyebrow}>The Peace Assessment</div>
                <h2>Discover what happens to your peace when pressure rises.</h2>
                <p className={styles.assessmentIntro}>
                  PeaceWorks does not simply ask whether you are peaceful. It
                  helps you understand the deeper patterns shaping how you pursue
                  security, significance, contribution, and connection—especially
                  when tension, uncertainty, or conflict enters the room.
                </p>

                <div className={styles.assessmentPoints}>
                  {assessmentPoints.map(([title, description]) => (
                    <div className={styles.assessmentPoint} key={title}>
                      <strong>{title}</strong>
                      <span>{description}</span>
                    </div>
                  ))}
                </div>
              </div>

              <aside className={styles.assessmentCard}>
                <span className={styles.tag}>A personalized peace profile</span>
                <h3>More than a score. A language for growth.</h3>
                <p>
                  Your results connect four dimensions into one of 12 unique
                  profile types, giving you a practical picture of how peace
                  moves through your life, leadership, and relationships.
                </p>
                <ul>
                  <li>A memorable profile that reflects your relational strengths</li>
                  <li>Insight into how you seek, lose, protect, and restore peace</li>
                  <li>Leadership and community reflections</li>
                  <li>Personal and relational growth practices</li>
                </ul>
                <Link className={`${styles.btn} ${styles.btnSecondary}`} href={routes.peaceAssessment}>
                  Take the Peace Assessment
                </Link>
              </aside>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <div className={`${styles.splitHead} ${styles.reveal}`}>
            <div>
              <div className={styles.eyebrow}>What You Receive</div>
              <h2>A structured rhythm for relational maturity.</h2>
            </div>
            <p>
              When you join PeaceWorks, your leadership team enters a practical,
              repeatable rhythm designed to strengthen how leaders listen,
              handle tension, and protect the health of the culture over time.
            </p>
          </div>

          <div className={styles.cardsGrid}>
            {featureCards.map((card) => (
              <article className={`${styles.featureCard} ${styles.reveal}`} key={card.title}>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
                <ul>
                  {card.items.map((item) => (
                    <li key={item}>
                      <span className={styles.featureMarker} aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <div className={`${styles.roiShell} ${styles.reveal}`}>
            <div className={`${styles.eyebrow} ${styles.eyebrowLight}`}>
              The Business Case
            </div>
            <div className={styles.roiGrid}>
              <div>
                <h2>Healthy cultures are good for business.</h2>
                <p>
                  Most organizations never calculate the cost of relational drag.
                  But even modest friction can quietly reduce trust, focus,
                  execution, and leadership clarity. The losses compound long
                  before anyone names them.
                </p>
              </div>

              <div className={styles.roiPanel}>
                <strong>See the numbers more clearly.</strong>
                <p>
                  Use the ROI Calculator to explore the business case for
                  reducing relational drag inside your company.
                </p>
                <div className={styles.actionSpace}>
                  <Link className={`${styles.btn} ${styles.btnSecondary}`} href={routes.roiCalculator}>
                    See the ROI Calculator
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <div className={`${styles.foundersShell} ${styles.reveal}`}>
            <div className={`${styles.eyebrow} ${styles.eyebrowLight}`}>
              The PeaceWorks Circle
            </div>
            <div className={styles.foundersGrid}>
              <div>
                <h2>A circle for companies committed to a better way of leading.</h2>
                <p>
                  PeaceWorks offers small Circles, a limited group of companies
                  committed to practicing leadership that is calmer, more honest,
                  and more durable under pressure.
                </p>

                <div className={styles.foundersList}>
                  {foundersItems.map(([title, description]) => (
                    <div className={styles.foundersItem} key={title}>
                      <strong>{title}</strong>
                      <span>{description}</span>
                    </div>
                  ))}
                </div>
              </div>

              <aside className={styles.membershipCard}>
                <span className={styles.tag}>Circle membership</span>
                <div className={styles.price}>
                  $500 <small>/ month</small>
                </div>
                <p>
                  Designed for a small number of companies who want to install
                  healthier relational rhythms early.
                </p>
                <ul>
                  <li>Each circle is limited to 10 companies</li>
                  <li>Built for owners and leadership teams</li>
                  <li>Designed for implementation, not inspiration only</li>
                </ul>
                <Link className={`${styles.btn} ${styles.btnPrimary}`} href={routes.join}>
                  Join a Circle
                </Link>
              </aside>
            </div>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.invitationSection}`}>
        <div className={styles.container}>
          <div className={`${styles.inviteShell} ${styles.reveal}`}>
            <div className={`${styles.eyebrow} ${styles.eyebrowLight}`}>
              The Invitation
            </div>
            <div className={styles.inviteGrid}>
              <div>
                <h2>
                  The question isn’t whether tension exists in your company.
                </h2>
                <p>
                  Every organization carries pressure. The real question is what
                  changes when your leaders become the calmest people in the
                  room.
                </p>
                <div className={styles.btnRow}>
                  <Link className={`${styles.btn} ${styles.btnPrimary}`} href={routes.join}>
                    Join a Circle
                  </Link>
                  <Link className={`${styles.btn} ${styles.btnGhost}`} href={routes.about}>
                    Contact PeaceWorks
                  </Link>
                </div>
              </div>

              <div className={styles.inviteBoxes}>
                <div className={styles.inviteBox}>
                  <strong>Ready to join?</strong>
                  <span>
                    Apply for a Circle and begin building healthier relational
                    rhythms inside your company.
                  </span>
                </div>
                <div className={styles.inviteBox}>
                  <strong>Want to understand your peace under pressure?</strong>
                  <span>
                    Take the Peace Assessment to discover the patterns that shape
                    how you seek, lose, protect, and restore peace.
                  </span>
                  <div className={styles.inviteAction}>
                    <Link className={`${styles.btn} ${styles.btnSecondary}`} href={routes.peaceAssessment}>
                      Take the Peace Assessment
                    </Link>
                  </div>
                </div>
                <div className={styles.inviteBox}>
                  <strong>Want to understand the numbers first?</strong>
                  <span>
                    Use the ROI Calculator to explore the business case for
                    reducing relational drag inside your company.
                  </span>
                  <div className={styles.inviteAction}>
                    <Link className={`${styles.btn} ${styles.btnSecondary}`} href={routes.roiCalculator}>
                      Open the ROI Calculator
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
