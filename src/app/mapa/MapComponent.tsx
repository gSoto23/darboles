"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import { useTranslations } from '@/context/TranslationContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1";

type Layer = 'guardian' | 'tomato';
type TomatoStatus = 'sin_verificar' | 'vivo' | 'muerto' | 'reemplazado';

interface GuardianTree {
  id_code: string;
  species_name: string;
  species_scientific_name: string;
  origin: string;
  project_name: string | null;
  planted_at: string | null;
  latitude: number;
  longitude: number;
  planter_name: string | null;
  photo_url: string | null;
}

interface TomatoTree {
  id: number;
  lat: number;
  lng: number;
  status: TomatoStatus;
  species: string | null;
  sector: string | null;
  project: string;
  location_precision: 'sector' | 'tree';
}

// Forma y borde por origen, relleno por estado (solo TOMATO tiene estado verificado)
export const GUARDIAN_COLOR = '#16a34a';
export const TOMATO_BORDER = '#e4572e';
export const STATUS_FILL: Record<TomatoStatus, string> = {
  vivo: '#16a34a',
  sin_verificar: '#ffffff',
  muerto: '#9ca3af',
  reemplazado: '#9ca3af',
};

const escapeHtml = (value: unknown) =>
  String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

const dotIcon = (fill: string, border: string, borderWidth: number) => L.divIcon({
  className: 'darboles-dot',
  html: `<span style="display:block;width:16px;height:16px;border-radius:50%;background:${fill};border:${borderWidth}px solid ${border};box-shadow:0 1px 3px rgba(0,0,0,.35)"></span>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  popupAnchor: [0, -8],
});

const clusterIcon = (color: string) => (cluster: L.MarkerCluster) => {
  const n = cluster.getChildCount();
  const size = n < 10 ? 32 : n < 100 ? 38 : 46;
  return L.divIcon({
    className: 'darboles-cluster',
    html: `<span style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:50%;background:${color};color:#fff;font-weight:700;font-size:13px;border:3px solid rgba(255,255,255,.85);box-shadow:0 1px 4px rgba(0,0,0,.35)">${n}</span>`,
    iconSize: [size, size],
  });
};

