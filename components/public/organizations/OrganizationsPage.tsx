import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight } from "lucide-react";

import { routes } from "../../../lib/navigation";
import styles from "./OrganizationsPage.module.css";

const relationalDrag = [
  ["The real conversation happens later.", "Meetings appear aligned while concerns move into hallways, private messages, and assumptions."],
  ["Leadership feels heavier than it should.", "Unresolved relational issues continue consuming attention, energy, and decision making capacity."],
  ["Teams protect instead of collaborate.", "People may guard information, influence, and territory rather than solving shared problems together."],
  ["Decisions slow and problems repeat.", "Weak trust and unclear ownership can create hesitation, avoidance, triangulation, and rework."],
];

const startingPoints = [
  ["Leadership Conversation", "Clarify what is happening", "A focused conversation helps leaders name the pressures, patterns, questions, and possibilities shaping the organization."],
  ["Leadership Awareness", "Recognize how pressure shows up in leadership", "The Peace Assessment helps leaders understand how they respond under pressure and how those responses may be experienced by others."],
  ["Organizational Listening", "Make the relational environment more visible", "Structured listening helps surface experiences, strengths, and patterns that may not be visible from the leadership table."],
  ["Relational Operating System", "Build shared organizational capacity", "Leaders and teams develop shared language, practical tools, and repeatable practices for responding to pressure, taking responsibility, and repairing what has been disrupted."],
];

const listeningPanels = [
  {
    label: "Listening Preview",
    title: "Experience the PeaceWorks listening posture.",
    copy: "A short, bounded experience introduces leaders or teams to a more curious, honest, and dignifying way of listening.",
    note: "An introduction, not a full organizational diagnosis.",
  },
  {
    label: "Cultural Peace Index",
    title: "Create a clearer relational snapshot.",
    copy: "A structured diagnostic helps leaders see patterns related to trust, candor, psychological safety, responsibility, and repair capacity.",
    note: "A signal for discernment, not a verdict on the organization.",
  },
  {
    label: "Listening Lab",
    title: "Listen across the organization with structure and care.",
    copy: "A paid, facilitated process may include leadership discovery, consent based participation, thematic synthesis, a leadership debrief, and a Relational Health Report.",
    note: "The purpose is to understand patterns and possibilities, not identify villains.",
  },
];

const journey = [
  ["Seek", "Clarify what matters, what the organization is trying to preserve, and what healthy relationships and culture should make possible."],
  ["Disrupt", "See where pressure, patterns, systems, or unresolved tension are weakening trust, clarity, and connection."],
  ["Respond", "Develop shared language, practical tools, and everyday practices that help people respond differently when pressure rises."],
  ["Restore", "Name what needs attention, take responsibility, repair what is possible, and build the practices into organizational life so people can return again."],
];

