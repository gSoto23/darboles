"use client";

import React, { useState } from 'react';
import styles from './Nosotros.module.css';
import { useTranslations } from '@/context/TranslationContext';

export default function Nosotros() {
  const { t } = useTranslations();
  const [selectedTip, setSelectedTip] = useState<number | null>(null);

  const tips = [
    {
       title: "Hidratación Constante",
       image: "/images/tip-water.png",
       desc: "Al estar en un ambiente de cuidados iniciales, el árbol dependerá enteramente del riego. Mantén la tierra siempre húmeda pero no encharcada, especialmente durante sus primeras semanas."
    },
    {
       title: "Luz Solar Directa",
       image: "/images/tip-sun.png",
       desc: "Nuestras especies disfrutan de baños de sol; ubícalo cerca de una ventana brillante o en un balcón. El sol matutino asegura que el árbol mantenga su color verde y vitalidad celular."
    },
    {
       title: "Transplante Directo",
       image: "/images/tip-transplant.png",
       desc: "Cuando sientas que sus raíces están pidiendo espacio natural, no necesitas desempacarlo. Nuestros empaques se desintegran orgánicamente; simplemente planta el empaque completo en la tierra y la naturaleza hará el resto."
    },
    {
       title: "Vínculo y Observación",
       image: "/images/tip-love.png",
       desc: "Construir un vínculo con la naturaleza implica observarla. Revisa sus hojas; tu árbol se comunicará contigo rápidamente mediante el brillo, postura o la caída de su follaje."
    }
  ];
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

        <div style={{ marginTop: '8rem', marginBottom: '2rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '2.5rem' }}>Consejos Prácticos de Cuidado</h2>
          <div className={`slide-up`} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', textAlign: 'left' }}>
            {tips.map((tip, idx) => (
              <button 
                key={idx}
                onClick={() => setSelectedTip(idx)}
                style={{ 
                  background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '2rem 1.5rem', 
                  cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
                  color: 'inherit', textAlign: 'center'
                }}
              >
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(0,0,0,0.04)', display: 'flex', alignItems:'center', justifyContent: 'center', color: 'var(--color-foreground)' }}>
                   {idx === 0 && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"></path></svg>}
                   {idx === 1 && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></svg>}
                   {idx === 2 && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"></path><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"></path></svg>}
                   {idx === 3 && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></svg>}
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>{tip.title}</h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>Ver el consejo →</span>
              </button>
            ))}
          </div>
        </div>

        {/* MODAL DE CONSEJO */}
        {selectedTip !== null && (
           <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', opacity: 1, transition: 'opacity 0.2s' }} onClick={() => setSelectedTip(null)}>
             <div style={{ background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: '1rem', width: '100%', maxWidth: '420px', overflow: 'hidden', transform: 'scale(1)', transition: 'transform 0.2s' }} onClick={e => e.stopPropagation()}>
               <img src={tips[selectedTip].image} alt={tips[selectedTip].title} style={{ width: '100%', height: '260px', objectFit: 'cover' }} />
               <div style={{ padding: '2rem' }}>
                 <h2 style={{ fontSize: '1.6rem', marginBottom: '1rem', lineHeight: '1.2' }}>{tips[selectedTip].title}</h2>
                 <p style={{ color: 'var(--color-muted)', lineHeight: '1.6', fontSize: '0.95rem' }}>{tips[selectedTip].desc}</p>
                 <button 
                   onClick={() => setSelectedTip(null)}
                   style={{ marginTop: '2rem', width: '100%', padding: '0.85rem', background: 'var(--color-foreground)', color: 'var(--color-background)', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem' }}
                 >
                   Entendido
                 </button>
               </div>
             </div>
           </div>
        )}

      </main>
    </div>
  );
}
