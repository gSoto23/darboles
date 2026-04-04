"use client";

import React from 'react';
import { useTranslations } from '@/context/TranslationContext';

export default function Privacidad() {
  const { t } = useTranslations();
  return (
    <div style={{ paddingTop: '100px', minHeight: '100vh', paddingBottom: '100px' }}>
      <main className="page-container slide-up" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'left' }}>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', marginBottom: '2rem', letterSpacing: '-0.04em' }}>
          {t("priv.title")}
        </h1>
        
        <div style={{ color: 'var(--color-muted)', fontSize: '1.125rem', lineHeight: '1.8' }}>
          <p style={{ marginBottom: '1.5rem' }}>
            {t("priv.last_upd")} {new Date().getFullYear()}
          </p>
          
          <h2 style={{ color: 'var(--color-foreground)', marginTop: '2.5rem', marginBottom: '1rem', fontSize: '1.5rem' }}>{t("priv.sec1.title")}</h2>
          <p style={{ marginBottom: '1.5rem' }}>
            {t("priv.sec1.p")}
          </p>

          <h2 style={{ color: 'var(--color-foreground)', marginTop: '2.5rem', marginBottom: '1rem', fontSize: '1.5rem' }}>{t("priv.sec2.title")}</h2>
          <p style={{ marginBottom: '1.5rem' }}>
            {t("priv.sec2.p")}
          </p>

          <h2 style={{ color: 'var(--color-foreground)', marginTop: '2.5rem', marginBottom: '1rem', fontSize: '1.5rem' }}>{t("priv.sec3.title")}</h2>
          <p style={{ marginBottom: '1.5rem' }}>
            {t("priv.sec3.p")}
          </p>

          <h2 style={{ color: 'var(--color-foreground)', marginTop: '2.5rem', marginBottom: '1rem', fontSize: '1.5rem' }}>{t("priv.sec4.title")}</h2>
          <p style={{ marginBottom: '1.5rem' }}>
            {t("priv.sec4.p")}
          </p>
        </div>
      </main>
    </div>
  );
}
