"use client";

import Calculator from '@/components/Calculator';
import styles from '../page.module.css';
import { useTranslations } from '@/context/TranslationContext';

export default function SuscripcionesPage() {
  const { t } = useTranslations();
  return (
    <div style={{ paddingTop: '100px', minHeight: '100vh' }}>
      <main className={`page-container slide-up`}>
        <div style={{ textAlign: 'center', marginBottom: '4rem', marginTop: '4rem' }}>
          <div className={styles.badge}>{t("subs.badge")}</div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', marginBottom: '1rem', letterSpacing: '-0.04em' }}>
            {t("subs.title")}
          </h1>
          <p className={styles.subtitle}>
            {t("subs.subtitle")}
          </p>
        </div>

        <Calculator />
      </main>
    </div>
  );
}
