"use client";

import Link from 'next/link';
import { useTranslations } from '@/context/TranslationContext';
import styles from './PlantingSteps.module.css';

// Mismo proceso e ilustraciones que tomatocr.com/programas/darboles ("El proceso, en 4 pasos")
const STEPS = [
  { key: 'hidrata', image: '/images/pasos/1-hidrata.svg' },
  { key: 'prepara', image: '/images/pasos/2-prepara.svg' },
  { key: 'siembra', image: '/images/pasos/3-siembra.svg' },
  { key: 'registra', image: '/images/pasos/4-cuida.svg' },
];

export default function PlantingSteps() {
  const { t } = useTranslations();

  return (
    <section id="como-sembrar" className="slide-up" style={{ scrollMarginTop: '100px', border: '1px solid var(--color-border)', borderRadius: '16px', padding: 'clamp(1.5rem, 4vw, 2.5rem)', textAlign: 'left' }}>
      <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-muted)' }}>{t('steps.badge')}</div>
      <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2rem)', margin: '0.5rem 0 0.75rem 0' }}>{t('steps.title')}</h2>
      <p style={{ color: 'var(--color-muted)', lineHeight: 1.6, maxWidth: '720px', margin: 0 }}>{t('steps.subtitle')}</p>

      <ol className={styles.grid}>
        {STEPS.map((step, i) => (
          <li key={step.key}>
            {/* eslint-disable-next-line @next/next/no-img-element -- SVG liviano, no necesita optimización */}
            <img src={step.image} width={640} height={480} loading="lazy" decoding="async" alt={t(`steps.${step.key}.alt`)} style={{ width: '100%', height: 'auto', aspectRatio: '4 / 3', objectFit: 'cover', borderRadius: '12px', display: 'block' }} />
            <div style={{ marginTop: '0.75rem', fontSize: '1.9rem', fontWeight: 600, color: '#16a34a', lineHeight: 1 }}>{i + 1}</div>
            <h3 style={{ margin: '0.35rem 0 0 0', fontSize: '1.05rem', fontWeight: 600 }}>{t(`steps.${step.key}.title`)}</h3>
            <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.92rem', color: 'var(--color-muted)', lineHeight: 1.55 }}>{t(`steps.${step.key}.desc`)}</p>
          </li>
        ))}
      </ol>

      <p style={{ margin: '1.75rem 0 0 0', fontSize: '0.92rem', color: 'var(--color-muted)', lineHeight: 1.6 }}>
        {t('steps.note')}{' '}
        <Link href="/registro" style={{ color: 'var(--color-foreground)', fontWeight: 600 }}>{t('steps.cta')}</Link>
      </p>
    </section>
  );
}
