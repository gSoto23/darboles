"use client";

import { useState, Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useTranslations } from '@/context/TranslationContext';
import imageCompression from 'browser-image-compression';
import type { LatLng } from '@/components/LocationPicker';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1";

const LocationPicker = dynamic(() => import('@/components/LocationPicker'), {
  ssr: false,
  loading: () => <div style={{ height: '320px', background: '#f1f5f9', borderRadius: '8px' }} />,
});

interface TreeInfo {
  species_name: string;
  species_scientific_name: string;
  status: string;
}

// FastAPI devuelve `detail` como texto o como lista de errores de validación;
// para los campos conocidos mostramos un mensaje propio en vez del texto técnico de Pydantic
async function readApiError(res: Response, fallback: string, fieldMessages: Record<string, string> = {}): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data.detail === 'string') return data.detail;
    if (Array.isArray(data.detail) && data.detail.length) {
      return data.detail.map((d: { msg: string; loc?: string[] }) => {
        const field = d.loc?.[d.loc.length - 1];
        return (field && fieldMessages[field]) || d.msg.replace(/^Value error, /, '');
      }).join('. ');
    }
  } catch {}
  return fallback;
}

// Misma caja que valida el backend (Costa Rica continental e Isla del Coco)
const isInCostaRica = ({ lat, lng }: LatLng) => lat >= 5.0 && lat <= 11.5 && lng >= -87.5 && lng <= -82.4;

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const inputStyle = { width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--color-border)', outline: 'none' };
const labelStyle = { display: 'block', marginBottom: '0.5rem', fontWeight: 500 };

