"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslations } from '@/context/TranslationContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1";

type Origin = 'guardian' | 'tomato';

interface MapTree {
  id_code: string;
  species_name: string;
  species_scientific_name: string;
  origin: Origin;
  project_name: string | null;
  planted_at: string | null;
  latitude: number;
  longitude: number;
  planter_name: string | null;
  photo_url: string | null;
}

const ORIGIN_COLORS: Record<Origin, string> = {
  guardian: '#16a34a',
  tomato: '#e4572e',
};

export default function MapComponent() {
  const { t, locale } = useTranslations();
  const [trees, setTrees] = useState<MapTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState<Record<Origin, boolean>>({ guardian: true, tomato: true });

  useEffect(() => {
    fetch(`${API_URL}/tracking/public/map`)
      .then(res => res.json())
      .then(data => {
        setTrees(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>{t("mapa.loading")}</div>;

  const counts: Record<Origin, number> = {
    guardian: trees.filter(tr => tr.origin !== 'tomato').length,
    tomato: trees.filter(tr => tr.origin === 'tomato').length,
  };
  const formatDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString(locale === 'en' ? 'en-US' : 'es-CR', { year: 'numeric', month: 'short', day: 'numeric' }) : null;

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center', marginBottom: '1rem' }}>
        {(['guardian', 'tomato'] as Origin[]).map(origin => (
          <button
            key={origin}
            type="button"
            aria-pressed={visible[origin]}
            onClick={() => setVisible(v => ({ ...v, [origin]: !v[origin] }))}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '9999px', border: '1px solid var(--color-border)', background: visible[origin] ? 'var(--color-surface)' : 'transparent', opacity: visible[origin] ? 1 : 0.5, cursor: 'pointer', fontSize: '0.9rem', color: 'var(--color-foreground)' }}
          >
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: ORIGIN_COLORS[origin], display: 'inline-block' }} />
            {t(`mapa.legend.${origin}`)} ({counts[origin]})
          </button>
        ))}
      </div>

      <div style={{ height: '600px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--color-border)', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}>
        <MapContainer center={[9.7489, -83.7534]} zoom={8} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {trees.map(tree => {
            const origin: Origin = tree.origin === 'tomato' ? 'tomato' : 'guardian';
            if (!visible[origin]) return null;
            return (
              <CircleMarker
                key={tree.id_code}
                center={[tree.latitude, tree.longitude]}
                radius={8}
                pathOptions={{ color: '#ffffff', weight: 2, fillColor: ORIGIN_COLORS[origin], fillOpacity: 0.9 }}
              >
                <Popup>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ display: 'inline-block', fontSize: '0.7rem', fontWeight: 600, color: 'white', background: ORIGIN_COLORS[origin], borderRadius: '9999px', padding: '0.1rem 0.5rem', marginBottom: '0.35rem' }}>
                      {t(`mapa.legend.${origin}`)}
                    </span><br />
                    <strong>{tree.species_name}</strong><br />
                    <em style={{ color: '#666', fontSize: '0.85rem' }}>{tree.species_scientific_name}</em>
                    {origin === 'tomato' && tree.project_name && (
                      <small style={{ display: 'block', marginTop: '0.5rem' }}>{t("mapa.popup.project")} {tree.project_name}</small>
                    )}
                    {origin === 'guardian' && tree.planter_name && (
                      <small style={{ display: 'block', marginTop: '0.5rem' }}>{t("mapa.popup.guardian")} {tree.planter_name}</small>
                    )}
                    {tree.planted_at && (
                      <small style={{ display: 'block' }}>{t("mapa.popup.planted")} {formatDate(tree.planted_at)}</small>
                    )}
                    {tree.photo_url && (
                      <img src={tree.photo_url.startsWith('http') ? tree.photo_url : API_URL.replace('/api/v1', '') + tree.photo_url} alt={tree.species_name} style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px', marginTop: '0.5rem' }} />
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