const businessOutcomes = [
  ["Tension is named earlier", "Concerns can surface before they become entrenched stories, resentment, or avoidance."],
  ["Ownership becomes clearer", "Responsibility can replace patterns of blame, over functioning, and triangulation."],
  ["Repair happens sooner", "Disruption can be addressed before it settles into long term distrust."],
  ["Collaboration strengthens", "Teams can work across pressure with less territorial protection and less withholding of what others need."],
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
            <p>Growth, change, difficult decisions, and competing priorities place strain on people and relationships. Left unaddressed, that strain can weaken communication, slow decisions, and make leadership heavier.</p>
            <p className={styles.heroSecondary}>PeaceWorks helps leaders and teams build a shared way to recognize what disrupts trust, respond responsibly under pressure, and return to healthier work together.</p>
            <div className={styles.buttonRow}>
              <a className={`${styles.button} ${styles.buttonDark}`} href="#how-we-work">Explore How We Work <ArrowDown aria-hidden="true" size={18} /></a>
              <Link className={`${styles.button} ${styles.buttonLight}`} href={routes.howItWorks}>Understand the System</Link>
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
        <div className={`${styles.container} ${styles.relationalDragPanel}`}>
          <SectionIntro eyebrow="Relational Drag" title="The strain between people eventually reaches the work." copy="It rarely begins as one dramatic event. More often, it accumulates through unfinished conversations, guarded teams, unclear ownership, and recurring leadership burdens." />
          <div className={styles.editorialGrid}>{relationalDrag.map(([title, copy]) => <article className={styles.editorialRow} key={title}><div><h3>{title}</h3><p>{copy}</p></div></article>)}</div>
          <p className={styles.closingStatement}>Relational drag is the hidden friction that can weaken trust, slow decisions, and make leadership heavier.</p>
        </div>
      </section>

      <section className={styles.section}>
        <div className={`${styles.container} ${styles.darkPanel}`}>
          <SectionIntro light eyebrow="A Practical System" title="Strengthen the system beneath the strategy." copy="PeaceWorks helps leaders and teams develop a shared way to listen, speak honestly, respond under pressure, take responsibility, and repair what has been disrupted when the work between people breaks down." />
          <Link className={styles.systemLink} href={routes.howItWorks}>Explore How It Works <ArrowRight aria-hidden="true" size={17} /></Link>
        </div>
      </section>

      <section className={`${styles.section} ${styles.anchorTarget}`} id="how-we-work">
        <div className={styles.container}>
          <SectionIntro eyebrow="Ways to Begin" title="Start with what the organization is carrying now." copy="PeaceWorks begins by listening. The right starting point depends on what the organization is experiencing, what leaders are ready to address, and what responsible next step would be most useful." />
          <div className={styles.startGrid}>{startingPoints.map(([title, role, copy]) => <article className={styles.startCard} key={title}><h3>{title}</h3><strong>{role}</strong><p>{copy}</p></article>)}</div>
          <p className={styles.closingStatement}>We begin by understanding what the organization is carrying and recommending one responsible next step.</p>
        </div>
      </section>

      <section className={`${styles.section} ${styles.anchorTarget}`} id="organizational-listening">
        <div className={`${styles.container} ${styles.listeningShell}`}>
          <SectionIntro eyebrow="Organizational Listening" title="Understand what people are actually carrying." copy="PeaceWorks creates structured ways to hear experience across roles and levels of power without turning listening into blame, performance, or an uncontained complaint process." />
          <div className={styles.listeningGrid}>{listeningPanels.map((panel) => <article className={styles.listeningPanel} key={panel.label}><span className={styles.panelLabel}>{panel.label}</span><h3>{panel.title}</h3><p>{panel.copy}</p><p className={styles.panelNote}>{panel.note}</p></article>)}</div>
          <aside className={styles.groundedNote}><span>Responsible listening</span><p>Every engagement is shaped by context, power, consent, confidentiality, psychological safety, and responsible scope.</p></aside>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <SectionIntro eyebrow="How the Work Develops" title="From insight to sustainable practice." copy="The starting point may differ, but the work follows the same shared movement across people, teams, and organizations." />
          <ol className={styles.journeyGrid}>{journey.map(([title, copy], index) => <li key={title}><span className={styles.journeyNumber}>{String(index + 1).padStart(2, "0")}</span><h3>{title}</h3><p>{copy}</p></li>)}</ol>
          <p className={styles.closingStatement}>The aim is not dependence on PeaceWorks. It is growing internal capacity for truth, responsibility, repair, and return.</p>
        </div>
      </section>

      <section className={`${styles.section} ${styles.anchorTarget}`} id="business-case">
        <div className={`${styles.container} ${styles.businessPanel}`}>
          <SectionIntro light eyebrow="The Business Case" title="Relational health shapes operational health." copy="PeaceWorks does not replace strategy, accountability, sound management, or difficult decisions. It helps people carry those responsibilities with greater clarity, ownership, and trust." />
          <div className={styles.businessGrid}>{businessOutcomes.map(([title, copy]) => <article key={title}><h3>{title}</h3><p>{copy}</p></article>)}</div>
          <div className={styles.roiCallout}><div><h3>Make the hidden cost of relational drag more visible.</h3><p>The calculator is a planning and reflection tool, not a guarantee of business results.</p></div><Link className={`${styles.button} ${styles.buttonCream}`} href={routes.roiCalculator}>Explore the Relational ROI Calculator <ArrowRight aria-hidden="true" size={18} /></Link></div>
          <aside className={styles.scopeNote}>PeaceWorks is designed for leaders willing to practice, not simply observe. It does not replace therapy, legal counsel, formal investigation, crisis intervention, or required HR processes.</aside>
        </div>
      </section>

      <section className={styles.closingSection}>
        <div className={`${styles.container} ${styles.closingPanel}`}>
          <div className={styles.eyebrow}>A Responsible Next Step</div>
          <h2>You do not need to know exactly where to begin.</h2>
          <p>Tell us what your organization is carrying. We will listen, help clarify what is happening, and determine whether PeaceWorks can offer a responsible next step.</p>
          <div className={styles.buttonRow}><Link className={`${styles.button} ${styles.buttonCream}`} href={routes.about}>Learn More About PeaceWorks</Link><Link className={`${styles.button} ${styles.buttonOutline}`} href={routes.howItWorks}>Explore How It Works</Link></div>
        </div>
      </section>
    </div>
  );
}
