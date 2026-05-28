export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="footer-branding">
          <img
            src="https://gilesemery.github.io/peaceworks-main/PeaceworksLogo.svg"
            alt="PeaceWorks"
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