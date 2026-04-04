"use client";

import React from 'react';
import styles from './Nosotros.module.css';
import { useTranslations } from '@/context/TranslationContext';

export default function Nosotros() {
  const { t } = useTranslations();
  return (
    <div style={{ paddingTop: '100px', minHeight: '100vh', paddingBottom: '100px' }}>
      <main className="page-container fade-in">
        <div className={`slide-up ${styles.hero}`}>
          <div className={styles.badge}>{t("nosotros.badge")}</div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', marginBottom: '1.5rem', letterSpacing: '-0.04em' }}>
            {t("nosotros.title1")} <br/>
            <span style={{ color: 'var(--color-muted)' }}>{t("nosotros.title2")}</span>
          </h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
            {t("nosotros.subtitle")}
          </p>
        </div>

        <section className={`slide-up ${styles.manifestoGrid}`}>
          <div className={styles.textArea}>
            <h2 className={styles.sectionTitle}>{t("nosotros.sec1.title")}</h2>
            <p className={styles.sectionText}>
              {t("nosotros.sec1.p1")}
            </p>
            <p className={styles.sectionText}>
              {t("nosotros.sec1.p2")}
            </p>
          </div>
          <div className={styles.imagePlaceholder}>
            <span style={{ zIndex: 1 }}>[ Fotografía de Finca / Costa Rica ]</span>
          </div>
        </section>

        <section className={`slide-up ${styles.manifestoGrid}`} style={{ marginTop: '8rem', direction: 'rtl' }}>
          <div className={styles.textArea} style={{ direction: 'ltr' }}>
            <h2 className={styles.sectionTitle}>{t("nosotros.sec2.title")}</h2>
            <p className={styles.sectionText}>
              {t("nosotros.sec2.p1")}
            </p>
            <p className={styles.sectionText}>
              {t("nosotros.sec2.p2")}
            </p>
          </div>
          <div className={styles.imagePlaceholder}>
            <span style={{ zIndex: 1 }}>[ Fotografía de Dashboard Tecnológico ]</span>
          </div>
        </section>

        <div className={`slide-up ${styles.statsRow}`} style={{ marginTop: '8rem' }}>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{t("nosotros.stats.1.val")}</span>
            <span className={styles.statLabel}>{t("nosotros.stats.1.label")}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{t("nosotros.stats.2.val")}</span>
            <span className={styles.statLabel}>{t("nosotros.stats.2.label")}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{t("nosotros.stats.3.val")}</span>
            <span className={styles.statLabel}>{t("nosotros.stats.3.label")}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{t("nosotros.stats.4.val")}</span>
            <span className={styles.statLabel}>{t("nosotros.stats.4.label")}</span>
          </div>
        </div>

      </main>
    </div>
  );
}
