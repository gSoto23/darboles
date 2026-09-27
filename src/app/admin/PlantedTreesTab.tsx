"use client";

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import SmartTable from '@/components/SmartTable';
import type { LatLng } from '@/components/LocationPicker';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1";

const LocationPicker = dynamic(() => import('@/components/LocationPicker'), {
  ssr: false,
  loading: () => <div style={{ height: '320px', background: 'var(--color-background)', borderRadius: '8px' }} />,
});

type Origin = 'guardian' | 'tomato';

interface PlantedTree {
  id: number;
  id_code: string;
  species_name: string;
  origin: Origin;
  project_name: string | null;
  planter_name: string | null;
  planter_email: string | null;
  planted_at: string | null;
  latitude: number | null;
  longitude: number | null;
  gift_id: number | null;
}

interface SpeciesOption {
  id: number;
  name: string;
}

const ORIGIN_LABEL: Record<Origin, string> = { guardian: 'Guardián', tomato: 'Proyecto TOMATO' };
const ORIGIN_COLOR: Record<Origin, string> = { guardian: '#16a34a', tomato: '#e4572e' };

const CSV_TEMPLATE = "especie;latitud;longitud;fecha_siembra;proyecto;origen;responsable\nCas;10.0162;-84.2116;2026-06-01;Reforestación Municipalidad de Alajuela;tomato;Cuadrilla TOMATO\n";

const inputStyle = { width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-foreground)' };
const labelStyle = { display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--color-muted)' };

const emptyForm = {
  mode: 'new' as 'new' | 'existing',
  id_code: '',
  species_id: '',
  origin: 'tomato' as Origin,
  project_name: '',
  planter_name: '',
  planter_email: '',
  planted_on: '',
  photo_url: '',
};

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function readApiError(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data.detail === 'string') return data.detail;
    if (Array.isArray(data.detail)) return data.detail.map((d: { msg: string }) => d.msg.replace(/^Value error, /, '')).join('. ');
  } catch {}
  return fallback;
}

