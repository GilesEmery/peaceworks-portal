import Image from "next/image";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="footer-branding">
          <Image
            src="https://www.peaceworks.network/PeaceworksLogo.svg"
            alt="PeaceWorks"
            width={240}
            height={59}
          />
        </div>

        <div className="footer-links" aria-label="Footer navigation">
          <a href="https://www.peaceworks.network/join">Join</a>
          <a href="https://www.peaceworks.network/contact">About</a>
          <a href="/dashboard">Dashboard</a>
          <a href="/circle">Your Circle</a>
          <a href="/coach">Coaches</a>
        </div>
      </div>
    </footer>
  );
}
