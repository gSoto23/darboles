"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../page.module.css';

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  // Evita Hydration mismatch
  if (!mounted) return null;

  return (
    <div style={{ paddingTop: '100px', minHeight: '100vh', backgroundColor: 'var(--color-background)' }}>
      <main className={`page-container slide-up`}>
        <div style={{ marginBottom: '3rem', marginTop: '2rem' }}>
          <div className={styles.badge}>Portal Segurizado (JWT)</div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', letterSpacing: '-0.02em', color: 'var(--color-foreground)' }}>
            Mi Panel Net-Zero
          </h1>
          <p className={styles.subtitle} style={{ marginLeft: 0 }}>
            Bienvenido a tu centro de monitoreo de impacto. Desde aquí rastrearemos el crecimiento de los árboles que apadrinas.
          </p>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div className="glass" style={{ padding: '2rem', borderRadius: 'var(--radius-md)' }}>
            <h3 style={{ marginBottom: '1rem' }}>Tus Árboles (0)</h3>
            <p style={{ color: 'var(--color-muted)' }}>Aún no tienes suscripciones activas.</p>
            <button className={`${styles.btnAction}`} style={{ marginTop: '2rem', padding: '0.75rem 1.5rem', background: 'var(--color-foreground)', color: 'var(--color-background)', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer' }}>Explorar Suscripciones</button>
          </div>
          
          <div className="glass" style={{ padding: '2rem', borderRadius: 'var(--radius-md)' }}>
            <h3 style={{ marginBottom: '1rem' }}>Impacto Acumulado</h3>
            <div style={{ fontSize: '3rem', fontWeight: 600, color: 'var(--color-foreground)', lineHeight: 1 }}>0kg</div>
            <p style={{ color: 'var(--color-muted)', marginTop: '0.5rem' }}>CO2 mitigado mediante nuestra red forestal en Costa Rica.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
