import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
  return (
    <div className={styles.heroContainer}>
      <main className={`page-container slide-up`}>
        <div className={styles.badge}>Dárboles</div>
        <h1 className={styles.title}>
          Siembra un legado, cultiva impacto real.
        </h1>
        <p className={styles.subtitle}>
          Diseñamos una infraestructura transparente de compensación. Ya sea regalando un árbol a un ser querido o neutralizando tu huella global.
        </p>
      </main>

      <div className={`page-container ${styles.optionsGrid} slide-up`} style={{ animationDelay: '0.15s' }}>
        {/* Flujo A: Costa Rica */}
        <Link href="/regalos" className={`${styles.card} glass`}>
          <span className={styles.cardTag}>Regala un Arbol</span>
          <h2 className={styles.cardTitle}>Regala Propósito</h2>
          <p className={styles.cardDesc}>
            Un árbol nativo en empaque "Zero Waste" industrial. Diseñado para nutrir la tierra directamente.
          </p>
          <span className={styles.cardAction}>
            Explorar catálogo
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8.14645 3.14645C8.34171 2.95118 8.65829 2.95118 8.85355 3.14645L12.8536 7.14645C13.0488 7.34171 13.0488 7.65829 12.8536 7.85355L8.85355 11.8536C8.65829 12.0488 8.34171 12.0488 8.14645 11.8536C7.95118 11.6583 7.95118 11.3417 8.14645 11.1464L11.2929 8H2.5C2.22386 8 2 7.77614 2 7.5C2 7.22386 2.22386 7 2.5 7H11.2929L8.14645 3.85355C7.95118 3.65829 7.95118 3.34171 8.14645 3.14645Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
            </svg>
          </span>
        </Link>

        {/* Flujo B: Internacional */}
        <Link href="/suscripciones" className={`${styles.card} glass`}>
          <span className={styles.cardTag}>Huella CO2</span>
          <h2 className={styles.cardTitle}>Suscripción Net-Zero</h2>
          <p className={styles.cardDesc}>
            Calcula exactamente tu impacto de CO2 y delégalo a nuestros bosques certificados con tracking por placa física.
          </p>
          <span className={styles.cardAction}>
            Calcular huella
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8.14645 3.14645C8.34171 2.95118 8.65829 2.95118 8.85355 3.14645L12.8536 7.14645C13.0488 7.34171 13.0488 7.65829 12.8536 7.85355L8.85355 11.8536C8.65829 12.0488 8.34171 12.0488 8.14645 11.8536C7.95118 11.6583 7.95118 11.3417 8.14645 11.1464L11.2929 8H2.5C2.22386 8 2 7.77614 2 7.5C2 7.22386 2.22386 7 2.5 7H11.2929L8.14645 3.85355C7.95118 3.65829 7.95118 3.34171 8.14645 3.14645Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
            </svg>
          </span>
        </Link>
      </div>
    </div>
  );
}