function ClusterLayers({ guardians, tomato, visible }: { guardians: GuardianTree[]; tomato: TomatoTree[]; visible: Record<Layer, boolean> }) {
  const map = useMap();
  const { t, locale } = useTranslations();

  useEffect(() => {
    const formatDate = (iso: string | null) =>
      iso ? new Date(iso).toLocaleDateString(locale === 'en' ? 'en-US' : 'es-CR', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
    const groups: L.MarkerClusterGroup[] = [];
    // spiderfy: al abrir un grupo en el zoom máximo, separa los árboles que comparten coordenada
    const options = { showCoverageOnHover: false, spiderfyOnMaxZoom: true, maxClusterRadius: 45 };

    if (visible.guardian) {
      const group = L.markerClusterGroup({ ...options, iconCreateFunction: clusterIcon(GUARDIAN_COLOR) });
      guardians.forEach(tree => {
        const photo = tree.photo_url
          ? `<img src="${escapeHtml(tree.photo_url.startsWith('http') ? tree.photo_url : API_URL.replace('/api/v1', '') + tree.photo_url)}" alt="${escapeHtml(tree.species_name)}" style="width:100px;height:100px;object-fit:cover;border-radius:4px;margin-top:.5rem" loading="lazy" />`
          : '';
        const html = `<div style="text-align:center;min-width:160px">
          <span style="display:inline-block;font-size:.7rem;font-weight:600;color:#fff;background:${GUARDIAN_COLOR};border-radius:9999px;padding:.1rem .5rem;margin-bottom:.35rem">${escapeHtml(t('mapa.legend.guardian'))}</span><br/>
          <strong>${escapeHtml(tree.species_name)}</strong><br/>
          <em style="color:#666;font-size:.85rem">${escapeHtml(tree.species_scientific_name)}</em>
          ${tree.planter_name ? `<small style="display:block;margin-top:.5rem">${escapeHtml(t('mapa.popup.guardian'))} ${escapeHtml(tree.planter_name)}</small>` : ''}
          ${tree.planted_at ? `<small style="display:block">${escapeHtml(t('mapa.popup.planted'))} ${escapeHtml(formatDate(tree.planted_at))}</small>` : ''}
          ${photo}
        </div>`;
        group.addLayer(L.marker([tree.latitude, tree.longitude], { icon: dotIcon(GUARDIAN_COLOR, '#ffffff', 2) }).bindPopup(html));
      });
      groups.push(group);
    }

    if (visible.tomato) {
      const group = L.markerClusterGroup({ ...options, iconCreateFunction: clusterIcon(TOMATO_BORDER) });
      tomato.forEach(tree => {
        const html = `<div style="text-align:center;min-width:180px">
          <span style="display:inline-block;font-size:.7rem;font-weight:600;color:#fff;background:${TOMATO_BORDER};border-radius:9999px;padding:.1rem .5rem;margin-bottom:.35rem">${escapeHtml(t('mapa.legend.tomato'))}</span><br/>
          <strong>${escapeHtml(tree.species || t('tomato.unknownSpecies'))}</strong><br/>
          <small style="display:block;margin-top:.35rem">${escapeHtml(t(`tomato.status.${tree.status}`))}</small>
          <small style="display:block;color:#666">${escapeHtml(tree.project)}${tree.sector ? ' · ' + escapeHtml(tree.sector) : ''}</small>
          ${tree.location_precision === 'sector' ? `<small style="display:block;color:#666;font-style:italic">${escapeHtml(t('tomato.approxLocation'))}</small>` : ''}
          <a href="/mapa/tomato/${tree.id}" style="display:inline-block;margin-top:.6rem;font-weight:600;color:#0f172a">${escapeHtml(t('tomato.viewCard'))}</a>
        </div>`;
        group.addLayer(L.marker([tree.lat, tree.lng], { icon: dotIcon(STATUS_FILL[tree.status], TOMATO_BORDER, 3) }).bindPopup(html));
      });
      groups.push(group);
    }

    groups.forEach(g => map.addLayer(g));
    return () => { groups.forEach(g => map.removeLayer(g)); };
  }, [map, guardians, tomato, visible, t, locale]);

  return null;
}

async function getJson<T>(path: string): Promise<T[]> {
  try {
    const res = await fetch(`${API_URL}${path}`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error(err);
    return [];
  }
}

export default function MapComponent() {
  const { t } = useTranslations();
  const [guardians, setGuardians] = useState<GuardianTree[]>([]);
  const [tomato, setTomato] = useState<TomatoTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState<Record<Layer, boolean>>({ guardian: true, tomato: true });

  useEffect(() => {
    // Si una de las dos fuentes falla, el mapa igual muestra la otra
    Promise.all([getJson<GuardianTree>('/tracking/public/map'), getJson<TomatoTree>('/tomato/trees/map')])
      .then(([g, tm]) => {
        setGuardians(g);
        setTomato(tm);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>{t("mapa.loading")}</div>;

  const counts: Record<Layer, number> = { guardian: guardians.length, tomato: tomato.length };
  const swatch = (layer: Layer) => layer === 'guardian'
    ? { background: GUARDIAN_COLOR, border: '2px solid #fff' }
    : { background: '#fff', border: `3px solid ${TOMATO_BORDER}` };

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center', marginBottom: '0.75rem' }}>
        {(['guardian', 'tomato'] as Layer[]).map(layer => (
          <button
            key={layer}
            type="button"
            aria-pressed={visible[layer]}
            onClick={() => setVisible(v => ({ ...v, [layer]: !v[layer] }))}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '9999px', border: '1px solid var(--color-border)', background: visible[layer] ? 'var(--color-surface)' : 'transparent', opacity: visible[layer] ? 1 : 0.5, cursor: 'pointer', fontSize: '0.9rem', color: 'var(--color-foreground)' }}
          >
            <span style={{ width: '14px', height: '14px', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 0 1px rgba(0,0,0,.15)', ...swatch(layer) }} />
            {t(`mapa.legend.${layer}`)} ({counts[layer]})
          </button>
        ))}
      </div>

      {visible.tomato && counts.tomato > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--color-muted)' }}>
          {(['vivo', 'sin_verificar', 'muerto'] as TomatoStatus[]).map(status => (
            <span key={status} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: STATUS_FILL[status], border: `3px solid ${TOMATO_BORDER}`, display: 'inline-block' }} />
              {t(`tomato.status.${status}`)}
            </span>
          ))}
        </div>
      )}

      <div style={{ height: '600px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--color-border)', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}>
        <MapContainer center={[9.7489, -83.7534]} zoom={8} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClusterLayers guardians={guardians} tomato={tomato} visible={visible} />
        </MapContainer>
      </div>
    </div>
  );
}
