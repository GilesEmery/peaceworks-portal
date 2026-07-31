import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight } from "lucide-react";

import { routes } from "../../../lib/navigation";
import styles from "./OrganizationsPage.module.css";

const relationalDrag = [
  ["The real conversation happens later.", "Meetings appear aligned while concerns move into hallways, private messages, and assumptions."],
  ["Leadership feels heavier than it should.", "The same unresolved people problems continue consuming attention, energy, and decision-making capacity."],
  ["Teams protect instead of collaborate.", "Departments guard information, influence, and territory rather than solving shared problems together."],
  ["Decisions slow and problems repeat.", "Weak trust and unclear ownership create hesitation, avoidance, triangulation, and unfinished conversations."],
];

const startingPoints = [
  ["Leadership Conversation", "Clarify what the organization is carrying", "A focused conversation identifies the pressures, patterns, questions, and readiness shaping the current moment."],
  ["Leadership Awareness", "Understand patterns under pressure", "The Peace Assessment helps leaders recognize their pressure responses and what others may experience from them."],
  ["Organizational Listening", "Make the relational environment more visible", "Listening Previews, diagnostics, and Listening Labs surface experiences that may not be visible from the leadership table."],
  ["Relational Operating System Practice", "Build shared language, tools, and rhythms", "Leaders and teams establish repeatable practices for meetings, decisions, tensions, and everyday organizational life."],
];

const listeningPanels = [
  {
    label: "Listening Preview",
    title: "Experience the PeaceWorks listening posture.",
    copy: "A short, bounded experience introduces leaders or teams to a curious, honest, and dignifying listening posture.",
    note: "A Listening Preview is an introduction, not a full organizational diagnosis.",
  },
  {
    label: "Cultural Peace Index",
    title: "Create a clearer relational snapshot.",
    copy: "The Cultural Peace Index offers a relational snapshot across trust, candor, psychological safety, responsibility, and repair capacity.",
    note: "It is a diagnostic signal for discernment, not a score of an organization’s worth or health.",
  },
  {
    label: "Listening Lab",
    title: "Listen across the organization with structure and care.",
    copy: "A paid, facilitated process may include leadership discovery, consent-based participation, thematic synthesis, a leadership debrief, and a Relational Health Report.",
    note: "The purpose is not to identify villains. It is to help the organization see patterns, strengths, tensions, and possibilities more truthfully.",
  },
];

const journey = [
  ["See", "Understand the relational environment, including strengths, tensions, patterns, and readiness."],
  ["Name", "Create shared language for what happens under pressure without reducing one person to the problem."],
  ["Practice", "Use practical tools in real conversations, decisions, tensions, and leadership moments."],
  ["Rhythm", "Build the practices into meetings, coaching, reflection, and accountability."],
  ["Restore", "Address disruption, take responsibility, repair what is possible, and return to shared work."],
  ["Sustain", "Develop internal ownership so the organization can carry the work forward."],
];

const businessOutcomes = [
  ["Tension is named earlier", "Concerns surface before they become entrenched stories, resentment, or avoidance."],
  ["Ownership becomes clearer", "Responsibility replaces some patterns of blame, over-functioning, and triangulation."],
  ["Repair happens sooner", "Disruption is addressed before it settles into long-term distrust."],
  ["Collaboration strengthens", "Teams work across pressure instead of protecting territory or withholding what others need."],
];

function SectionIntro({ eyebrow, title, copy, light = false }: { eyebrow: string; title: string; copy?: string; light?: boolean }) {
  return (
    <header className={`${styles.sectionIntro} ${light ? styles.sectionIntroLight : ""}`}>
      <div className={styles.eyebrow}>{eyebrow}</div>
      <h2>{title}</h2>
      {copy && <p>{copy}</p>}
    </header>
  );
}

