"use client";

import { useState, useEffect } from 'react';
import styles from './Transparencia.module.css';
import { useTranslations } from '@/context/TranslationContext';

// Animated Counter Hook
function useCountUp(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    let animationFrame: number;

    const easeOutExpo = (t: number) => {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    };

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const progressRatio = Math.min(progress / duration, 1);
      
      setCount(Math.floor(easeOutExpo(progressRatio) * end));

      if (progress < duration) {
        animationFrame = requestAnimationFrame(step);
      } else {
        setCount(end);
      }
    };

    animationFrame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return count;
}

export default function TransparenciaPage() {
  const { t } = useTranslations();
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [stats, setStats] = useState({ 
    capacity_trees: 0, 
    sold_trees: 0,
    capacity_tons: 0,
    sold_tons: 0
  });

  useEffect(() => {
    fetch('http://localhost:8001/api/v1/inventory/stats')
      .then(res => res.json())
      .then(data => {
        setStats({
          capacity_trees: data.total_capacity_trees || 0,
          sold_trees: data.total_sold_trees || 0,
          capacity_tons: data.total_capacity_tons || 0,
          sold_tons: data.total_sold_tons || 0
        });
      })
      .catch(err => console.error(err));
  }, []);

  const animatedCapTrees = useCountUp(stats.capacity_trees, 2500);
  const animatedSoldTrees = useCountUp(stats.sold_trees, 2500);
  const animatedCapTons = useCountUp(stats.capacity_tons, 2500);
  const animatedSoldTons = useCountUp(stats.sold_tons, 2500);

  return (
    <div className={styles.layout}>
      <main className="page-container slide-up">
        
        <header className={styles.intro}>
          <span className={styles.badge}>{t("transparencia.badge")}</span>
          <h1 className={styles.title}>{t("transparencia.title")}</h1>
          <p className={styles.subtitle}>
            {t("transparencia.subtitle")}
          </p>
        </header>

        <section className={styles.grid}>
          {/* Seccion 1: Eliminacion Huella Carbono */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle} style={{ marginBottom: '0.5rem' }}>{t("transparencia.sec1.title")}</h2>
            
            {/* Animated Inventory Graphic UI */}
            <div className={styles.chartCard}>
              
              {/* Graphic (Donut Chart) */}
              <div style={{ flex: '0 0 250px', position: 'relative', margin: '0 auto' }}>
                <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)', overflow: 'visible' }}>
                  <circle cx="50" cy="50" r="40" fill="none" stroke="var(--color-border)" strokeWidth="8" />
                  <circle 
                    cx="50" cy="50" r="40" 
                    fill="none" 
                    stroke="var(--color-accent)" 
                    strokeWidth="8" 
                    strokeDasharray={2 * Math.PI * 40} 
                    strokeDashoffset={(2 * Math.PI * 40) - ((stats.capacity_trees > 0 ? (animatedSoldTrees / stats.capacity_trees) : 0) * (2 * Math.PI * 40))} 
                    strokeLinecap="round" 
                    style={{ transition: 'stroke-dashoffset 0.1s linear' }} 
                  />
                </svg>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1, letterSpacing: '-0.02em', color: 'var(--color-foreground)' }}>
                    {((stats.capacity_trees > 0 ? (animatedSoldTrees / stats.capacity_trees) : 0) * 100).toFixed(1)}%
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-muted)', fontWeight: 600, letterSpacing: '0.1em', marginTop: '0.25rem' }}>{t("transparencia.sec1.assigned")}</span>
                </div>
              </div>

              {/* Layout de Datos */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.1em', color: 'var(--color-muted)', marginBottom: '1.5rem', textTransform: 'uppercase' }}>
                    {t("transparencia.sec1.capTitle")}
                  </div>
                  <div className={styles.dataGrid}>
                    <div>
                      <div style={{ fontSize: '2.5rem', fontWeight: 700, lineHeight: 1, color: 'var(--color-foreground)' }}>{animatedCapTrees.toLocaleString()}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-muted)', marginTop: '0.5rem' }}>{t("transparencia.sec1.capTrees")}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '2rem', fontWeight: 600, lineHeight: 1, color: 'var(--color-muted)' }}>{animatedCapTons.toLocaleString()}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-muted)', marginTop: '0.5rem' }}>{t("transparencia.sec1.capTons")}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.1em', color: 'var(--color-accent)', marginBottom: '1.5rem', textTransform: 'uppercase' }}>
                    {t("transparencia.sec1.impTitle")}
                  </div>
                  <div className={styles.dataGrid}>
                    <div>
                      <div style={{ fontSize: '2.5rem', fontWeight: 700, lineHeight: 1, color: 'var(--color-accent)' }}>{animatedSoldTrees.toLocaleString()}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-muted)', marginTop: '0.5rem' }}>{t("transparencia.sec1.impTrees")}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '2rem', fontWeight: 600, lineHeight: 1, color: 'var(--color-accent)' }}>{animatedSoldTons.toLocaleString()}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-muted)', marginTop: '0.5rem' }}>{t("transparencia.sec1.impTons")}</div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <div className={styles.contentRow}>
              <div className={styles.textContent}>
                <p className={styles.textBlock}>
                  {t("transparencia.sec1.p1")}
                </p>
                <p className={styles.textBlock}>
                  {t("transparencia.sec1.p2")}
                </p>
                <p className={styles.textBlock}>
                  {t("transparencia.sec1.p3")}
                </p>
              </div>
            </div>
          </div>

          {/* Seccion 2: La Calculadora */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>{t("transparencia.sec2.title")}</h2>
            <div className={styles.contentRow}>
              <div className={styles.textContent}>
                <p className={styles.textBlock}>
                  {t("transparencia.sec2.p1")}
                </p>
                <div className={styles.statGrid}>
                  <div className={styles.statBox}>
                    <div className={styles.statValue}>0.20 kg</div>
                    <div className={styles.statLabel}>{t("transparencia.sec2.stat1")}</div>
                  </div>
                  <div className={styles.statBox}>
                    <div className={styles.statValue}>250 kg</div>
                    <div className={styles.statLabel}>{t("transparencia.sec2.stat2")}</div>
                  </div>
                </div>
                <p className={styles.textBlock} style={{marginTop: '2rem'}}>
                  {t("transparencia.sec2.p2")}
                </p>

                <button 
                  className={styles.auditLink} 
                  onClick={() => setIsAuditModalOpen(true)}
                >
                  {t("transparencia.sec2.btn")}
                </button>
              </div>
            </div>
          </div>

          {/* Seccion 3: Empaque Base Zero Waste */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>{t("transparencia.sec3.title")}</h2>
            <div className={styles.contentRow}>
              <div className={styles.textContent}>
                <p className={styles.textBlock}>
                  {t("transparencia.sec3.p1")}
                </p>
                <p className={styles.textBlock}>
                  {t("transparencia.sec3.p2")}
                </p>
                <p className={styles.textBlock}>
                  {t("transparencia.sec3.p3")}
                </p>
              </div>
              <div className={styles.figure}>
                 <img src="https://images.unsplash.com/photo-1611080036665-248384218ebf?q=80&w=600" alt="Concepto referencial de Empaque Zero Waste" style={{width: '100%', height: 'auto', objectFit: 'cover'}} />
                 {/*  Nota: La imagen final provista por ti reemplazará esto */}
              </div>
            </div>
          </div>

        </section>
      </main>

      {/* Audit Modal Overlay */}
      {isAuditModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
               <div>
                 <h3 className={styles.modalTitle}>{t("transparencia.modal.title")}</h3>
                 <div className={styles.modalSubtitle}>{t("transparencia.modal.subtitle")}</div>
               </div>
               <button 
                 type="button" 
                 className={styles.closeBtn} 
                 onClick={() => setIsAuditModalOpen(false)}
               >
                 ×
               </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.auditSection}>
                <h4>{t("transparencia.modal.sec1")}</h4>
                <code className={styles.auditFormula}>T(e) = Base(país) + (V × C_car) + (F × C_flight) + (D)</code>
                <p style={{fontSize: '0.9rem', color: 'var(--color-muted)'}}>
                   {t("transparencia.modal.sec1.desc")}
                </p>
              </div>

              <div className={styles.auditSection}>
                <h4>{t("transparencia.modal.sec2")}</h4>
                <ul>
                  <li>
                    <strong>{t("transparencia.modal.sec2.v")}</strong>
                    <div style={{marginTop: '0.5rem', marginBottom: '0.5rem'}}>
                      Constante <code className={styles.auditConstant}>C_car = 0.20 kg / km</code>
                    </div>
                    <code className={styles.auditFormula}>V_anual = (Km × Semana) × 52 × 0.20</code>
                    <span className={styles.auditRef}>
                      {t("transparencia.modal.sec2.v.ref")}
                    </span>
                  </li>
                  <li>
                    <strong>{t("transparencia.modal.sec2.f")}</strong>
                    <div style={{marginTop: '0.5rem', marginBottom: '0.5rem'}}>
                      Constante <code className={styles.auditConstant}>C_flight = 250 kg / hr</code>
                    </div>
                    <code className={styles.auditFormula}>F_anual = Horas de vuelo × 250</code>
                    <span className={styles.auditRef}>
                      {t("transparencia.modal.sec2.f.ref")}
                    </span>
                  </li>
                  <li>
                    <strong>{t("transparencia.modal.sec2.d")}</strong>
                    <div style={{marginTop: '0.5rem', marginBottom: '0.5rem'}}>
                      <code className={styles.auditConstant}>Vegano = 0 kg</code> | <code className={styles.auditConstant}>Vegetariano = +400 kg</code> | <code className={styles.auditConstant}>Omnívoro = +1,000 kg</code>
                    </div>
                    <span className={styles.auditRef}>
                      {t("transparencia.modal.sec2.d.ref")}
                    </span>
                  </li>
                </ul>
              </div>

              <div className={styles.auditSection}>
                <h4>{t("transparencia.modal.sec3")}</h4>
                <p style={{fontSize: '0.9rem', color: 'var(--color-muted)', lineHeight: '1.6'}}>
                  {t("transparencia.modal.sec3.p")}
                </p>
                <div style={{marginTop: '0.5rem'}}>
                  {t("transparencia.modal.sec3.est")} <code className={styles.auditConstant}>~25 - 28.5 kg CO₂ / año / árbol maduro</code>
                </div>
                <span className={styles.auditRef} style={{marginTop: '1rem'}}>
                  {t("transparencia.modal.sec3.ref")}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
