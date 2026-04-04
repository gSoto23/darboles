"use client";

import Link from 'next/link';
import styles from './Footer.module.css';
import { useTranslations } from '@/context/TranslationContext';

export default function Footer() {
  const { t } = useTranslations();
  return (
    <footer className={styles.footer}>
      <div className={styles.content}>
        <div>
          <div className={styles.brand}>{t("home.badge")}</div>
          <p className={styles.desc}>{t("footer.desc")}</p>
        </div>
        <div className={styles.links}>
          <div className={styles.linkGroup}>
            <span className={styles.linkTitle}>{t("footer.platform")}</span>
            <Link href="/suscripciones" className={styles.link}>{t("footer.netzero")}</Link>
            <Link href="/regalos" className={styles.link}>{t("footer.store")}</Link>
            <Link href="/empresas" className={styles.link}>{t("footer.b2b")}</Link>
          </div>
          <div className={styles.linkGroup}>
            <span className={styles.linkTitle}>{t("footer.company")}</span>
            <Link href="/nosotros" className={styles.link}>{t("footer.philosophy")}</Link>
            <Link href="/transparencia" className={styles.link}>{t("footer.impact")}</Link>
            <Link href="/contacto" className={styles.link}>{t("footer.contact")}</Link>
          </div>
          <div className={styles.linkGroup}>
            <span className={styles.linkTitle}>{t("footer.legal")}</span>
            <Link href="/privacidad" className={styles.link}>{t("footer.privacy")}</Link>
            <Link href="/terminos" className={styles.link}>{t("footer.terms")}</Link>
          </div>
        </div>
      </div>
      <div className={styles.copy}>
        &copy; {new Date().getFullYear()} {t("home.badge")}. {t("footer.rights")}
      </div>
    </footer>
  );
}
