import Link from 'next/link';
import styles from './Navbar.module.css';

export default function Navbar() {
  return (
    <header className={styles.navContainer}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.brand}>
          Dárboles
        </Link>
        <div className={styles.links}>
          <Link href="/regalos" className={styles.link}>Mercado Local</Link>
          <Link href="/suscripciones" className={styles.link}>Net-Zero Global</Link>
          <Link href="/transparencia" className={styles.link}>Transparencia</Link>
          <Link href="/login" className={styles.cta}>Iniciar Sesión</Link>
        </div>
      </nav>
    </header>
  );
}
