"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './auth.module.css';
import toast from 'react-hot-toast';
import { useTranslations } from '@/context/TranslationContext';

export default function LoginPage() {
  const { t } = useTranslations();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const res = await fetch('http://localhost:8001/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        throw new Error('Credenciales inválidas');
      }

      const data = await res.json();
      localStorage.setItem('token', data.access_token);
      toast.success('Sesión iniciada exitosamente');
      
      window.dispatchEvent(new Event('auth_change'));
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={`${styles.authCard} slide-up`}>
        <div className={styles.brand}>Dárboles</div>
        <h1 className={styles.title}>{t("auth.login.title")}</h1>
        <p className={styles.subtitle}>{t("auth.login.sub")}</p>

        <form onSubmit={handleLogin}>
          <div className={styles.formGroup}>
            <label className={styles.label}>{t("auth.login.email")}</label>
            <input 
              type="email" 
              className={styles.input} 
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>{t("auth.login.pass")}</label>
            <input 
              type="password" 
              className={styles.input} 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          <div style={{ textAlign: 'right', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
            <a href="/recuperar" style={{ fontSize: '0.875rem', color: 'var(--color-muted)', textDecoration: 'none' }}>{t("auth.login.forgot")}</a>
          </div>
          <button type="submit" className={styles.submitBtn}>{t("auth.login.btn")}</button>
        </form>

        <Link href="/registro" className={styles.switchLink}>
          {t("auth.login.no_acc")} <span>{t("auth.login.register")}</span>
        </Link>
      </div>
    </div>
  );
}
