"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from '../login/auth.module.css';
import { useTranslations } from '@/context/TranslationContext';

function RecuperarContent() {
  const { t } = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // MODO 1: Enviar correo de recuperación
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:8001/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Error al solicitar el enlace');
      
      setSuccess(data.message);
      setEmail('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // MODO 2: Cambiar la contraseña usando el Token
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:8001/api/v1/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token, new_password: newPassword })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Token inválido o expirado');
      
      setSuccess("¡Contraseña restablecida! Redirigiendo al login...");
      setTimeout(() => router.push('/login'), 2500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={`${styles.authCard} fade-in`}>
        <div className={styles.brand}>Dárboles</div>
        <div className={styles.header}>
          <h1 className={styles.title}>
            {token ? t("auth.recup.title1") : t("auth.recup.title2")}
          </h1>
          <p className={styles.subtitle}>
            {token ? t("auth.recup.sub1") : t("auth.recup.sub2")}
          </p>
        </div>

        {error && <div style={{ color: '#E53E3E', background: '#FED7D7', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}
        {success && <div style={{ color: '#2F855A', background: '#C6F6D5', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.875rem' }}>{success}</div>}

        {!token ? (
          /* PANTALLA SOLICITAR EMAIL */
          <form onSubmit={handleRequestReset}>
            <div className={styles.formGroup}>
              <label className={styles.label}>{t("auth.login.email")}</label>
              <input 
                type="email" 
                className={styles.input} 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                placeholder="ejemplo@darboles.com"
              />
            </div>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? "..." : t("auth.recup.btn1")}
            </button>
            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <a href="/login" style={{ fontSize: '0.875rem', color: 'var(--color-muted)', textDecoration: 'none' }}>{t("auth.recup.back")}</a>
            </div>
          </form>
        ) : (
          /* PANTALLA EXCLUSIVA PARA CAMBIAR PASSWORD */
          <form onSubmit={handleResetPassword}>
            <div className={styles.formGroup}>
              <label className={styles.label}>{t("auth.recup.newpass")}</label>
              <input 
                type="password" 
                className={styles.input} 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required 
                placeholder="Mínimo 8 caracteres"
                minLength={8}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>{t("auth.recup.confpass")}</label>
              <input 
                type="password" 
                className={styles.input} 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required 
                placeholder="Repite tu contraseña"
              />
            </div>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? "..." : t("auth.recup.btn2")}
            </button>
          </form>
        )}
        
      </div>
    </div>
  );
}

export default function RecuperarPage() {
  return (
    <Suspense fallback={<div>Cargando protocolo de seguridad...</div>}>
      <RecuperarContent />
    </Suspense>
  );
}
