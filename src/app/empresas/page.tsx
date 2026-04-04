"use client";

import React from 'react';
import Link from 'next/link';
import styles from './Empresas.module.css';
import { useTranslations } from '@/context/TranslationContext';

export default function Empresas() {
  const { t } = useTranslations();
  return (
    <div style={{ paddingTop: '100px', minHeight: '100vh', paddingBottom: '100px' }}>
      <main className="page-container fade-in">
        
        <div className={`slide-up ${styles.hero}`}>
          <div className={styles.badge}>{t("empresas.badge")}</div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', marginBottom: '1.5rem', letterSpacing: '-0.04em' }}>
            {t("empresas.title1")} <br/>
            <span style={{ color: 'var(--color-muted)' }}>{t("empresas.title2")}</span>
          </h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '1.25rem', maxWidth: '650px', margin: '0 auto', lineHeight: '1.6' }}>
            {t("empresas.subtitle")}
          </p>
        </div>

        <section className={`slide-up ${styles.grid}`}>
          
          <div className={styles.card}>
            <div className={styles.cardIcon}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-foreground)' }}>
                <path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4" />
                <polyline points="14 2 14 8 20 8" />
                <path d="m3 15 2 2-2 2" />
                <path d="m7 19h4" />
              </svg>
            </div>
            <h3 className={styles.cardTitle}>{t("empresas.card1.title")}</h3>
            <p className={styles.cardText}>
              {t("empresas.card1.desc")}
            </p>
          </div>

          <div className={styles.card}>
            <div className={styles.cardIcon}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-foreground)' }}>
                <line x1="18" x2="18" y1="20" y2="10" />
                <line x1="12" x2="12" y1="20" y2="4" />
                <line x1="6" x2="6" y1="20" y2="14" />
                <rect width="20" height="20" x="2" y="2" rx="2" />
              </svg>
            </div>
            <h3 className={styles.cardTitle}>{t("empresas.card2.title")}</h3>
            <p className={styles.cardText}>
              {t("empresas.card2.desc")}
            </p>
          </div>

          <div className={styles.card}>
            <div className={styles.cardIcon}>
               <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-foreground)' }}>
                 <polyline points="20 12 20 22 4 22 4 12" />
                 <rect width="20" height="5" x="2" y="7" />
                 <line x1="12" x2="12" y1="22" y2="7" />
                 <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                 <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
               </svg>
            </div>
            <h3 className={styles.cardTitle}>{t("empresas.card3.title")}</h3>
            <p className={styles.cardText}>
              {t("empresas.card3.desc")}
            </p>
          </div>

        </section>

        <section className={`slide-up ${styles.ctaSection}`}>
          <h2 className={styles.ctaTitle}>{t("empresas.cta.title")}</h2>
          <p className={styles.ctaText}>
            {t("empresas.cta.desc")}
          </p>
          <Link href="/contacto" className={styles.ctaButton}>
            {t("empresas.cta.btn")}
          </Link>
        </section>

      </main>
    </div>
  );
}
