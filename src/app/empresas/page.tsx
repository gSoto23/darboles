import React from 'react';
import Link from 'next/link';
import styles from './Empresas.module.css';

export default function Empresas() {
  return (
    <div style={{ paddingTop: '100px', minHeight: '100vh', paddingBottom: '100px' }}>
      <main className="page-container fade-in">
        
        <div className={`slide-up ${styles.hero}`}>
          <div className={styles.badge}>Dárboles Corporativo</div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', marginBottom: '1.5rem', letterSpacing: '-0.04em' }}>
            Cumplimiento ESG <br/>
            <span style={{ color: 'var(--color-muted)' }}>inteligente y sin fricciones.</span>
          </h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '1.25rem', maxWidth: '650px', margin: '0 auto', lineHeight: '1.6' }}>
            Conectamos directamente tu cadena de emisiones con la tierra. Ofrecemos a las empresas un ecosistema auditable para reportes de sostenibilidad y programas de lealtad sin la burocracia tradicional.
          </p>
        </div>

        <section className={`slide-up ${styles.grid}`}>
          
          <div className={styles.card}>
            <div className={styles.cardIcon}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-foreground)' }}>
                <path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4" />
                <polyline points="14 2 14 8 20 8" />
                <path d="m3 15 2 2-2 2" />
                <path d="m7 19h4" />
              </svg>
            </div>
            <h3 className={styles.cardTitle}>Emisiones vía API</h3>
            <p className={styles.cardText}>
              Evita cálculos manuales. Integra nuestra API en tu ERP, ecosistema de e-commerce o software logístico para neutralizar las emisiones de CO2 de cada transacción o paquete enviado, fondeando árboles en tiempo real.
            </p>
          </div>

          <div className={styles.card}>
            <div className={styles.cardIcon}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-foreground)' }}>
                <line x1="18" x2="18" y1="20" y2="10" />
                <line x1="12" x2="12" y1="20" y2="4" />
                <line x1="6" x2="6" y1="20" y2="14" />
                <rect width="20" height="20" x="2" y="2" rx="2" />
              </svg>
            </div>
            <h3 className={styles.cardTitle}>Documentación ESG</h3>
            <p className={styles.cardText}>
              Accede a un dashboard corporativo con la fotometría satelital, coordenadas GPS y biometría exacta de tu bosque corporativo. Genera reportes listos para tus auditorías de Gobernanza Ambiental y Social mes a mes.
            </p>
          </div>

          <div className={styles.card}>
            <div className={styles.cardIcon}>
               <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-foreground)' }}>
                 <polyline points="20 12 20 22 4 22 4 12" />
                 <rect width="20" height="5" x="2" y="7" />
                 <line x1="12" x2="12" y1="22" y2="7" />
                 <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                 <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
               </svg>
            </div>
            <h3 className={styles.cardTitle}>Employee Gifting</h3>
            <p className={styles.cardText}>
              Reemplaza los bonos genéricos con impacto real. Financiamos campañas masivas para asignar la tutela de árboles a tus empleados con certificados PDF personalizados, fortaleciendo el sentido de propósito interno.
            </p>
          </div>

        </section>

        <section className={`slide-up ${styles.ctaSection}`}>
          <h2 className={styles.ctaTitle}>Descarboniza tu operativa hoy</h2>
          <p className={styles.ctaText}>
            Deja atrás los créditos opacos. Agenda una sesión técnica con nuestro equipo y descubre cómo podemos estructurar una red de compensación diseñada a la medida de los flujos de tu empresa.
          </p>
          <Link href="/contacto" className={styles.ctaButton}>
            Contactar a un Asesor
          </Link>
        </section>

      </main>
    </div>
  );
}
