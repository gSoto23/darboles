"use client";

import Image from 'next/image';
import { useTranslations } from '@/context/TranslationContext';

export default function Loader() {
  const { t } = useTranslations();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--color-background)' }}>
      <div style={{ animation: 'treePulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
        <img src="/logo.png" alt="Cargando..." width={200} height={48} style={{ objectFit: 'contain' }} />
      </div>
      <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem', letterSpacing: '0.05em', fontWeight: 500, animation: 'treePulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>{t("loader.text")}</p>
    </div>
  );
}
