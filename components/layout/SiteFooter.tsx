import Image from "next/image";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="footer-branding">
          <Image
            src="https://raw.githubusercontent.com/gilesemery/peaceworks-main/main/PeaceworksLogo.svg"
            alt="PeaceWorks"
            width={240}
            height={59}
            style={{ height: "auto" }}
            unoptimized
          />
        </div>

        <p className="footer-copyright">
          © 2026 PeaceWorks. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
