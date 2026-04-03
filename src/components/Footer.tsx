import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.content}>
        <div>
          <div className={styles.brand}>Dárboles</div>
          <p className={styles.desc}>
            Infraestructura tecnológica para la reconexión y compensación ambiental global.
          </p>
        </div>
        <div className={styles.links}>
          <div className={styles.linkGroup}>
            <span className={styles.linkTitle}>Plataforma</span>
            <Link href="/suscripciones" className={styles.link}>Net-Zero CO2</Link>
            <Link href="/regalos" className={styles.link}>Tienda de Arboles</Link>
            <Link href="/empresas" className={styles.link}>Soluciones B2B</Link>
          </div>
          <div className={styles.linkGroup}>
            <span className={styles.linkTitle}>Compañía</span>
            <Link href="/nosotros" className={styles.link}>Filosofía</Link>
            <Link href="/transparencia" className={styles.link}>Reportes de Impacto</Link>
            <Link href="/contacto" className={styles.link}>Contacto</Link>
          </div>
        </div>
      </div>
      <div className={styles.copy}>
        &copy; {new Date().getFullYear()} Dárboles. Todos los derechos reservados.
      </div>
    </footer>
  );
}
