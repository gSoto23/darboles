"use client";

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from '@/context/TranslationContext';

// estado lo pone el backend al volver de Tilopay (routers/payments.py → tilopay_callback)
const STATES = {
  pagado: { key: 'ok', icon: '🌳', color: '#16a34a' },
  pendiente: { key: 'pending', icon: '⏳', color: '#b45309' },
  verificando: { key: 'review', icon: '🔎', color: '#b45309' },
  fallido: { key: 'failed', icon: '✕', color: '#b91c1c' },
  'no-encontrado': { key: 'notfound', icon: '?', color: '#475569' },
} as const;

export default function PagoResultadoClient() {
  const { t } = useTranslations();
  const params = useSearchParams();
  const estado = (params.get('estado') || 'no-encontrado') as keyof typeof STATES;
  const state = STATES[estado] ?? STATES['no-encontrado'];
  const ref = params.get('ref');

  return (
    <main style={{ maxWidth: '620px', margin: '0 auto', padding: '140px 1rem 100px 1rem', textAlign: 'center' }}>
      <div aria-hidden="true" style={{ fontSize: '3.5rem', color: state.color, marginBottom: '1rem' }}>{state.icon}</div>
      <h1 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.4rem)', marginBottom: '1rem', letterSpacing: '-0.02em' }}>{t(`pago.${state.key}.title`)}</h1>
      <p style={{ color: 'var(--color-muted)', fontSize: '1.1rem', lineHeight: 1.6 }}>{t(`pago.${state.key}.body`)}</p>
      {ref && <p style={{ marginTop: '1.25rem', fontSize: '0.9rem', color: 'var(--color-muted)' }}>{t('pago.ref')} <strong style={{ fontFamily: 'monospace' }}>{ref}</strong></p>}
      <div style={{ marginTop: '2rem', display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link href="/regalos" style={{ padding: '0.85rem 1.4rem', borderRadius: '9999px', background: 'var(--color-foreground)', color: 'var(--color-background)', fontWeight: 600, textDecoration: 'none' }}>
          {t('pago.toStore')}
        </Link>
        {estado !== 'pagado' && (
          <a href={`https://wa.me/50670808613${ref ? `?text=${encodeURIComponent(`Hola, mi referencia de pago es ${ref}`)}` : ''}`} target="_blank" rel="noopener noreferrer"
            style={{ padding: '0.85rem 1.4rem', borderRadius: '9999px', border: '1px solid var(--color-border)', color: 'var(--color-foreground)', fontWeight: 600, textDecoration: 'none' }}>
            {t('pago.whatsapp')}
          </a>
        )}
      </div>
    </main>
  );
}
