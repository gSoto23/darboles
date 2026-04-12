"use client";

import React from 'react';
import { useTranslations } from '@/context/TranslationContext';

export default function Contacto() {
  const { t } = useTranslations();
  
  return (
    <div style={{ paddingTop: '100px', minHeight: '80vh', paddingBottom: '100px' }}>
      <main className="page-container fade-in">
        <div className={`slide-up`} style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div style={{ display: 'inline-block', padding: '0.5rem 1rem', borderRadius: '2rem', border: '1px solid var(--color-border)', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '1.5rem', background: 'var(--color-surface)' }}>{t("contact.badge")}</div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', marginBottom: '1.5rem', letterSpacing: '-0.04em' }}>
            {t("contact.title")}
          </h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
            {t("contact.subtitle")}
          </p>
        </div>

        <section className={`slide-up`} style={{ maxWidth: '800px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', animationDelay: '0.1s' }}>
          
          <a href="https://wa.me/50672359585" target="_blank" rel="noopener noreferrer" style={{ padding: '3rem 2rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', transition: 'transform 0.2s ease', cursor: 'pointer' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'none'}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#25D366', marginBottom: '1.5rem' }}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{t("contact.whatsapp")}</h2>
            <p style={{ color: 'var(--color-muted)', fontSize: '1.1rem' }}>+506 7235-9585</p>
          </a>

          <a href="mailto:darbolescr@gmail.com" style={{ padding: '3rem 2rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', transition: 'transform 0.2s ease', cursor: 'pointer' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'none'}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-foreground)', marginBottom: '1.5rem' }}><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{t("contact.mail")}</h2>
            <p style={{ color: 'var(--color-muted)', fontSize: '1.1rem' }}>darbolescr@gmail.com</p>
          </a>

        </section>

      </main>
    </div>
  );
}
