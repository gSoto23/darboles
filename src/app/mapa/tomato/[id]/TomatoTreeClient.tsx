"use client";

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useTranslations } from '@/context/TranslationContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1";

const MiniMap = dynamic(() => import('./MiniMap'), { ssr: false, loading: () => <div style={{ height: '220px', background: 'var(--color-surface)', borderRadius: '12px' }} /> });

type Status = 'sin_verificar' | 'vivo' | 'muerto' | 'reemplazado';

interface Photo { url: string; width: number | null; height: number | null; }
interface Visit { id: number; date: string; status: Status; height_cm: number | null; public_comment: string | null; photos: Photo[]; }
interface Tree {
  id: number;
  lat: number;
  lng: number;
  status: Status;
  species: string | null;
  sector: string | null;
  project: string;
  location_precision: 'sector' | 'tree';
  tree_number: number | null;
  planted_year: number | null;
  last_checked_at: string | null;
  replaced_by: { id: number; species: string | null } | null;
  visits: Visit[];
}

const STATUS_STYLE: Record<Status, { bg: string; fg: string }> = {
  vivo: { bg: '#dcfce7', fg: '#166534' },
  sin_verificar: { bg: '#f1f5f9', fg: '#475569' },
  muerto: { bg: '#e5e7eb', fg: '#374151' },
  reemplazado: { bg: '#e5e7eb', fg: '#374151' },
};

