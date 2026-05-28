"use client";

import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type SiteHeaderProps = {
  showSignOut?: boolean;
};

export default function SiteHeader({ showSignOut = true }: SiteHeaderProps) {
  const router = useRouter();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/auth");
  }

  return (
    <header className="site-header">
      <div className="container header-inner">
        <a
  className="brand"
  href="https://www.peaceworks.network"
  aria-label="PeaceWorks home"
>
          <img
            src="https://gilesemery.github.io/peaceworks-main/PeaceworksLogo.svg"
            alt="PeaceWorks"
          />
        </a>

        <nav className="site-nav" aria-label="Primary navigation">
          <a href="https://www.peaceworks.network/join">Join</a>
          <a href="https://www.peaceworks.network/contact">About</a>
          <a href="/dashboard">Dashboard</a>
          <a href="/circle">Your Circle</a>
          <a href="/coach">Coaches</a>

          {showSignOut && (
            <button className="nav-button" type="button" onClick={handleSignOut}>
              Sign Out
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}