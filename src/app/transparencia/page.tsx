import styles from './Transparencia.module.css';

export default function TransparenciaPage() {
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
            <h2 className={styles.sectionTitle}>I. Mitigación Biológica de CO₂</h2>
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
    </div>
  );
}
