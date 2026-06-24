"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '../login/auth.module.css';
import toast from 'react-hot-toast';
import { useTranslations } from '@/context/TranslationContext';

export default function SignupPage() {
  const { t } = useTranslations();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1"}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, full_name: fullName })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Error al crear la cuenta');
      }

      toast.success('Cuenta creada exitosamente. Por favor, inicia sesión.');
      router.push('/login');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={`${styles.authCard} slide-up`}>
        <div className={styles.brand}>Dárboles</div>
        <h1 className={styles.title}>Crear Cuenta</h1>
        <p className={styles.subtitle}>Únete al ecosistema de reconexión ambiental</p>

        <form onSubmit={handleSignup}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Nombre Completo</label>
            <input 
              type="text" 
              className={styles.input} 
              placeholder="Tu nombre"
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
          
          <button type="submit" className={styles.submitBtn} disabled={loading} style={{ marginTop: '1.5rem' }}>
            {loading ? 'Creando cuenta...' : 'Registrarme'}
          </button>
        </form>

        <Link href="/login" className={styles.switchLink}>
          ¿Ya tienes cuenta? <span>{t("auth.login.btn")}</span>
        </Link>
      </div>
    </div>
  );
}
