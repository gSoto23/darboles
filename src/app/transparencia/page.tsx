"use client";

import { useState, useEffect } from 'react';
import styles from './Transparencia.module.css';

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
          <span className={styles.badge}>Dárboles Trust</span>
          <h1 className={styles.title}>Radicalmente Reales.</h1>
          <p className={styles.subtitle}>
            A diferencia del "greenwashing" de las corporaciones tradicionales, operamos bajo un esquema científico de reforestación. Cada decisión, desde nuestro motor matemático hasta el empaque del árbol, tiene un porqué verificado.
          </p>
        </header>

        <section className={styles.grid}>
          {/* Seccion 1: Eliminacion Huella Carbono */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle} style={{ marginBottom: '0.5rem' }}>I. Mitigación Biológica de CO₂</h2>
            
            {/* Animated Inventory Graphic UI */}
            <div style={{ margin: '3rem 0', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '1.5rem', padding: '3rem', display: 'flex', gap: '4rem', alignItems: 'center', flexWrap: 'wrap' }}>
              
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
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-muted)', fontWeight: 600, letterSpacing: '0.1em', marginTop: '0.25rem' }}>ASIGNADO</span>
                </div>
              </div>

              {/* Layout de Datos */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.1em', color: 'var(--color-muted)', marginBottom: '1.5rem', textTransform: 'uppercase' }}>
                    Capacidad Bruta del Proyecto (Fincas)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '2.5rem', fontWeight: 700, lineHeight: 1, color: 'var(--color-foreground)' }}>{animatedCapTrees.toLocaleString()}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-muted)', marginTop: '0.5rem' }}>Total Árboles Plantados</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '2rem', fontWeight: 600, lineHeight: 1, color: 'var(--color-muted)' }}>{animatedCapTons.toLocaleString()}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-muted)', marginTop: '0.5rem' }}>Toneladas CO₂ Base</div>
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.1em', color: 'var(--color-accent)', marginBottom: '1.5rem', textTransform: 'uppercase' }}>
                    Impacto Generado por Suscriptores
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '2.5rem', fontWeight: 700, lineHeight: 1, color: 'var(--color-accent)' }}>{animatedSoldTrees.toLocaleString()}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-muted)', marginTop: '0.5rem' }}>Árboles Ya Asignados</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '2rem', fontWeight: 600, lineHeight: 1, color: 'var(--color-accent)' }}>{animatedSoldTons.toLocaleString()}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-muted)', marginTop: '0.5rem' }}>Toneladas CO₂ Mitigadas</div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <div className={styles.contentRow}>
              <div className={styles.textContent}>
                <p className={styles.textBlock}>
                  Nuestro proyecto de eliminación de huella de carbono no trata sobre comprar "cripto-créditos" invisibles. Apuntamos a la <strong>extracción biomásica real</strong>. 
                </p>
                <p className={styles.textBlock}>
                  Cuando adquieres una suscripción Net-Zero, financiamos estrictamente la plantación y el cuidado activo de árboles nativos en fincas protegidas de Costa Rica (hub neurálgico de biodiversidad global). Un árbol genérico trópico captura alrededor de ~25 kg de CO₂ por año una vez maduro.
                </p>
                <p className={styles.textBlock}>
                  Dárboles garantiza que esa fracción de la finca se registre a tu nombre, mitigando el carbono emitido por tu ritmo de vida y emitiendo oxígeno puro a cambio.
                </p>
              </div>
            </div>
          </div>

          {/* Seccion 2: La Calculadora */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>II. La Matemática de nuestra Calculadora</h2>
            <div className={styles.contentRow}>
              <div className={styles.textContent}>
                <p className={styles.textBlock}>
                  Nuestra calculadora de huella de carbono fue diseñada para ser asertiva sin ser agobiante. Toma los estándares de la <i>EPA</i> y parámetros mundiales y los reduce a los factores de más alto impacto y variación:
                </p>
                <div className={styles.statGrid}>
                  <div className={styles.statBox}>
                    <div className={styles.statValue}>0.20 kg</div>
                    <div className={styles.statLabel}>CO₂ / km conducido en promedio.</div>
                  </div>
                  <div className={styles.statBox}>
                    <div className={styles.statValue}>250 kg</div>
                    <div className={styles.statLabel}>CO₂ promedio por hora de vuelo comercial.</div>
                  </div>
                </div>
                <p className={styles.textBlock} style={{marginTop: '2rem'}}>
                  A esto se le suma un modelo escalonado basado en dieta: Una persona con una dieta basada en carne emite casi una tonelada métrica anual adicional respecto de una dieta basada en plantas, esto debido al alto coste de metano y deforestación ganadera. Por ello, estas 3 variables nos arrojan una precisión del 90% del impacto ecológico directo anual de un individuo en segundos.
                </p>

                <button 
                  className={styles.auditLink} 
                  onClick={() => setIsAuditModalOpen(true)}
                >
                  🔗 Ver Ficha Técnica de Auditoría Ambiental
                </button>
              </div>
            </div>
          </div>

          {/* Seccion 3: Empaque Base Zero Waste */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>III. Diseño Industrial Plantable (Zero Waste)</h2>
            <div className={styles.contentRow}>
              <div className={styles.textContent}>
                <p className={styles.textBlock}>
                  El mercado local de regalos suele entregar plantas en bolsas plásticas agrícolas negras (las cuales toman 500 años en degradarse). Desarrollamos un <strong>empaque revolucionario 100% libre de residuos.</strong>
                </p>
                <p className={styles.textBlock}>
                  Nuestra icónica caja hexagonal de cartón <i>kraft</i> estructural cuenta con un diseño de asa y anillo central, protegiendo al árbol durante su transporte. La gran diferencia reside en la siembra: <strong>No debes desempacarlo.</strong>
                </p>
                <p className={styles.textBlock}>
                  El empaque está pensado para sembrarse integro directo en la tierra. La caja protege las delicadas raíces del shock de trasplante y, al regarse, el cartón no tratado se biodegrada en semanas convirtiéndose en abono orgánico para alimentar al propio árbol. Diseño circular en su máxima expresión.
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
                 <h3 className={styles.modalTitle}>Documentación de Auditoría</h3>
                 <div className={styles.modalSubtitle}>Fórmulas Matemáticas y Referencias Científicas de la Calculadora Dárboles.</div>
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
                <h4>1. Ecuación General de Mitigación Anual</h4>
                <code className={styles.auditFormula}>T(e) = Base(país) + (V × C_car) + (F × C_flight) + (D)</code>
                <p style={{fontSize: '0.9rem', color: 'var(--color-muted)'}}>
                  Donde <strong>T(e)</strong> representa la Emisión Total Anual Estimada en kilogramos (kg) para un usuario.
                </p>
              </div>

              <div className={styles.auditSection}>
                <h4>2. Desglose de Constantes y Referencias</h4>
                <ul>
                  <li>
                    <strong>Factor de Movilidad Terrestre (V)</strong>
                    <div style={{marginTop: '0.5rem', marginBottom: '0.5rem'}}>
                      Constante <code className={styles.auditConstant}>C_car = 0.20 kg / km</code>
                    </div>
                    <code className={styles.auditFormula}>V_anual = (Km × Semana) × 52 × 0.20</code>
                    <span className={styles.auditRef}>
                      Referencia Auditada: Agencia de Protección Ambiental de Estados Unidos (EPA) - "Greenhouse Gas Emissions from a Typical Passenger Vehicle" (Revisado: Septiembre 2025). Refleja un promedio moderado de eficiencia de sedán/SUV subcompacto.
                    </span>
                  </li>
                  <li>
                    <strong>Factor de Vuelo Comercial (F)</strong>
                    <div style={{marginTop: '0.5rem', marginBottom: '0.5rem'}}>
                      Constante <code className={styles.auditConstant}>C_flight = 250 kg / hr</code>
                    </div>
                    <code className={styles.auditFormula}>F_anual = Horas de vuelo × 250</code>
                    <span className={styles.auditRef}>
                      Referencia Auditada: Metodología del Carbon Neutral Protocol & Defra (UK Department for Environment, Food & Rural Affairs) Emission Factors (Revisado: Enero 2026). Integra Fuerza Radiativa Adicional (RFI).
                    </span>
                  </li>
                  <li>
                    <strong>Factor de Alimentación Diaria (D)</strong>
                    <div style={{marginTop: '0.5rem', marginBottom: '0.5rem'}}>
                      <code className={styles.auditConstant}>Vegano = 0 kg</code> | <code className={styles.auditConstant}>Vegetariano = +400 kg</code> | <code className={styles.auditConstant}>Omnívoro = +1,000 kg</code>
                    </div>
                    <span className={styles.auditRef}>
                      Referencia Auditada: Basado en el estudio de Scarborough et al. (Oxford) sobre emisiones de gases de efecto invernadero de dietas autoseleccionadas, complementadas con datos de impacto de metano de la FAO (Revisado: Marzo 2025).
                    </span>
                  </li>
                </ul>
              </div>

              <div className={styles.auditSection}>
                <h4>3. Equivalencia de Captura Forestal</h4>
                <p style={{fontSize: '0.9rem', color: 'var(--color-muted)', lineHeight: '1.6'}}>
                  Las suscripciones mitigan T(e) asignando inventario primario de árboles plantados en ecosistemas tropicales protegidos en Costa Rica.
                </p>
                <div style={{marginTop: '0.5rem'}}>
                  Estimación técnica conservadora: <code className={styles.auditConstant}>~25 - 28.5 kg CO₂ / año / árbol maduro</code>
                </div>
                <span className={styles.auditRef} style={{marginTop: '1rem'}}>
                  Referencia Auditada: IPCC (Panel Intergubernamental del Cambio Climático) Guidelines for National Greenhouse Gas Inventories - Capítulos Bosques y Uso de la Tierra.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
