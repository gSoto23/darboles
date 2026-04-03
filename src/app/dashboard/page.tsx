"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../page.module.css';
import SmartTable from '@/components/SmartTable';
import toast from 'react-hot-toast';
import Loader from '@/components/Loader';

interface InvoiceData {
  id: number;
  amount_usd: number;
  status: string;
  invoice_date: string;
}

interface SubscriptionData {
  id: number;
  customer_name: string;
  customer_email: string;
  quantity: number;
  amount_usd: number;
  status: string;
  farm_id: number | null;
  invoices?: InvoiceData[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<{ full_name: string, email: string, whatsapp?: string, address?: string } | null>(null);
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);

  // Profile modal state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editWhatsapp, setEditWhatsapp] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [viewInvoiceSub, setViewInvoiceSub] = useState<SubscriptionData | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
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

        const subsRes = await fetch('http://localhost:8001/api/v1/subscriptions/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (subsRes.ok) {
          const subs = await subsRes.json();
          setSubscriptions(subs);
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

  const totalTrees = subscriptions.reduce((acc, sub) => acc + sub.quantity, 0);
  const totalKgPerYear = totalTrees * 25;

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

  const handleCancelSubscription = async (subId: number) => {
    if (!confirm('¿Estás seguro de cancelar esta suscripción de árboles?')) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:8001/api/v1/subscriptions/${subId}/cancel`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSubscriptions(subs => subs.map(s => s.id === subId ? { ...s, status: 'cancelled' } : s));
        setViewInvoiceSub(null);
        toast.success("Tu suscripción ha sido cancelada.");
      } else {
        toast.error("Error al cancelar la suscripción");
      }
    } catch (err) {
      toast.error("Ocurrió un error en la plataforma");
      console.error(err);
    }
  };

  const tableColumns = [
    { key: 'id', label: 'ID Suscripción', render: (row: any) => <strong>#{row.id}</strong> },
    { key: 'quantity', label: 'Árboles Asignados', render: (row: any) => `🌳 ${row.quantity}` },
    { key: 'amount_usd', label: 'Facturación Mensual', render: (row: any) => <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>${row.amount_usd?.toFixed(2) || '0.00'} USD</span> },
    {
      key: 'status', label: 'Estado', render: (row: any) => (
        <span style={{
          padding: '0.25rem 0.75rem', fontSize: '0.75rem', fontWeight: 600, borderRadius: '1rem',
          background: row.status === 'active' ? 'var(--color-accent)' : 'var(--color-border)',
          color: row.status === 'active' ? 'white' : 'var(--color-foreground)'
        }}>
          {row.status.toUpperCase()}
        </span>
      )
    },
    {
      key: 'actions', label: 'Gestión', render: (row: any) => (
        <button onClick={() => setViewInvoiceSub(row)} style={{ padding: '0.4rem 0.8rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', fontSize: '0.8rem' }}>Ver Detalle</button>
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
            ⚙️ Actualizar Perfil Autorizado
          </button>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', letterSpacing: '-0.02em', color: 'var(--color-foreground)' }}>
            Bienvenido, <span style={{ color: 'var(--color-accent)' }}>{user?.full_name || 'Agente de Cambio'}</span>
          </h1>
          <p className={styles.subtitle} style={{ marginLeft: 0 }}>
            Este es tu centro de impacto personal. Desde aquí rastrearemos el crecimiento en tiempo real de tu esfuerzo directo para combatir el cambio climático de forma radicalmente transparente.
          </p>
        </div>

        <div className={styles.dashboardGrid}>
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: '3rem', borderRadius: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--color-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Tu Bosque Expandido</h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem' }}>
              <div style={{ fontSize: '5rem', fontWeight: 800, color: 'var(--color-foreground)', lineHeight: 1, letterSpacing: '-0.02em' }}>{String(totalTrees)}</div>
              <div style={{ fontSize: '1.1rem', color: 'var(--color-muted)', fontWeight: 500, paddingBottom: '0.5rem' }}>Árboles Asignados</div>
            </div>
            <p style={{ color: 'var(--color-muted)', marginTop: '2rem', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Tus suscripciones garantizan que estos árboles sean georreferenciados y protegidos en nuestras fincas.
            </p>
            {totalTrees === 0 && (
              <button onClick={() => router.push('/suscripciones')} className={`${styles.btnAction}`} style={{ marginTop: '2rem', padding: '1rem 2rem', background: 'var(--color-accent)', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Explorar Suscripciones</button>
            )}
          </div>

          <div style={{ background: 'var(--color-foreground)', color: 'var(--color-background)', padding: '3rem', borderRadius: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginBottom: '1rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Mitigación Anual (Estimada)</h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem' }}>
              <div style={{ fontSize: '5rem', fontWeight: 800, color: 'white', lineHeight: 1, letterSpacing: '-0.02em' }}>{String(totalKgPerYear)}</div>
              <div style={{ fontSize: '1.1rem', color: 'white', opacity: 0.8, fontWeight: 500, paddingBottom: '0.5rem' }}>kg CO₂ / año</div>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: '2rem', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Un árbol nativo genérico en el trópico captura alrededor de ~25 kg de CO₂ por año una vez maduro. Cada uno de tus árboles compensa huella real.
            </p>
          </div>
        </div>

        <div style={{ marginTop: '4rem' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--color-foreground)', fontWeight: 600 }}>Historial de Suscripciones</h3>
          <SmartTable data={subscriptions} columns={tableColumns} />
        </div>
      </main>

      {/* --- PROFILE MODAL --- */}
      {isProfileModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}>
          <div style={{ background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: '1rem', width: '100%', maxWidth: '500px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Configuración de Perfil</h2>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--color-muted)' }}
              >×</button>
            </div>
            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--color-muted)' }}>Correo Electrónico (Requiere re-login al cambiar)</label>
                <input required type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-foreground)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--color-muted)' }}>Nombre Completo</label>
                <input required type="text" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-foreground)' }} value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--color-muted)' }}>WhatsApp</label>
                  <input type="text" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-foreground)' }} value={editWhatsapp} onChange={(e) => setEditWhatsapp(e.target.value)} placeholder="+506..." />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--color-muted)' }}>Dirección u Organización</label>
                  <input type="text" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-foreground)' }} value={editAddress} onChange={(e) => setEditAddress(e.target.value)} placeholder="SJ, Costa Rica" />
                </div>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '0.5rem 0' }} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--color-muted)' }}>Contraseña Actual</label>
                  <input type="password" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-foreground)' }} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--color-muted)' }}>Nueva Contraseña</label>
                  <input type="password" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-foreground)' }} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Nueva..." />
                </div>
              </div>

              <button type="submit" style={{ marginTop: '0.5rem', padding: '1rem', borderRadius: '8px', border: 'none', background: 'var(--color-foreground)', color: 'var(--color-background)', fontWeight: 600, cursor: 'pointer' }}>Actualizar y Guardar</button>
            </form>
          </div>
        </div>
      )}

      {/* --- INVOICE MODAL --- */}
      {viewInvoiceSub && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}>
          <div style={{ background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: '1rem', width: '100%', maxWidth: '600px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Trazabilidad de Cobros (Suscripción #{viewInvoiceSub.id})</h2>
              <button
                onClick={() => setViewInvoiceSub(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--color-muted)' }}
              >×</button>
            </div>

            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '0.5rem', overflow: 'hidden', marginBottom: '1.5rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--color-background)', borderBottom: '1px solid var(--color-border)' }}>
                    <th style={{ padding: '0.8rem 1rem', fontSize: '0.75rem', color: 'var(--color-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Fecha de Factura</th>
                    <th style={{ padding: '0.8rem 1rem', fontSize: '0.75rem', color: 'var(--color-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Monto Procesado</th>
                    <th style={{ padding: '0.8rem 1rem', fontSize: '0.75rem', color: 'var(--color-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Estado Bancario</th>
                  </tr>
                </thead>
                <tbody>
                  {viewInvoiceSub.invoices && viewInvoiceSub.invoices.length > 0 ? viewInvoiceSub.invoices.map(inv => (
                    <tr key={inv.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '0.8rem 1rem', fontSize: '0.85rem' }}>{inv.invoice_date}</td>
                      <td style={{ padding: '0.8rem 1rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-foreground)' }}>${inv.amount_usd.toFixed(2)} USD</td>
                      <td style={{ padding: '0.8rem 1rem' }}>
                        <span style={{ padding: '0.2rem 0.5rem', background: inv.status === 'paid' ? 'var(--color-accent)' : 'var(--color-border)', color: inv.status === 'paid' ? 'white' : 'var(--color-foreground)', borderRadius: '1rem', fontSize: '0.7rem', fontWeight: 600 }}>{inv.status.toUpperCase()}</span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={3} style={{ padding: '1rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-muted)' }}>Aún no hay facturas emitidas para este ciclo.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {viewInvoiceSub.status === 'active' && (
              <button
                onClick={() => handleCancelSubscription(viewInvoiceSub.id)}
                style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid #ef4444', background: 'transparent', color: '#ef4444', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }}
              >
                Cancelar Suscripción
              </button>
            )}
            {viewInvoiceSub.status === 'cancelled' && (
              <div style={{ textAlign: 'center', color: '#ef4444', fontWeight: 600, padding: '1rem' }}>Suscripción Cancelada Permanentemente</div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
