"use client";

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function RegistroForm() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get('id') || '';
  
  const [idCode, setIdCode] = useState(initialId);
  const [step, setStep] = useState<'validate' | 'enroll' | 'success'>('validate');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Tree Details
  const [treeInfo, setTreeInfo] = useState<any>(null);
  
  // Form Data
  const [planterName, setPlanterName] = useState('');
  const [planterEmail, setPlanterEmail] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [photoUrl, setPhotoUrl] = useState('');
  const [isCapturingGPS, setIsCapturingGPS] = useState(false);

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1"}/tracking/${idCode}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Código inválido o no encontrado");
      }
      const data = await res.json();
      if (data.status !== 'unregistered') {
        throw new Error("Este árbol ya ha sido matriculado.");
      }
      setTreeInfo(data);
      setStep('enroll');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const captureGPS = () => {
    setIsCapturingGPS(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
          setIsCapturingGPS(false);
        },
        (error) => {
          console.error("GPS Error:", error);
          alert("No pudimos capturar tu ubicación. Por favor, asegúrate de dar permisos al navegador.");
          setIsCapturingGPS(false);
        }
      );
    } else {
      alert("La geolocalización no está soportada en tu navegador.");
      setIsCapturingGPS(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1"}/tracking/upload-image`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setPhotoUrl(data.image_url);
      }
    } catch (err) {
      console.error(err);
      alert("Error subiendo foto");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (latitude === null || longitude === null) {
      alert("Debes capturar tu ubicación GPS para matricular el árbol en el mapa.");
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1"}/tracking/${idCode}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planter_name: planterName,
          planter_email: planterEmail,
          latitude,
          longitude,
          photo_url: photoUrl || null
        })
      });
      
      if (!res.ok) throw new Error("Error guardando la matrícula");
      
      setStep('success');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', paddingTop: '100px', paddingBottom: '100px', paddingLeft: '1rem', paddingRight: '1rem' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', textAlign: 'center' }}>Matricular mi Árbol</h1>
      
      {step === 'validate' && (
        <div style={{ background: 'var(--color-surface)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          <p style={{ color: 'var(--color-muted)', marginBottom: '2rem', textAlign: 'center' }}>
            Ingresa el código único que viene en tu certificado para registrar tu árbol en el mapa de impacto nacional.
          </p>
          <form onSubmit={handleValidate}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Código de Registro</label>
              <input 
                type="text" 
                value={idCode} 
                onChange={e => setIdCode(e.target.value.toUpperCase())}
                placeholder="Ej. DAR-123456"
                required
                style={{ width: '100%', padding: '1rem', fontSize: '1.25rem', textAlign: 'center', letterSpacing: '2px', borderRadius: '8px', border: '1px solid var(--color-border)', outline: 'none' }}
              />
            </div>
            {error && <div style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '1rem', background: 'var(--color-foreground)', color: 'var(--color-background)', borderRadius: '8px', fontWeight: 600, fontSize: '1.1rem', cursor: 'pointer', border: 'none' }}>
              {loading ? "Validando..." : "Validar Código"}
            </button>
          </form>
        </div>
      )}

      {step === 'enroll' && (
        <div style={{ background: 'var(--color-surface)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', border: '1px dashed #cbd5e1' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>¡Hola! Tienes un {treeInfo?.species_name}</h3>
            <p style={{ margin: '0.5rem 0 0 0', color: '#64748b', fontStyle: 'italic' }}>{treeInfo?.species_scientific_name}</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Tu Nombre</label>
              <input type="text" required value={planterName} onChange={e => setPlanterName(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--color-border)', outline: 'none' }} placeholder="¿Quién lo plantó?" />
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Tu Correo Electrónico</label>
              <input type="email" required value={planterEmail} onChange={e => setPlanterEmail(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--color-border)', outline: 'none' }} placeholder="Para recordatorios de crecimiento" />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Ubicación de Siembra (Requerido)</label>
              {latitude && longitude ? (
                <div style={{ color: '#059669', fontWeight: 500, padding: '0.75rem', background: '#ecfdf5', borderRadius: '6px' }}>✓ GPS Capturado Exitosamente</div>
              ) : (
                <button type="button" onClick={captureGPS} disabled={isCapturingGPS} style={{ width: '100%', padding: '0.75rem', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#334155' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
                  {isCapturingGPS ? "Ubicando..." : "Capturar mi ubicación actual"}
                </button>
              )}
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Foto del Árbol Plantado (Opcional)</label>
              {photoUrl ? (
                <img src={photoUrl.startsWith('http') ? photoUrl : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1").replace('/api/v1', '') + photoUrl} alt="Árbol" style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px' }} />
              ) : (
                <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ width: '100%', padding: '0.5rem' }} />
              )}
            </div>

            <button type="submit" disabled={loading} style={{ width: '100%', padding: '1rem', background: 'var(--color-foreground)', color: 'var(--color-background)', borderRadius: '8px', fontWeight: 600, fontSize: '1.1rem', cursor: 'pointer', border: 'none' }}>
              {loading ? "Guardando..." : "Completar Matrícula"}
            </button>
          </form>
        </div>
      )}

      {step === 'success' && (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🌳</div>
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>¡Gracias, {planterName}!</h2>
          <p style={{ color: 'var(--color-muted)', fontSize: '1.1rem', lineHeight: 1.6 }}>
            Tu árbol ha sido matriculado exitosamente en el registro nacional Dárboles. Su crecimiento ahora sumará a nuestras métricas de captura de carbono.
          </p>
          <a href="/mapa" style={{ display: 'inline-block', marginTop: '2rem', padding: '1rem 2rem', background: 'var(--color-foreground)', color: 'var(--color-background)', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}>
            Ver Mapa de Impacto
          </a>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '4rem' }}>Cargando...</div>}>
      <RegistroForm />
    </Suspense>
  );
}
