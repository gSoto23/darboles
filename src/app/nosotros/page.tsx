"use client";

import React from 'react';
import styles from './Nosotros.module.css';

export default function Nosotros() {
  return (
    <div style={{ paddingTop: '100px', minHeight: '100vh', paddingBottom: '100px' }}>
      <main className="page-container fade-in">
        <div className={`slide-up ${styles.hero}`}>
          <div className={styles.badge}>Manifiesto Dárboles</div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', marginBottom: '1.5rem', letterSpacing: '-0.04em' }}>
            No plantamos árboles. <br/>
            <span style={{ color: 'var(--color-muted)' }}>Cultivamos infraestructura.</span>
          </h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
            Transformamos la conservación forestal en Costa Rica en un activo tecnológico medible, auditable y perpetuo mediante software para la Tierra.
          </p>
        </div>

        <section className={`slide-up ${styles.manifestoGrid}`}>
          <div className={styles.textArea}>
            <h2 className={styles.sectionTitle}>El Problema de la Ilusión Verde</h2>
            <p className={styles.sectionText}>
              Durante décadas, el mercado de bonos de carbono y la reforestación corporativa (greenwashing) se basaron en métricas opacas y certificados vacíos. Comprar "créditos" abstractos que no tienen un respaldo auditado geográficamente se convirtió en el estándar de una industria complaciente.
            </p>
            <p className={styles.sectionText}>
              Decidimos erradicar esa ilusión. Dárboles nace como el puente definitivo entre la frialdad de las matemáticas y la pureza de la selva latinoamericana.
            </p>
          </div>
          <div className={styles.imagePlaceholder}>
            <span style={{ zIndex: 1 }}>[ Fotografía de Finca / Costa Rica ]</span>
          </div>
        </section>

        <section className={`slide-up ${styles.manifestoGrid}`} style={{ marginTop: '8rem', direction: 'rtl' }}>
          <div className={styles.textArea} style={{ direction: 'ltr' }}>
            <h2 className={styles.sectionTitle}>Operatividad Radicalmente Transparente</h2>
            <p className={styles.sectionText}>
              Cada árbol que patrocinas no es un símbolo; es un organismo biológico registrado en nuestra base de datos, posicionado con coordenadas GPS exactas en las montañas de Costa Rica, uno de los ecosistemas más protegidos y densos del planeta.
            </p>
            <p className={styles.sectionText}>
              No somos una caridad, somos ingenieros y agrónomos operando bajo principios de rigor. Fusionamos monitoreo satelital temporal con contratos inteligentes locales para garantizar que tu inversión climática literalmente respire. 
            </p>
          </div>
          <div className={styles.imagePlaceholder}>
            <span style={{ zIndex: 1 }}>[ Fotografía de Dashboard Tecnológico ]</span>
          </div>
        </section>

        <div className={`slide-up ${styles.statsRow}`} style={{ marginTop: '8rem' }}>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>100%</span>
            <span className={styles.statLabel}>Transparencia Digital</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>25+</span>
            <span className={styles.statLabel}>Especies Nativas</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>CR</span>
            <span className={styles.statLabel}>Suelo Costarricense</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>GPS</span>
            <span className={styles.statLabel}>Trazabilidad Estricta</span>
          </div>
        </div>

      </main>
    </div>
  );
}
