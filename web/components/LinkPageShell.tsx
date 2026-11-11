import type { ReactNode } from 'react';
import styles from './link-page.module.css';

/** The frame shared by the gift and group pages: logo on top, one card, a short footer. */
export default function LinkPageShell({ children, footer }: { children: ReactNode; footer: ReactNode }) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <a href="/" className={styles.brand}>
          <img src="/logo.png" alt="" />
          <span>QuickGift</span>
        </a>
      </header>
      <main className={styles.main}>
        <div className={styles.card} aria-live="polite">
          {children}
        </div>
      </main>
      <footer className={styles.footer}>{footer}</footer>
    </div>
  );
}
