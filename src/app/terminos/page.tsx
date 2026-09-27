"use client";

import React from 'react';
import { useTranslations } from '@/context/TranslationContext';

const SECTION_COUNT = 11;

export default function Terminos() {
  const { t } = useTranslations();
  return (
    <div style={{ paddingTop: '100px', minHeight: '100vh', paddingBottom: '100px' }}>
      <main className="page-container slide-up" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'left' }}>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', marginBottom: '2rem', letterSpacing: '-0.04em' }}>
          {t("terms.title")}
        </h1>
        
        <div style={{ color: 'var(--color-muted)', fontSize: '1.125rem', lineHeight: '1.8' }}>
          <p style={{ marginBottom: '1.5rem' }}>
            {t("terms.last_upd")}
          </p>

          {Array.from({ length: SECTION_COUNT }, (_, i) => i + 1).map(n => (
            <section key={n}>
              <h2 style={{ color: 'var(--color-foreground)', marginTop: '2.5rem', marginBottom: '1rem', fontSize: '1.5rem' }}>{t(`terms.sec${n}.title`)}</h2>
              <p style={{ marginBottom: '1.5rem' }}>
                {t(`terms.sec${n}.p`)}
              </p>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
