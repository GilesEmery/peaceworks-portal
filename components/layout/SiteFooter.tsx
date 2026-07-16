import Image from "next/image";
import Link from "next/link";

import { footerNavigation } from "../../lib/navigation";

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
          {footerNavigation.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
