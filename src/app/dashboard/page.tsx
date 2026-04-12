"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from '../page.module.css';
import SmartTable from '@/components/SmartTable';
import toast from 'react-hot-toast';
import Loader from '@/components/Loader';
import { useTranslations } from '@/context/TranslationContext';

interface GiftData {
  id: number;
  quantity: number;
  status: string;
  transaction_ref: string;
  send_date: string | null;
  tree: {
    name: string;
  } | null;
}

export default function DashboardPage() {
  const { t } = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [user, setUser] = useState<{ full_name: string, email: string, whatsapp?: string, address?: string } | null>(null);
  const [gifts, setGifts] = useState<GiftData[]>([]);
  const [selectedGift, setSelectedGift] = useState<any>(null);

  // Profile modal state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editWhatsapp, setEditWhatsapp] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');


  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    if (searchParams?.get('payment_success') === 'true') {
      setShowSuccessModal(true);
    }

    const fetchData = async () => {
      try {
        const authRes = await fetch('http://localhost:8001/api/v1/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (authRes.ok) {
          const u = await authRes.json();
          setUser(u);
          setEditName(u.full_name || '');
          setEditEmail(u.email || '');
          setEditWhatsapp(u.whatsapp || '');
          setEditAddress(u.address || '');
          // Allow admins to view dashboard, no forced redirect
        } else {
          router.push('/login');
        }

        const giftsRes = await fetch('http://localhost:8001/api/v1/inventory/me/gifts', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (giftsRes.ok) {
          const g = await giftsRes.json();
          setGifts(g);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [router]);

  if (!mounted || isLoading) return <Loader />;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    // Validate passwords if changing
    if (newPassword && !currentPassword) {
      toast.error("Debes ingresar la contraseña actual para cambiarla");
      return;
    }

    try {
      const payload: any = {
        full_name: editName,
        email: editEmail,
        whatsapp: editWhatsapp,
        address: editAddress
      };
      if (newPassword) {
        payload.new_password = newPassword;
        payload.current_password = currentPassword;
      }

      const res = await fetch('http://localhost:8001/api/v1/auth/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.detail || "Error al actualizar el perfil");
        return;
      }

      const u = await res.json();
      setUser(u);

      if (payload.new_password || payload.email !== user?.email) {
        toast.success("Credenciales actualizadas. Por favor, re-inicia sesión.");
        localStorage.removeItem('token');
        router.push('/login');
        return;
      }

      toast.success("Perfil actualizado correctamente");
      setIsProfileModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
    } catch (e) {
      toast.error("Ocurrió un error inesperado al actualizar");
      console.error(e);
    }
  };



  const tableColumns = [
    { key: 'id', label: 'ID', render: (row: any) => <strong>#{row.id}</strong> },
    { key: 'tree', label: 'Especie', render: (row: any) => <span style={{ fontWeight: 600 }}>{row.tree?.name || 'Árbol'}</span> },
    { key: 'quantity', label: 'Cantidad', render: (row: any) => `🌳 ${row.quantity}` },
    {
      key: 'status', label: 'STS', render: (row: any) => (
        <span style={{
          padding: '0.25rem 0.75rem', fontSize: '0.75rem', fontWeight: 600, borderRadius: '1rem',
          background: row.status === 'delivered' ? '#3b82f6' : row.status === 'paid' ? 'var(--color-accent)' : row.status === 'shipped' ? '#eab308' : 'var(--color-border)',
          color: (row.status === 'delivered' || row.status === 'paid') ? 'white' : 'var(--color-foreground)'
        }}>
          {row.status === 'pending' ? 'Verificando' : row.status === 'paid' ? 'Confirmado' : row.status === 'shipped' ? 'Enviado' : row.status === 'delivered' ? 'Entregado' : row.status}
        </span>
      )
    }
  ];

  return (
    <div style={{ paddingTop: '100px', minHeight: '100vh', backgroundColor: 'var(--color-background)' }}>
      <main className={`page-container slide-up`}>
        <div style={{ marginBottom: '3rem', marginTop: '2rem' }}>
          <button
            onClick={() => setIsProfileModalOpen(true)}
            style={{ padding: '0.5rem 1rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '2rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', marginBottom: '1rem' }}
          >
            {t("dash.update")}
          </button>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', letterSpacing: '-0.02em', color: 'var(--color-foreground)' }}>
            {t("dash.welcome")} <span style={{ color: 'var(--color-accent)' }}>{user?.full_name || t("dash.agent")}</span>
          </h1>
          <p className={styles.subtitle} style={{ marginLeft: 0 }}>
            {t("dash.sub")}
          </p>
        </div>



        <div style={{ marginTop: '4rem' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--color-foreground)', fontWeight: 600 }}>Tus Compras / Regalos</h3>
          <SmartTable data={gifts} columns={tableColumns} onRowClick={(row) => setSelectedGift(row)} />
        </div>
      </main>

      {/* --- PROFILE MODAL --- */}
      {isProfileModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}>
          <div style={{ background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: '1rem', width: '100%', maxWidth: '500px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{t("dash.prof.title")}</h2>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--color-muted)' }}
              >×</button>
            </div>
            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--color-muted)' }}>{t("dash.prof.email")}</label>
                <input required type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-foreground)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--color-muted)' }}>{t("dash.prof.name")}</label>
                <input required type="text" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-foreground)' }} value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--color-muted)' }}>WhatsApp</label>
                  <input type="text" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-foreground)' }} value={editWhatsapp} onChange={(e) => setEditWhatsapp(e.target.value)} placeholder="+506..." />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--color-muted)' }}>{t("dash.prof.org")}</label>
                  <input type="text" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-foreground)' }} value={editAddress} onChange={(e) => setEditAddress(e.target.value)} />
                </div>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '0.5rem 0' }} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--color-muted)' }}>{t("dash.prof.curpass")}</label>
                  <input type="password" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-foreground)' }} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--color-muted)' }}>{t("dash.prof.newpass")}</label>
                  <input type="password" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-foreground)' }} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                </div>
              </div>

              <button type="submit" style={{ marginTop: '0.5rem', padding: '1rem', borderRadius: '8px', border: 'none', background: 'var(--color-foreground)', color: 'var(--color-background)', fontWeight: 600, cursor: 'pointer' }}>{t("dash.prof.btn")}</button>
            </form>
          </div>
        </div>
      )}



      {/* --- SUCCESS MODAL --- */}
      {showSuccessModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}>
          <div style={{ background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: '1rem', width: '100%', maxWidth: '500px', padding: '3rem 2rem', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--color-accent)', color: 'var(--color-background)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 1.5rem auto' }}>✓</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 600 }}>¡Pedido Registrado con Éxito!</h3>
            <p style={{ color: 'var(--color-muted)', marginBottom: '2rem', lineHeight: 1.6 }}>
              {t("regalos.checkout.successBody")}
            </p>
            <button onClick={() => { setShowSuccessModal(false); router.replace('/dashboard'); }} style={{ padding: '0.75rem 2rem', borderRadius: '2rem', border: 'none', background: 'var(--color-foreground)', color: 'var(--color-background)', fontWeight: 600, cursor: 'pointer', maxWidth: '200px', margin: '0 auto' }}>
              Volver al Panel
            </button>
          </div>
        </div>
      )}

      {/* --- GIFT DETAIL MODAL --- */}
      {selectedGift && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}>
          <div style={{ background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: '1rem', width: '100%', maxWidth: '500px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Detalle de Pedido #{selectedGift.id}</h2>
              <button
                onClick={() => setSelectedGift(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--color-muted)' }}
              >×</button>
            </div>
            
            <div style={{ marginBottom: '1.5rem', background: 'var(--color-surface)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
              <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Especie Regalada</div>
              <p>{selectedGift.quantity}x {selectedGift.tree?.name || 'Árbol'} <span style={{ opacity: 0.6, fontStyle: 'italic', fontSize: '0.8rem' }}>({selectedGift.tree?.scientific_name})</span></p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Información del Destinatario</div>
              <table style={{ width: '100%', fontSize: '0.9rem', color: 'var(--color-foreground)' }}>
                <tbody>
                  <tr><td style={{ color: 'var(--color-muted)', paddingBottom: '0.25rem', width: '100px' }}>Nombre:</td><td>{selectedGift.recipient_name} {selectedGift.recipient_last_name}</td></tr>
                  <tr><td style={{ color: 'var(--color-muted)', paddingBottom: '0.25rem' }}>Email:</td><td>{selectedGift.recipient_email}</td></tr>
                  <tr><td style={{ color: 'var(--color-muted)', paddingBottom: '0.25rem' }}>WhatsApp:</td><td>{selectedGift.recipient_whatsapp}</td></tr>
                  {selectedGift.message && (
                    <tr><td style={{ color: 'var(--color-muted)', verticalAlign: 'top', paddingTop: '0.5rem' }}>Mensaje:</td><td style={{ paddingTop: '0.5rem', fontStyle: 'italic' }}>"{selectedGift.message}"</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {selectedGift.status === 'delivered' && selectedGift.certificate_url && (
              <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
                <a href={`http://localhost:8001/api/${selectedGift.certificate_url}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '0.75rem 2rem', background: '#3b82f6', color: 'white', fontWeight: 600, borderRadius: '2rem', textDecoration: 'none' }}>
                  Ver Certificado PDF
                </a>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