export default function PlantedTreesTab() {
  const [rows, setRows] = useState<PlantedTree[]>([]);
  const [species, setSpecies] = useState<SpeciesOption[]>([]);
  const [originFilter, setOriginFilter] = useState<'' | Origin>('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [location, setLocation] = useState<LatLng | null>(null);
  const [coordText, setCoordText] = useState({ lat: '', lng: '' });
  const [saving, setSaving] = useState(false);
  const [csvErrors, setCsvErrors] = useState<{ fila: number; error: string }[]>([]);
  const [importing, setImporting] = useState(false);

  const fetchRows = () => {
    const params = new URLSearchParams({ tree_status: 'planted' });
    if (originFilter) params.set('origin', originFilter);
    fetch(`${API_URL}/admin/tracking?${params}`, { headers: authHeaders() })
      .then(res => res.ok ? res.json() : [])
      .then(setRows)
      .catch(err => console.error(err));
  };

  useEffect(fetchRows, [originFilter]);

  useEffect(() => {
    fetch(`${API_URL}/admin/trees`)
      .then(res => res.json())
      .then((data: SpeciesOption[]) => setSpecies(data))
      .catch(err => console.error(err));
  }, []);

  // El mapa y los campos de coordenadas se sincronizan en ambos sentidos
  const handleMapPick = (value: LatLng) => {
    setLocation(value);
    setCoordText({ lat: value.lat.toFixed(6), lng: value.lng.toFixed(6) });
  };

  const handleCoordText = (field: 'lat' | 'lng', text: string) => {
    const next = { ...coordText, [field]: text };
    setCoordText(next);
    const lat = parseFloat(next.lat.replace(',', '.'));
    const lng = parseFloat(next.lng.replace(',', '.'));
    setLocation(!isNaN(lat) && !isNaN(lng) ? { lat, lng } : null);
  };

  const resetForm = () => {
    setForm(emptyForm);
    setLocation(null);
    setCoordText({ lat: '', lng: '' });
    setShowForm(false);
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_URL}/tracking/upload-image`, { method: 'POST', body: formData });
    if (!res.ok) {
      toast.error(await readApiError(res, 'No se pudo subir la foto'));
      e.target.value = '';
      return;
    }
    const data = await res.json();
    setForm(f => ({ ...f, photo_url: data.image_url }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location) {
      toast.error('Marca la ubicación en el mapa');
      return;
    }
    setSaving(true);
    const body = {
      id_code: form.mode === 'existing' ? form.id_code : null,
      species_id: form.mode === 'new' ? Number(form.species_id) : null,
      origin: form.mode === 'existing' ? 'guardian' : form.origin,
      project_name: form.project_name || null,
      planter_name: form.planter_name || null,
      planter_email: form.planter_email || null,
      latitude: location.lat,
      longitude: location.lng,
      planted_on: form.planted_on || null,
      photo_url: form.photo_url || null,
    };
    const res = await fetch(`${API_URL}/admin/tracking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(await readApiError(res, 'No se pudo registrar el árbol'));
      return;
    }
    const created: PlantedTree = await res.json();
    toast.success(`Árbol ${created.id_code} registrado en el mapa`);
    resetForm();
    fetchRows();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setCsvErrors([]);
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_URL}/admin/tracking/import`, { method: 'POST', headers: authHeaders(), body: formData });
    setImporting(false);
    e.target.value = '';
    if (!res.ok) {
      toast.error(await readApiError(res, 'No se pudo leer el archivo'));
      return;
    }
    const result: { imported: number; errors: { fila: number; error: string }[] } = await res.json();
    if (result.errors.length) {
      setCsvErrors(result.errors);
      toast.error('El archivo tiene errores; no se cargó ninguna fila');
      return;
    }
    toast.success(`${result.imported} árboles cargados`);
    fetchRows();
  };

  const handleRemove = async (row: PlantedTree) => {
    const message = row.gift_id
      ? `¿Quitar ${row.id_code} del mapa? El código vuelve a quedar sin registrar para que su Guardián pueda registrarlo de nuevo.`
      : `¿Eliminar ${row.id_code}? Esta acción no se puede deshacer.`;
    if (!confirm(message)) return;
    const res = await fetch(`${API_URL}/admin/tracking/${row.id}`, { method: 'DELETE', headers: authHeaders() });
    if (!res.ok) {
      toast.error(await readApiError(res, 'No se pudo quitar el árbol'));
      return;
    }
    toast.success('Árbol quitado del mapa');
    fetchRows();
  };

  const templateHref = `data:text/csv;charset=utf-8,${encodeURIComponent(CSV_TEMPLATE)}`;

  return (
    <div className="slide-up">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
        <button onClick={() => setShowForm(s => !s)} style={{ padding: '0.75rem 1.25rem', borderRadius: '8px', border: 'none', background: 'var(--color-foreground)', color: 'var(--color-background)', fontWeight: 600, cursor: 'pointer' }}>
          {showForm ? 'Cerrar formulario' : '+ Registrar árbol sembrado'}
        </button>
        <label style={{ padding: '0.75rem 1.25rem', borderRadius: '8px', border: '1px solid var(--color-border)', cursor: importing ? 'wait' : 'pointer', fontWeight: 500 }}>
          {importing ? 'Importando…' : 'Importar CSV'}
          <input type="file" accept=".csv,text/csv" onChange={handleImport} disabled={importing} style={{ display: 'none' }} />
        </label>
        <a href={templateHref} download="plantilla_arboles_sembrados.csv" style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>Descargar plantilla CSV</a>
        <select value={originFilter} onChange={e => setOriginFilter(e.target.value as '' | Origin)} style={{ ...inputStyle, width: 'auto', marginLeft: 'auto' }}>
          <option value="">Todos los orígenes</option>
          <option value="guardian">Guardianes</option>
          <option value="tomato">Proyectos TOMATO</option>
        </select>
      </div>

      {csvErrors.length > 0 && (
        <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          <strong>No se cargó ninguna fila. Corrige estos errores y vuelve a subir el archivo:</strong>
          <ul style={{ margin: '0.5rem 0 0 1.25rem' }}>
            {csvErrors.map(err => <li key={err.fila}>Fila {err.fila}: {err.error}</li>)}
          </ul>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem', display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', cursor: 'pointer' }}>
              <input type="radio" checked={form.mode === 'new'} onChange={() => setForm(f => ({ ...f, mode: 'new' }))} />
              Árbol nuevo (proyecto o sin código)
            </label>
            <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', cursor: 'pointer' }}>
              <input type="radio" checked={form.mode === 'existing'} onChange={() => setForm(f => ({ ...f, mode: 'existing' }))} />
              Registrar un código de regalo en nombre del Guardián
            </label>
          </div>

          {form.mode === 'existing' ? (
            <div>
              <label style={labelStyle}>Código del certificado</label>
              <input required value={form.id_code} onChange={e => setForm(f => ({ ...f, id_code: e.target.value.toUpperCase() }))} placeholder="DAR-A1B2C3" style={inputStyle} />
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Especie</label>
                <select required value={form.species_id} onChange={e => setForm(f => ({ ...f, species_id: e.target.value }))} style={inputStyle}>
                  <option value="">Seleccionar…</option>
                  {species.map(sp => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Origen</label>
                <select value={form.origin} onChange={e => setForm(f => ({ ...f, origin: e.target.value as Origin }))} style={inputStyle}>
                  <option value="tomato">Proyecto ejecutado por TOMATO</option>
                  <option value="guardian">Guardián (persona)</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Proyecto {form.origin === 'tomato' ? '' : '(opcional)'}</label>
                <input required={form.origin === 'tomato'} value={form.project_name} onChange={e => setForm(f => ({ ...f, project_name: e.target.value }))} placeholder="Reforestación Municipalidad de…" style={inputStyle} />
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>{form.mode === 'existing' || form.origin === 'guardian' ? 'Nombre del Guardián' : 'Responsable (opcional)'}</label>
              <input required={form.mode === 'existing'} value={form.planter_name} onChange={e => setForm(f => ({ ...f, planter_name: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Correo (opcional, no se publica)</label>
              <input type="email" value={form.planter_email} onChange={e => setForm(f => ({ ...f, planter_email: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Fecha de siembra</label>
              <input type="date" value={form.planted_on} onChange={e => setForm(f => ({ ...f, planted_on: e.target.value }))} style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Ubicación: toca el mapa, arrastra el marcador o escribe las coordenadas</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.75rem' }}>
              <input inputMode="decimal" placeholder="Latitud (ej. 9.9281)" aria-label="Latitud" value={coordText.lat} onChange={e => handleCoordText('lat', e.target.value)} style={inputStyle} />
              <input inputMode="decimal" placeholder="Longitud (ej. -84.0907)" aria-label="Longitud" value={coordText.lng} onChange={e => handleCoordText('lng', e.target.value)} style={inputStyle} />
            </div>
            <LocationPicker value={location} onChange={handleMapPick} />
          </div>

          <div>
            <label style={labelStyle}>Foto (opcional)</label>
            {form.photo_url ? (
              <span style={{ fontSize: '0.9rem' }}>✓ Foto cargada <button type="button" onClick={() => setForm(f => ({ ...f, photo_url: '' }))} style={{ background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', color: 'var(--color-muted)' }}>quitar</button></span>
            ) : (
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhoto} />
            )}
          </div>

          <button type="submit" disabled={saving} style={{ padding: '1rem', borderRadius: '8px', border: 'none', background: 'var(--color-foreground)', color: 'var(--color-background)', fontWeight: 600, cursor: 'pointer' }}>
            {saving ? 'Guardando…' : 'Guardar en el mapa'}
          </button>
        </form>
      )}

      <SmartTable
        data={rows}
        pageSize={15}
        emptyMessage="Todavía no hay árboles sembrados"
        columns={[
          { key: 'id_code', label: 'Código', render: (row: PlantedTree) => <span style={{ fontFamily: 'monospace' }}>{row.id_code}</span> },
          { key: 'species_name', label: 'Especie' },
          { key: 'origin', label: 'Origen', render: (row: PlantedTree) => <span style={{ color: ORIGIN_COLOR[row.origin] || 'inherit', fontWeight: 600 }}>{ORIGIN_LABEL[row.origin] || row.origin}</span> },
          { key: 'project_name', label: 'Proyecto / Guardián', render: (row: PlantedTree) => row.project_name || row.planter_name || '—' },
          { key: 'planted_at', label: 'Siembra', render: (row: PlantedTree) => row.planted_at ? new Date(row.planted_at).toLocaleDateString('es-CR') : '—' },
          { key: 'latitude', label: 'Coordenadas', render: (row: PlantedTree) => row.latitude != null && row.longitude != null ? <a href={`https://www.openstreetmap.org/?mlat=${row.latitude}&mlon=${row.longitude}#map=17/${row.latitude}/${row.longitude}`} target="_blank" rel="noreferrer">{row.latitude.toFixed(5)}, {row.longitude.toFixed(5)}</a> : '—' },
          { key: 'actions', label: 'Acciones', render: (row: PlantedTree) => <button onClick={() => handleRemove(row)} style={{ background: 'transparent', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', textDecoration: 'underline' }}>{row.gift_id ? 'Quitar del mapa' : 'Eliminar'}</button> },
        ]}
      />
    </div>
  );
}