export default function OrganizationsPage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={`${styles.container} ${styles.heroGrid}`}>
          <div className={styles.heroCopy}>
            <div className={styles.eyebrow}>PeaceWorks for Organizations</div>
            <h1>Build an organization that can face pressure without losing trust.</h1>
            <p>Growth, change, difficult decisions, and competing priorities place pressure on people and relationships. PeaceWorks helps leaders and teams recognize that pressure earlier, engage tension more honestly, repair disruption, and return to healthier work.</p>
            <p className={styles.heroSecondary}>We help organizations establish a Relational Operating System—a shared way to navigate the work between people when the pressure is real.</p>
            <div className={styles.buttonRow}>
              <a className={`${styles.button} ${styles.buttonDark}`} href="#how-we-work">Explore How We Work <ArrowDown aria-hidden="true" size={18} /></a>
              <Link className={`${styles.button} ${styles.buttonLight}`} href={routes.howItWorks}>Explore the Relational Operating System</Link>
            </div>
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

      <section className={styles.section}>
        <div className={styles.container}>
          <SectionIntro eyebrow="Relational Drag" title="The strain between people eventually becomes a business problem." copy="It appears in polite meetings where concerns move elsewhere, recurring leadership burdens, guarded teams, and decisions slowed by weak trust." />
          <div className={styles.editorialGrid}>{relationalDrag.map(([title, copy], index) => <article className={styles.editorialRow} key={title}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{title}</h3><p>{copy}</p></div></article>)}</div>
          <p className={styles.closingStatement}>Relational drag is the hidden friction that weakens trust, slows decisions, and makes leadership heavier.</p>
        </div>
      </section>

      <section className={styles.section}>
        <div className={`${styles.container} ${styles.darkPanel}`}>
          <SectionIntro light eyebrow="A Practical System" title="PeaceWorks strengthens the operating system beneath the strategy." copy="Technical systems organize goals, roles, and execution. PeaceWorks strengthens how people listen, speak honestly, navigate conflict, repair disruption, and return to shared work." />
          <Link className={styles.systemLink} href={routes.howItWorks}>Explore How It Works <ArrowRight aria-hidden="true" size={17} /></Link>
        </div>
      </section>

      <section className={`${styles.section} ${styles.anchorTarget}`} id="how-we-work">
        <div className={styles.container}>
          <SectionIntro eyebrow="Ways to Begin" title="Organizations do not all need the same starting point." copy="Some leaders begin with a specific tension. Others want to understand the culture more clearly, form their leadership team, or establish a broader organizational practice. PeaceWorks begins by listening before recommending a path." />
          <div className={styles.startGrid}>{startingPoints.map(([title, role, copy], index) => <article className={styles.startCard} key={title}><span className={styles.cardNumber}>{String(index + 1).padStart(2, "0")}</span><h3>{title}</h3><strong>{role}</strong><p>{copy}</p></article>)}</div>
          <p className={styles.closingStatement}>We begin by understanding the organization and choosing one responsible next step.</p>
        </div>
      </section>

      <section className={`${styles.section} ${styles.anchorTarget}`} id="organizational-listening">
        <div className={`${styles.container} ${styles.listeningShell}`}>
          <SectionIntro eyebrow="Organizational Listening" title="Before prescribing change, understand what people are actually carrying." copy="PeaceWorks creates structured ways to hear experience across roles and levels of power without turning listening into blame or an uncontained complaint process." />
          <div className={styles.listeningGrid}>{listeningPanels.map((panel) => <article className={styles.listeningPanel} key={panel.label}><span className={styles.panelLabel}>{panel.label}</span><h3>{panel.title}</h3><p>{panel.copy}</p><p className={styles.panelNote}>{panel.note}</p></article>)}</div>
          <aside className={styles.groundedNote}><span>Responsible listening</span><p>Every engagement is shaped by context, power, consent, confidentiality, psychological safety, and responsible scope.</p></aside>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <SectionIntro eyebrow="How the Work Develops" title="From relational strain to sustainable practice." copy="The work follows a clear path while remaining responsive to context, trust, power, and readiness." />
          <ol className={styles.journeyGrid}>{journey.map(([title, copy], index) => <li key={title}><span className={styles.journeyNumber}>{String(index + 1).padStart(2, "0")}</span><h3>{title}</h3><p>{copy}</p></li>)}</ol>
          <p className={styles.closingStatement}>The aim is not dependence on PeaceWorks. It is growing internal capacity for truth, responsibility, repair, and return.</p>
        </div>
      </section>

      <section className={`${styles.section} ${styles.anchorTarget}`} id="business-case">
        <div className={`${styles.container} ${styles.businessPanel}`}>
          <SectionIntro light eyebrow="The Business Case" title="Relational health shapes operational health." copy="Relational practices do not replace strategy, accountability, or difficult decisions. They help people carry those responsibilities with greater clarity and ownership when pressure is high." />
          <div className={styles.businessGrid}>{businessOutcomes.map(([title, copy], index) => <article key={title}><span>{String(index + 1).padStart(2, "0")}</span><h3>{title}</h3><p>{copy}</p></article>)}</div>
          <div className={styles.roiCallout}><div><h3>Make the hidden cost of relational drag more visible.</h3><p>The calculator is a planning tool, not a guarantee of business results.</p></div><Link className={`${styles.button} ${styles.buttonCream}`} href={routes.roiCalculator}>Explore the Relational ROI Calculator <ArrowRight aria-hidden="true" size={18} /></Link></div>
          <aside className={styles.scopeNote}>PeaceWorks is for leaders willing to practice, not simply observe. It is not a substitute for therapy, legal counsel, formal investigation, crisis intervention, or required HR processes.</aside>
        </div>
      </section>

      <section className={styles.closingSection}>
        <div className={`${styles.container} ${styles.closingPanel}`}>
          <div className={styles.eyebrow}>A Responsible Next Step</div>
          <h2>You do not need to know exactly where to begin.</h2>
          <p>Tell us what your organization is carrying. We will listen, help clarify the situation, and identify whether PeaceWorks may offer a responsible next step.</p>
          <div className={styles.buttonRow}><Link className={`${styles.button} ${styles.buttonCream}`} href={routes.about}>Learn More About PeaceWorks</Link><Link className={`${styles.button} ${styles.buttonOutline}`} href={routes.howItWorks}>Explore How It Works</Link></div>
        </div>
      </section>
    </div>
  );
}
