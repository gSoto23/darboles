"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '../login/auth.module.css'; // Reutilizamos los estilos del login
import { useTranslations } from '@/context/TranslationContext';

export default function RegisterPage() {
  const { t } = useTranslations();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const res = await fetch('http://localhost:8001/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, full_name: fullName })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Error al registrar la cuenta');
      }

      // Automatically redirect to login after successful registration
      router.push('/login');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={`${styles.authCard} slide-up`}>
        <div className={styles.brand}>Dárboles</div>
        <h1 className={styles.title}>{t("auth.reg.title")}</h1>
        <p className={styles.subtitle}>{t("auth.reg.sub")}</p>
        
        {error && <div className={styles.errorMsg}>{error}</div>}

        <form onSubmit={handleRegister}>
          <div className={styles.formGroup}>
            <label className={styles.label}>{t("auth.reg.name")}</label>
            <input 
              type="text" 
              className={styles.input} 
              placeholder="Juan Pérez"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required 
            />
          </div>
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
              minLength={6}
            />
          </div>
          <button type="submit" className={styles.submitBtn}>{t("auth.reg.btn")}</button>
        </form>

        <Link href="/login" className={styles.switchLink}>
          {t("auth.reg.has_acc")} <span>{t("auth.reg.login")}</span>
        </Link>
      </div>
    </div>
  );
}
