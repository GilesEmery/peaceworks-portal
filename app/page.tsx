"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import SiteFooter from "../components/layout/SiteFooter";
import SiteHeader from "../components/layout/SiteHeader";
import { dashboardLoginHref, routes } from "../lib/navigation";
import { supabase } from "../lib/supabase";

const homeFeatures = [
  {
    title: "Calm Leadership",
    description: "Lead through pressure without transmitting panic.",
  },
  {
    title: "Conflict Repair",
    description: "Address tension before it hardens.",
  },
  {
    title: "Relational Strength",
    description: "Build cultures where trust holds.",
  },
];

export default function Home() {
  const [dashboardHref, setDashboardHref] = useState(
    dashboardLoginHref(routes.myDashboard)
  );

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardDestination() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMounted) return;

      setDashboardHref(session ? routes.myDashboard : dashboardLoginHref(routes.myDashboard));
    }

    void loadDashboardDestination();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="portal-page">
      <SiteHeader />

      <section className="home-foundation-shell">
        <div className="container">
          <div className="home-foundation-card">
            <div className="home-foundation-copy">
              <div className="eyebrow">Peace Made Practical</div>
              <h1>
                Peace isn’t passive.
                <br />
                It’s practiced.
              </h1>
              <p>
                PeaceWorks helps leaders strengthen the relationships, habits,
                and cultures that allow trust to hold under pressure.
              </p>

              <div className="btn-row">
                <Link className="btn btn-primary" href={routes.about}>
                  Explore PeaceWorks
                </Link>
                <Link className="btn btn-secondary" href={dashboardHref}>
                  My Dashboard
                </Link>
              </div>
            </div>

            <div className="home-foundation-features" aria-label="PeaceWorks focus areas">
              {homeFeatures.map((feature) => (
                <article key={feature.title}>
                  <h2>{feature.title}</h2>
                  <p>{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
