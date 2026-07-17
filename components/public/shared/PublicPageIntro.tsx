import type { ReactNode } from "react";

import styles from "./PublicPageIntro.module.css";

type PublicPageIntroProps = {
  actions?: ReactNode;
  belowContent?: ReactNode;
  children: ReactNode;
  className?: string;
  eyebrow: ReactNode;
  secondaryCopy?: ReactNode;
  title: ReactNode;
};

export default function PublicPageIntro({
  actions,
  belowContent,
  children,
  className,
  eyebrow,
  secondaryCopy,
  title,
}: PublicPageIntroProps) {
  return (
    <div className={`${styles.intro}${className ? ` ${className}` : ""}`}>
      <div className={styles.eyebrow}>{eyebrow}</div>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.copy}>{children}</div>
      {secondaryCopy && (
        <div className={styles.secondaryCopy}>{secondaryCopy}</div>
      )}
      {actions && <div className={styles.actions}>{actions}</div>}
      {belowContent}
    </div>
  );
}
