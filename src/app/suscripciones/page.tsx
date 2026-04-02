import Calculator from '../components/Calculator';
import styles from '../page.module.css';

export default function SuscripcionesPage() {
  return (
    <div style={{ paddingTop: '100px', minHeight: '100vh' }}>
      <main className={`page-container slide-up`}>
        <div style={{ textAlign: 'center', marginBottom: '4rem', marginTop: '4rem' }}>
          <div className={styles.badge}>Mercado Global</div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', marginBottom: '1rem', letterSpacing: '-0.04em' }}>
            Compensa tu existencia.
          </h1>
          <p className={styles.subtitle}>
            Conoce el peso ecológico de tu estilo de vida y permítenos neutralizarlo. Nuestro motor calculará tu impacto y asignará los recursos exactos a nuestra red de fincas en Costa Rica.
          </p>
        </div>
        
        <Calculator />
      </main>
    </div>
  );
}