function RegistroForm() {
  const { t } = useTranslations();
  const searchParams = useSearchParams();
  const initialId = searchParams.get('id') || '';

  const [idCode, setIdCode] = useState(initialId.toUpperCase());
  const [step, setStep] = useState<'validate' | 'enroll' | 'success'>('validate');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [treeInfo, setTreeInfo] = useState<TreeInfo | null>(null);

  const [planterName, setPlanterName] = useState('');
  const [planterEmail, setPlanterEmail] = useState('');
  const [plantedOn, setPlantedOn] = useState(todayISO());
  const [location, setLocation] = useState<LatLng | null>(null);
  const [photoUrl, setPhotoUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isCapturingGPS, setIsCapturingGPS] = useState(false);

  const validateCode = async (rawCode: string) => {
    const code = rawCode.trim().toUpperCase().replace(/\s+/g, '');
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/tracking/${encodeURIComponent(code)}`);
      if (!res.ok) throw new Error(await readApiError(res, t("reg.errors.invalidCode")));
      const data: TreeInfo = await res.json();
      if (data.status !== 'unregistered') throw new Error(t("reg.errors.alreadyRegistered"));
      setIdCode(code);
      setTreeInfo(data);
      setStep('enroll');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialId && step === 'validate') {
      validateCode(initialId);
    }
  }, [initialId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    validateCode(idCode);
  };

  const captureGPS = () => {
    if (!("geolocation" in navigator)) {
      setError(t("reg.errors.gpsUnsupported"));
      return;
    }
    setIsCapturingGPS(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setIsCapturingGPS(false);
      },
      (gpsError) => {
        console.error("GPS Error:", gpsError);
        setError(t("reg.errors.gpsDenied"));
        setIsCapturingGPS(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    let file = e.target.files[0];
    setIsUploading(true);
    setError('');

    try {
      file = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true });
    } catch (compressionError) {
      console.error("Error comprimiendo imagen:", compressionError);
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_URL}/tracking/upload-image`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error(await readApiError(res, t("reg.errors.photo")));
      const data = await res.json();
      setPhotoUrl(data.image_url);
    } catch (err) {
      setError((err as Error).message);
      e.target.value = '';
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location) {
      setError(t("reg.errors.noLocation"));
      return;
    }
    if (!isInCostaRica(location)) {
      setError(t("reg.errors.outsideCR"));
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/tracking/${encodeURIComponent(idCode)}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planter_name: planterName,
          planter_email: planterEmail,
          latitude: location.lat,
          longitude: location.lng,
          planted_on: plantedOn || null,
          photo_url: photoUrl || null
        })
      });
      if (!res.ok) throw new Error(await readApiError(res, t("reg.errors.save"), {
        planter_email: t("reg.errors.email"),
        planter_name: t("reg.errors.name"),
        planted_on: t("reg.errors.date"),
        longitude: t("reg.errors.outsideCR"),
      }));
      setStep('success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const outsideCR = !!location && !isInCostaRica(location);

  const errorBox = error && <div role="alert" style={{ color: '#b91c1c', background: '#fef2f2', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', paddingTop: '100px', paddingBottom: '100px', paddingLeft: '1rem', paddingRight: '1rem' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', textAlign: 'center' }}>{t("reg.title")}</h1>

      {step === 'validate' && (
        <div style={{ background: 'var(--color-surface)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          <p style={{ color: 'var(--color-muted)', marginBottom: '2rem', textAlign: 'center' }}>
            {t("reg.validate.intro")}
          </p>
          <form onSubmit={handleValidate}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="idCode" style={labelStyle}>{t("reg.validate.label")}</label>
              <input
                id="idCode"
                type="text"
                value={idCode}
                onChange={e => setIdCode(e.target.value.toUpperCase())}
                placeholder="DAR-A1B2C3"
                autoCapitalize="characters"
                autoComplete="off"
                required
                style={{ width: '100%', padding: '1rem', fontSize: '1.25rem', textAlign: 'center', letterSpacing: '2px', borderRadius: '8px', border: '1px solid var(--color-border)', outline: 'none' }}
              />
            </div>
            {errorBox}
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '1rem', background: 'var(--color-foreground)', color: 'var(--color-background)', borderRadius: '8px', fontWeight: 600, fontSize: '1.1rem', cursor: 'pointer', border: 'none' }}>
              {loading ? t("reg.validate.loading") : t("reg.validate.btn")}
            </button>
          </form>
        </div>
      )}

      {step === 'enroll' && (
        <div style={{ background: 'var(--color-surface)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', border: '1px dashed #cbd5e1' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>{t("reg.enroll.greeting", { species: treeInfo?.species_name || '' })}</h3>
            <p style={{ margin: '0.5rem 0 0 0', color: '#64748b', fontStyle: 'italic' }}>{treeInfo?.species_scientific_name}</p>
            <p style={{ margin: '0.5rem 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>{t("reg.enroll.code")} {idCode}</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="planterName" style={labelStyle}>{t("reg.enroll.name")}</label>
              <input id="planterName" type="text" required minLength={2} maxLength={120} value={planterName} onChange={e => setPlanterName(e.target.value)} style={inputStyle} placeholder={t("reg.enroll.namePh")} />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="planterEmail" style={labelStyle}>{t("reg.enroll.email")}</label>
              <input id="planterEmail" type="email" required value={planterEmail} onChange={e => setPlanterEmail(e.target.value)} style={inputStyle} placeholder={t("reg.enroll.emailPh")} />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="plantedOn" style={labelStyle}>{t("reg.enroll.date")}</label>
              <input id="plantedOn" type="date" max={todayISO()} value={plantedOn} onChange={e => setPlantedOn(e.target.value)} style={inputStyle} />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>{t("reg.enroll.location")}</label>
              <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem', margin: '0 0 0.75rem 0' }}>{t("reg.enroll.locationHelp")}</p>
              <button type="button" onClick={captureGPS} disabled={isCapturingGPS} style={{ width: '100%', padding: '0.75rem', marginBottom: '0.75rem', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#334155' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
                {isCapturingGPS ? t("reg.enroll.gpsLoading") : t("reg.enroll.gpsBtn")}
              </button>
              <LocationPicker value={location} onChange={setLocation} />
              <div style={{ fontSize: '0.85rem', marginTop: '0.5rem', color: !location ? 'var(--color-muted)' : outsideCR ? '#b91c1c' : '#059669' }}>
                {!location
                  ? t("reg.enroll.locationMissing")
                  : outsideCR
                    ? t("reg.errors.outsideCR")
                    : `✓ ${t("reg.enroll.locationSet")} (${location.lat.toFixed(5)}, ${location.lng.toFixed(5)})`}
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="photo" style={labelStyle}>{t("reg.enroll.photo")}</label>
              {photoUrl ? (
                <div>
                  <img src={photoUrl.startsWith('http') ? photoUrl : API_URL.replace('/api/v1', '') + photoUrl} alt={t("reg.enroll.photo")} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px' }} />
                  <button type="button" onClick={() => setPhotoUrl('')} style={{ marginTop: '0.5rem', background: 'none', border: 'none', color: 'var(--color-muted)', textDecoration: 'underline', cursor: 'pointer' }}>{t("reg.enroll.photoRemove")}</button>
                </div>
              ) : (
                <input id="photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoUpload} disabled={isUploading} style={{ width: '100%', padding: '0.5rem' }} />
              )}
              {isUploading && <div style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>{t("reg.enroll.photoUploading")}</div>}
            </div>

            <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              {t("reg.enroll.publicNote")} <a href="/privacidad" style={{ color: 'inherit' }}>{t("reg.enroll.privacyLink")}</a>
            </p>

            {errorBox}
            <button type="submit" disabled={loading || isUploading} style={{ width: '100%', padding: '1rem', background: 'var(--color-foreground)', color: 'var(--color-background)', borderRadius: '8px', fontWeight: 600, fontSize: '1.1rem', cursor: 'pointer', border: 'none' }}>
              {loading ? t("reg.enroll.saving") : t("reg.enroll.btn")}
            </button>
          </form>
        </div>
      )}

      {step === 'success' && (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🌳</div>
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{t("reg.success.title", { name: planterName })}</h2>
          <p style={{ color: 'var(--color-muted)', fontSize: '1.1rem', lineHeight: 1.6 }}>
            {t("reg.success.body")}
          </p>
          <a href="/mapa" style={{ display: 'inline-block', marginTop: '2rem', padding: '1rem 2rem', background: 'var(--color-foreground)', color: 'var(--color-background)', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}>
            {t("reg.success.btn")}
          </a>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '4rem' }}>…</div>}>
      <RegistroForm />
    </Suspense>
  );
}