function StatusBadge({ status }: { status: Status }) {
  const { t } = useTranslations();
  const s = STATUS_STYLE[status];
  return <span style={{ display: 'inline-block', padding: '0.2rem 0.65rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 600, background: s.bg, color: s.fg }}>{t(`tomato.status.${status}`)}</span>;
}

export default function TomatoTreeClient({ id }: { id: number }) {
  const { t, locale } = useTranslations();
  const [tree, setTree] = useState<Tree | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'notfound' | 'error'>('loading');
  const [lightbox, setLightbox] = useState<{ photos: Photo[]; index: number } | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/tomato/trees/${id}`)
      .then(async res => {
        if (res.status === 404) return setState('notfound');
        if (!res.ok) return setState('error');
        setTree(await res.json());
        setState('ok');
      })
      .catch(() => setState('error'));
  }, [id]);

  const closeLightbox = useCallback(() => setLightbox(null), []);
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') setLightbox(l => l && { ...l, index: (l.index + 1) % l.photos.length });
      if (e.key === 'ArrowLeft') setLightbox(l => l && { ...l, index: (l.index - 1 + l.photos.length) % l.photos.length });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, closeLightbox]);

  const formatDate = (iso: string) =>
    new Date(`${iso}T12:00:00`).toLocaleDateString(locale === 'en' ? 'en-US' : 'es-CR', { year: 'numeric', month: 'long', day: 'numeric' });

  const container = { maxWidth: '860px', margin: '0 auto', padding: '110px 1rem 100px 1rem' };
  const backLink = <Link href="/mapa" style={{ color: 'var(--color-muted)', textDecoration: 'none', fontSize: '0.9rem' }}>← {t('tomato.backToMap')}</Link>;

  if (state !== 'ok' || !tree) {
    return (
      <main style={container}>
        {backLink}
        <p style={{ marginTop: '2rem', color: 'var(--color-muted)' }}>
          {state === 'loading' ? t('tomato.loading') : state === 'notfound' ? t('tomato.notFound') : t('tomato.loadError')}
        </p>
      </main>
    );
  }

  const facts: [string, string][] = [
    [t('tomato.project'), tree.project],
    ...(tree.sector ? [[t('tomato.sector'), tree.sector] as [string, string]] : []),
    ...(tree.tree_number != null ? [[t('tomato.treeNumber'), `#${tree.tree_number}`] as [string, string]] : []),
    ...(tree.planted_year ? [[t('tomato.plantedYear'), String(tree.planted_year)] as [string, string]] : []),
    ...(tree.last_checked_at ? [[t('tomato.lastChecked'), formatDate(tree.last_checked_at)] as [string, string]] : []),
  ];

  return (
    <main style={container}>
      {backLink}

      <header style={{ marginTop: '1.5rem' }}>
        <span style={{ display: 'inline-block', fontSize: '0.75rem', fontWeight: 600, color: '#fff', background: '#e4572e', borderRadius: '9999px', padding: '0.2rem 0.65rem' }}>{t('mapa.legend.tomato')}</span>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 2.75rem)', margin: '0.75rem 0 0.5rem 0', letterSpacing: '-0.03em' }}>{tree.species || t('tomato.unknownSpecies')}</h1>
        <StatusBadge status={tree.status} />
      </header>

      {tree.status === 'reemplazado' && tree.replaced_by && (
        <div style={{ marginTop: '1.5rem', padding: '1rem 1.25rem', borderRadius: '12px', background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          {t('tomato.replacedBy')}{' '}
          <Link href={`/mapa/tomato/${tree.replaced_by.id}`} style={{ fontWeight: 600, color: 'var(--color-foreground)' }}>
            {tree.replaced_by.species || t('tomato.unknownSpecies')} →
          </Link>
        </div>
      )}

      <section style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        <dl style={{ margin: 0, display: 'grid', gap: '0.9rem' }}>
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt style={{ fontSize: '0.8rem', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</dt>
              <dd style={{ margin: '0.15rem 0 0 0', fontWeight: 500 }}>{value}</dd>
            </div>
          ))}
          {tree.planted_year && <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-muted)' }}>{t('tomato.plantedYearNote')}</p>}
        </dl>
        <div>
          <MiniMap lat={tree.lat} lng={tree.lng} />
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: 'var(--color-muted)' }}>
            {tree.location_precision === 'sector' ? t('tomato.approxLocation') : t('tomato.exactLocation')}
          </p>
        </div>
      </section>

      {tree.visits.length > 0 && (
        <section style={{ marginTop: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.25rem' }}>{t('tomato.visitsTitle')}</h2>
          <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '1.25rem' }}>
            {tree.visits.map(visit => (
              <li key={visit.id} style={{ padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}>
                  <strong>{formatDate(visit.date)}</strong>
                  <StatusBadge status={visit.status} />
                  {visit.height_cm != null && <span style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>{t('tomato.height', { cm: Math.round(visit.height_cm) })}</span>}
                </div>
                {visit.public_comment && <p style={{ margin: '0.75rem 0 0 0', lineHeight: 1.6 }}>{visit.public_comment}</p>}
                {visit.photos.length > 0 && (
                  <div style={{ marginTop: '0.9rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.5rem' }}>
                    {visit.photos.map((photo, i) => (
                      <button key={photo.url} type="button" onClick={() => setLightbox({ photos: visit.photos, index: i })} aria-label={t('tomato.openPhoto', { n: i + 1 })}
                        style={{ padding: 0, border: 'none', background: 'none', cursor: 'zoom-in', borderRadius: '8px', overflow: 'hidden' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element -- fotos alojadas en tomatocr.com */}
                        <img src={photo.url} alt={t('tomato.photoAlt', { date: formatDate(visit.date), n: i + 1 })} loading="lazy" decoding="async"
                          width={photo.width ?? undefined} height={photo.height ?? undefined}
                          style={{ width: '100%', height: 'auto', aspectRatio: '4 / 3', objectFit: 'cover', display: 'block', background: 'var(--color-border)' }} />
                      </button>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      <p style={{ marginTop: '3rem', fontSize: '0.85rem', color: 'var(--color-muted)' }}>{t('tomato.source')}</p>

      {lightbox && (
        <div role="dialog" aria-modal="true" onClick={closeLightbox}
          style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- foto ampliada */}
          <img src={lightbox.photos[lightbox.index].url} alt="" onClick={e => e.stopPropagation()}
            style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '8px', objectFit: 'contain' }} />
          <button type="button" onClick={closeLightbox} aria-label={t('tomato.close')}
            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: '9999px', width: '44px', height: '44px', fontSize: '1.4rem', cursor: 'pointer' }}>×</button>
          {lightbox.photos.length > 1 && (
            <div style={{ position: 'absolute', bottom: '1.25rem', color: '#fff', fontSize: '0.9rem' }}>{lightbox.index + 1} / {lightbox.photos.length}</div>
          )}
        </div>
      )}
    </main>
  );
}
