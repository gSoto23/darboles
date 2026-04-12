"use client";

import Link from 'next/link';
import styles from './page.module.css';
import { useTranslations } from '@/context/TranslationContext';

export default function Home() {
  const { t } = useTranslations();
  return (
    <div className={styles.heroContainer}>
      <main className={`page-container slide-up`}>
        <div className={styles.badge}>{t("home.badge")}</div>
        <h1 className={styles.title}>
          {t("home.title")}
        </h1>
        <p className={styles.subtitle}>
          {t("home.subtitle")}
        </p>
      </main>

      <div className={`page-container ${styles.optionsGrid} slide-up`} style={{ animationDelay: '0.15s' }}>
        {/* Flujo A: Costa Rica */}
        <Link href="/regalos" className={`${styles.card} glass`}>
          <div style={{ width: '100%', height: '240px', borderRadius: '12px', overflow: 'hidden', marginBottom: '1.5rem' }}>
            <img src="/empaque.jpg" alt="Empaque degradable innovador" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <span className={styles.cardTag}>{t("home.flowA.tag")}</span>
          <h2 className={styles.cardTitle}>{t("home.flowA.title")}</h2>
          <p className={styles.cardDesc}>
            {t("home.flowA.desc")}
          </p>
          <span className={styles.cardAction}>
            {t("home.flowA.btn")}
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8.14645 3.14645C8.34171 2.95118 8.65829 2.95118 8.85355 3.14645L12.8536 7.14645C13.0488 7.34171 13.0488 7.65829 12.8536 7.85355L8.85355 11.8536C8.65829 12.0488 8.34171 12.0488 8.14645 11.8536C7.95118 11.6583 7.95118 11.3417 8.14645 11.1464L11.2929 8H2.5C2.22386 8 2 7.77614 2 7.5C2 7.22386 2.22386 7 2.5 7H11.2929L8.14645 3.85355C7.95118 3.65829 7.95118 3.34171 8.14645 3.14645Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
            </svg>
          </span>
        </Link>
        {/* Flujo B: Cómo Funciona */}
        <div className={`${styles.card} glass`} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', cursor: 'default' }}>
          <h2 className={styles.cardTitle}>{t("home.steps.title")}</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-foreground)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>
                {t("home.steps.1.title")}
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-muted)', lineHeight: 1.5 }}>{t("home.steps.1.desc")}</p>
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-foreground)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg>
                {t("home.steps.2.title")}
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-muted)', lineHeight: 1.5 }}>{t("home.steps.2.desc")}</p>
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-foreground)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                {t("home.steps.3.title")}
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-muted)', lineHeight: 1.5 }}>{t("home.steps.3.desc")}</p>
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-foreground)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                {t("home.steps.4.title")}
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-muted)', lineHeight: 1.5 }}>{t("home.steps.4.desc")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
