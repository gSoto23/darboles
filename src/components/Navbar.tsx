"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './Navbar.module.css';
import { useTranslations } from '@/context/TranslationContext';

export default function Navbar() {
  const router = useRouter();
  const { t, locale, setLocale } = useTranslations();
  const [sessionUser, setSessionUser] = useState<{ is_admin: boolean; is_superadmin: boolean } | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Escucha eventos o checkea on load
    const checkUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await fetch('http://localhost:8001/api/v1/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSessionUser({ is_admin: data.is_admin, is_superadmin: data.is_superadmin });
        }
      } catch (e) {
        console.error(e);
      }
    };
    checkUser();

    // We can listen to a custom event if we want immediate updates from login page
    const onAuthChange = () => checkUser();
    window.addEventListener('auth_change', onAuthChange);
    return () => window.removeEventListener('auth_change', onAuthChange);
  }, []);

  // Close mobile menu on route change implicitly or when links are clicked
  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setSessionUser(null);
    setIsMobileMenuOpen(false);
    router.push('/login');
  };

  return (
    <header className={styles.navContainer}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.brand} style={{ display: 'flex', alignItems: 'center' }} onClick={handleLinkClick}>
          <img src="/logo.png" alt="Dárboles Logo" width={120} height={32} style={{ objectFit: 'contain' }} />
        </Link>

        {/* Hamburger Button (Mobile only) */}
        <button
          className={styles.hamburgerBtn}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          )}
        </button>

        {/* Desktop Links & Mobile Dropdown */}
        <div className={`${styles.links} ${isMobileMenuOpen ? styles.mobileOpen : ''}`}>
          <Link href="/regalos" className={styles.link} onClick={handleLinkClick}>{t("navbar.store")}</Link>
          <Link href="/suscripciones" className={styles.link} onClick={handleLinkClick}>{t("navbar.netzero")}</Link>
          <Link href="/transparencia" className={styles.link} onClick={handleLinkClick}>{t("navbar.transparency")}</Link>

          <button 
            onClick={() => {
              const newLocale = locale === 'es' ? 'en' : 'es';
              setLocale(newLocale);
            }}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--color-muted-light)', 
              cursor: 'pointer', 
              fontWeight: 400, 
              fontSize: '0.85rem',
              marginLeft: '0.5rem',
              transition: 'color 0.2s ease',
              opacity: 0.8
            }}
            onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-foreground)'}
            onMouseOut={(e) => e.currentTarget.style.color = 'var(--color-muted-light)'}
          >
            {t("navbar.langToggle")}
          </button>

          {sessionUser ? (
            <div className={styles.authGroup}>
              <Link href={sessionUser.is_admin ? "/admin" : "/dashboard"} className={styles.cta} style={{ background: 'transparent', border: '1px solid var(--color-foreground)', color: 'var(--color-foreground)' }} onClick={handleLinkClick}>
                {sessionUser.is_admin ? t("navbar.admin") : t("navbar.impact")}
              </Link>
              <button
                onClick={handleLogout}
                className={styles.logoutBtn}
                title="Cerrar Sesión"
              >
                <div style={{ display: 'none' }} className="mobileLogoutText">Cerrar Sesión</div>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </button>
            </div>
          ) : (
            <Link href="/login" className={styles.cta} onClick={handleLinkClick}>{t("navbar.signin")}</Link>
          )}
        </div>
      </nav>
    </header>
  );
}
