"use client";

import dynamic from 'next/dynamic';
import { useTranslations } from '@/context/TranslationContext';

const MapComponent = dynamic(() => import('./MapComponent'), { ssr: false, loading: () => <div style={{ height: '600px', width: '100%', background: '#f1f5f9', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Cargando mapa en tiempo real...</div> });

export default function MapaClient() {
  const { t } = useTranslations();

  return (
    <main className="page-container slide-up" style={{ paddingTop: '120px', paddingBottom: '100px' }}>
      <header style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <span style={{ display: 'inline-block', background: 'var(--color-accent)', color: 'white', padding: '0.35rem 0.85rem', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1.5rem' }}>{t("mapa.badge")}</span>
        <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', marginBottom: '1rem', letterSpacing: '-0.04em' }}>{t("mapa.title")}</h1>
        <p style={{ color: 'var(--color-muted)', fontSize: '1.15rem', maxWidth: '700px', margin: '0 auto', lineHeight: 1.6 }}>
          {t("mapa.desc")}
        </p>
      </header>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 1rem' }}>
        <MapComponent />
      </div>
    </main>
  );
}
