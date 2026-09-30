"use client";

import React from 'react';
import styles from './Nosotros.module.css';
import { useTranslations } from '@/context/TranslationContext';
import PlantingSteps from '@/components/PlantingSteps';

export default function NosotrosClient() {
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
          <div className={styles.imagePlaceholder} style={{ background: 'none' }}>
            <img src="/images/hero-gift.png" alt="Regalar un árbol" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '1rem', zIndex: 1 }} />
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
          <div className={styles.imagePlaceholder} style={{ background: 'none' }}>
            <img src="/images/planting-hands.png" alt="Manos sembrando un árbol" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '1rem', zIndex: 1 }} />
          </div>
        </section>

        <section className={`slide-up ${styles.manifestoGrid}`} style={{ marginTop: '8rem' }}>
          <div className={styles.textArea}>
            <h2 className={styles.sectionTitle}>{t("nosotros.sec3.title")}</h2>
            <p className={styles.sectionText}>
              {t("nosotros.sec3.p1")}
            </p>
            <p className={styles.sectionText}>
              {t("nosotros.sec3.p2")}
            </p>
          </div>
          <div className={styles.imagePlaceholder} style={{ background: 'none' }}>
            <img src="/images/tip-transplant.png" alt="Empaque plantable de Dárboles listo para sembrarse" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '1rem', zIndex: 1 }} />
          </div>
        </section>

        <section className="slide-up" style={{ marginTop: '8rem', textAlign: 'center' }}>
          <p style={{
            fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontStyle: 'italic', fontWeight: 500,
            maxWidth: '760px', margin: '0 auto', lineHeight: 1.4, color: 'var(--color-foreground)',
            borderLeft: '3px solid var(--color-foreground)', paddingLeft: '1.5rem', textAlign: 'left'
          }}>
            &ldquo;{t("nosotros.anchor")}&rdquo;
          </p>
        </section>

        <section className={`slide-up ${styles.manifestoGrid}`} style={{ marginTop: '6rem' }}>
          <div className={styles.textArea}>
            <h2 className={styles.sectionTitle}>{t("nosotros.tomato.title")}</h2>
            <p className={styles.sectionText}>{t("nosotros.tomato.desc")}</p>
            <a href="https://tomatocr.com" target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600, textDecoration: 'underline', color: 'var(--color-foreground)' }}>
              tomatocr.com →
            </a>
          </div>
          <div className={styles.textArea}>
            <h2 className={styles.sectionTitle}>{t("nosotros.guardian.title")}</h2>
            <p className={styles.sectionText}>{t("nosotros.guardian.desc")}</p>
          </div>
        </section>

        <div style={{ marginTop: '8rem', marginBottom: '2rem' }}>
          <PlantingSteps />
        </div>

      </main>
    </div>
  );
}
