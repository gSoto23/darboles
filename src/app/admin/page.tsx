"use client";

import { useState, useEffect, useMemo } from 'react';
import styles from './Admin.module.css';
import SmartTable from '@/components/SmartTable';

interface TreeSpecies {
  id: number;
  name: string;
  scientific_name: string;
  description: string;
  co2_capture_capacity_kg_per_year: number;
  price_crc: number;
  image_url: string;
  stock: number;
  is_active: boolean;
}

interface Gift {
  id: number;
  buyer_name: string;
  buyer_last_name?: string;
  buyer_email: string;
  buyer_whatsapp?: string;
  invoice_requested?: boolean;
  invoice_name?: string;
  invoice_id_number?: string;
  invoice_address?: string;
  invoice_activity_code?: string;
  tree_id: number;
  quantity: number;
  recipient_name: string;
  recipient_last_name: string;
  recipient_email: string;
  recipient_whatsapp: string;
  recipient_address?: string;
  message?: string;
  send_date?: string;
  transaction_ref?: string;
  status: string;
  certificate_url?: string;
  shipping_cost_applied?: number;
  payment_receipt_url?: string;
  payment_receipt_method?: string;
  tree?: TreeSpecies;
}

import Loader from '@/components/Loader';
import { Toaster, toast } from 'react-hot-toast';

const CantonAccordion = ({ gamCantonsStr, onChange }: { gamCantonsStr: string; onChange: (s: string) => void }) => {
  const [locations, setLocations] = useState<{ provincia: string; cantones: string[] }[]>([]);
  const [openProv, setOpenProv] = useState<string | null>(null);
  const [loadingLocs, setLoadingLocs] = useState(false);

  const selectedCantons = useMemo(() => {
    return new Set(gamCantonsStr.split(',').map((c) => c.trim().toLowerCase()).filter((c) => c));
  }, [gamCantonsStr]);

  const handleToggle = (provincia: string, canton: string) => {
    const compKey = `${provincia}|${canton}`.toLowerCase();
    const legacyKey = canton.toLowerCase();
    const current = new Set(selectedCantons);
    
    if (current.has(compKey) || current.has(legacyKey)) {
      current.delete(compKey);
      current.delete(legacyKey);
    } else {
      current.add(compKey);
    }
    
    const activeNames: string[] = [];
    locations.forEach(l => l.cantones.forEach(c => {
      const ck = `${l.provincia}|${c}`.toLowerCase();
      const lk = c.toLowerCase();
      if (current.has(ck) || current.has(lk)) activeNames.push(`${l.provincia}|${c}`);
    }));
    onChange(activeNames.join(','));
  };

  useEffect(() => {
    const fetchLocs = async () => {
      setLoadingLocs(true);
      try {
        const provRes = await fetch('https://ubicaciones.paginasweb.cr/provincias.json');
        const provData = await provRes.json();
        
        const locsData: { provincia: string; cantones: string[] }[] = [];
        for (const [id, provName] of Object.entries(provData)) {
          const cantRes = await fetch(`https://ubicaciones.paginasweb.cr/provincia/${id}/cantones.json`);
          const cantData = await cantRes.json();
          locsData.push({
            provincia: provName as string,
            cantones: Object.values(cantData) as string[]
          });
        }
        setLocations(locsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingLocs(false);
      }
    };
    fetchLocs();
  }, []);

  if (loadingLocs) return <div style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>Cargando catálogo de cantones...</div>;

  return (
    <div style={{ border: '1px solid var(--color-border)', borderRadius: '6px', overflow: 'hidden' }}>
      {locations.map((loc) => {
        const isOpen = openProv === loc.provincia;
        const selectedCount = loc.cantones.filter(c => selectedCantons.has(`${loc.provincia}|${c}`.toLowerCase()) || selectedCantons.has(c.toLowerCase())).length;
        
        return (
          <div key={loc.provincia} style={{ borderBottom: '1px solid var(--color-border)' }}>
            <div 
              onClick={() => setOpenProv(isOpen ? null : loc.provincia)}
              style={{ background: 'var(--color-surface)', padding: '0.75rem 1rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600, fontSize: '0.9rem' }}
            >
              <span>{loc.provincia} <span style={{ color: 'var(--color-muted)', fontWeight: 'normal', fontSize: '0.8rem', marginLeft: '0.5rem' }}>({selectedCount} seleccionados)</span></span>
              <span>{isOpen ? '▲' : '▼'}</span>
            </div>
            {isOpen && (
              <div style={{ background: 'var(--color-background)', padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem' }}>
                {loc.cantones.map((canton) => {
                  const isChecked = selectedCantons.has(`${loc.provincia}|${canton}`.toLowerCase()) || selectedCantons.has(canton.toLowerCase());
                  return (
                    <label key={canton} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={isChecked} 
                        onChange={() => handleToggle(loc.provincia, canton)} 
                      />
                      {canton}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'pedidos' | 'catalogo' | 'usuarios' | 'configuracion'>('pedidos');
  const [storeConfig, setStoreConfig] = useState<any>(null);
  const [trees, setTrees] = useState<TreeSpecies[]>([]);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Gift Modal
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);


  // Species Modal State
  const [isSpeciesModalOpen, setIsSpeciesModalOpen] = useState(false);
  const [editingSpeciesId, setEditingSpeciesId] = useState<number | null>(null);
  const [speciesForm, setSpeciesForm] = useState({
    name: '', scientific_name: '', price_crc: 0,
    description: '', co2_capture_capacity_kg_per_year: 0, image_url: '',
    stock: 0, is_active: true
  });

  useEffect(() => {
    const checkAdmin = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/login';
        return;
      }
      try {
        const res = await fetch('http://localhost:8001/api/v1/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
          window.location.href = '/login';
          return;
        }
        const data = await res.json();
        if (!data.is_admin) {
          window.location.href = '/dashboard';
        } else {
          setIsAdmin(true);
          setIsSuperAdmin(data.is_superadmin);
        }
      } catch (e) {
        window.location.href = '/login';
      }
    };
    checkAdmin();
  }, []);

  const fetchUsers = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:8001/api/v1/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if(res.ok) setUsers(await res.json());
    } catch(err) { console.error(err); }
  }


  const fetchGifts = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('http://localhost:8001/api/v1/admin/gifts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setGifts(data);
    } catch(err) { console.error(err); }
  }

  useEffect(() => {
    if (!isAdmin) return;
    const token = localStorage.getItem('token');

    if (activeTab === 'pedidos') {
      fetchGifts();
    }
    if (activeTab === 'catalogo') {
      fetch('http://localhost:8001/api/v1/admin/trees')
        .then(res => res.json())
        .then(data => setTrees(data))
        .catch(err => console.error(err));
    }

    if (activeTab === 'usuarios' && isSuperAdmin) {
      fetchUsers();
    }

    if (activeTab === 'configuracion') {
      fetch('http://localhost:8001/api/v1/config')
        .then(res => res.json())
        .then(data => setStoreConfig(data))
        .catch(err => console.error(err));
    }
  }, [activeTab, isAdmin, isSuperAdmin]);


  const handleOpenSpeciesModal = (species?: TreeSpecies) => {
    if (species) {
      setEditingSpeciesId(species.id);
      setSpeciesForm({
        name: species.name,
        scientific_name: species.scientific_name,
        price_crc: species.price_crc,
        description: species.description || '',
        co2_capture_capacity_kg_per_year: species.co2_capture_capacity_kg_per_year || 0,
        image_url: species.image_url || '',
        stock: species.stock,
        is_active: species.is_active
      });
    } else {
      setEditingSpeciesId(null);
      setSpeciesForm({ name: '', scientific_name: '', price_crc: 0, description: '', co2_capture_capacity_kg_per_year: 0, image_url: '', stock: 0, is_active: true });
    }
    setIsSpeciesModalOpen(true);
  };

  const handleSaveSpecies = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const url = editingSpeciesId 
        ? `http://localhost:8001/api/v1/admin/trees/${editingSpeciesId}`
        : `http://localhost:8001/api/v1/admin/trees`;
      const method = editingSpeciesId ? 'PATCH' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(speciesForm)
      });
      if (res.ok) {
        setIsSpeciesModalOpen(false);
        const resTrees = await fetch('http://localhost:8001/api/v1/admin/trees');
        setTrees(await resTrees.json());
      }
    } catch (err) {
      console.error(err);
    }
  };


  const handleToggleAdmin = async (userId: number, currentStatus: boolean) => {
    const token = localStorage.getItem('token');
    try {
      await fetch(`http://localhost:8001/api/v1/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_admin: !currentStatus })
      });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  }

  const handleUpdateGiftStatus = async (giftId: number, newStatus: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:8001/api/v1/admin/gifts/${giftId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchGifts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!isAdmin) return <Loader />;

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.navTitle}>
          ADMINISTRACIÓN
        </div>
        <button 
          className={`${styles.navItem} ${activeTab === 'pedidos' ? styles.active : ''}`}
          onClick={() => setActiveTab('pedidos')}
        >
          Pedidos
        </button>
        <button 
          className={`${styles.navItem} ${activeTab === 'catalogo' ? styles.active : ''}`}
          onClick={() => setActiveTab('catalogo')}
        >
          Catálogo de Árboles
        </button>
        <button 
          className={`${styles.navItem} ${activeTab === 'configuracion' ? styles.active : ''}`}
          onClick={() => setActiveTab('configuracion')}
        >
          Configuración
        </button>
        {isSuperAdmin && (
          <button 
            className={`${styles.navItem} ${activeTab === 'usuarios' ? styles.active : ''}`}
            onClick={() => setActiveTab('usuarios')}
          >
            Usuarios
          </button>
        )}
      </aside>

      <main className={`${styles.mainContent} fade-in`}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>
              {activeTab === 'pedidos' && 'Gestor de Entregas y Checkout'}
              {activeTab === 'catalogo' && 'Control de Especies e Inventario'}
              {activeTab === 'usuarios' && 'Sistema de Roles y Accesos MAESTRO'}
              {activeTab === 'configuracion' && 'Ajustes de Tienda y Logística'}
            </h1>
            <p className={styles.subtitle}>
              Monitor central del ecosistema Dárboles.
            </p>
          </div>
          {activeTab === 'catalogo' && (
            <button className={styles.addBtn} onClick={() => handleOpenSpeciesModal()}>+ Añadir Especie</button>
          )}

        </header>

        {activeTab === 'pedidos' && (
          <div className="slide-up">
             <SmartTable 
              data={gifts} 
              columns={[
                { key: 'id', label: 'ID Pedido', render: (row: any) => `#${row.id}` },
                { key: 'client', label: 'Cliente', render: (row: any) => <><span style={{ fontWeight: 500 }}>{row.buyer_name}</span><div style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>{row.buyer_email}</div></> },
                { key: 'tree', label: 'Árbol Solicitado', render: (row: any) => row.tree ? `${row.quantity}x ${row.tree.name}` : `${row.quantity}x Especie ID: ${row.tree_id}` },
                { key: 'ref', label: 'Referencia Bancaria', render: (row: any) => <span style={{ color: 'var(--color-muted)' }}>{row.transaction_ref || 'N/A'}</span> },
                { key: 'status', label: 'Estado', render: (row: any) => (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-start' }}>
                    <span className={`${styles.statusBadge} ${row.status === 'paid' || row.status === 'delivered' || row.status === 'shipped' ? styles.statusSuccess : styles.statusPending}`}>
                      {row.status === 'paid' ? 'Pago' : row.status === 'delivered' ? 'Entregado' : row.status === 'shipped' ? 'En ruta' : row.status === 'pending' ? 'Revisión de pago' : row.status}
                    </span>
                    {row.payment_receipt_method === 'upload' && row.payment_receipt_url && (
                        <a href={`http://localhost:8001/api/${row.payment_receipt_url}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: '#3b82f6', textDecoration: 'underline' }}>
                          Ver Comprobante
                        </a>
                    )}
                  </div>
                ) },
                { key: 'actions', label: 'Acciones', render: (row: any) => (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button 
                        onClick={() => { setSelectedGift(row); setIsGiftModalOpen(true); }}
                        style={{ padding: '0.4rem 0.8rem', borderRadius: '4px', border: '1px solid var(--color-border)', cursor: 'pointer', background: 'transparent', fontSize: '0.8rem' }}
                      >Detalle</button>
                      
                      {row.status === 'pending' && (
                        <button 
                          onClick={() => handleUpdateGiftStatus(row.id, 'paid')}
                          style={{ padding: '0.4rem 0.8rem', borderRadius: '4px', border: 'none', background: '#22c55e', color: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                        >Validar SINPE</button>
                      )}
                      
                      {row.status === 'paid' && (
                        <button 
                          onClick={() => handleUpdateGiftStatus(row.id, 'shipped')}
                          style={{ padding: '0.4rem 0.8rem', borderRadius: '4px', border: 'none', background: '#eab308', color: 'var(--color-background)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                        >Enviar</button>
                      )}

                      {row.status === 'shipped' && (
                        <button 
                          onClick={() => handleUpdateGiftStatus(row.id, 'delivered')}
                          style={{ padding: '0.4rem 0.8rem', borderRadius: '4px', border: 'none', background: '#3b82f6', color: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                        >Entregado</button>
                      )}
                    </div>
                )}
              ]} 
            />
          </div>
        )}


        {activeTab === 'catalogo' && (
          <div className="slide-up">
             <SmartTable 
              data={trees} 
              columns={[
                { key: 'id', label: 'ID', render: (row: any) => `#${row.id}` },
                { key: 'name', label: 'Nombre Común', render: (row: any) => <span style={{ fontWeight: 500 }}>{row.name}</span> },
                { key: 'scientific_name', label: 'Nombre Científico', render: (row: any) => <span style={{ fontStyle: 'italic', color: 'var(--color-muted)' }}>{row.scientific_name}</span> },
                { key: 'price_crc', label: 'Precio', render: (row: any) => `₡${row.price_crc.toLocaleString()}` },
                { key: 'stock', label: 'Inventario', render: (row: any) => <span style={{ fontWeight: 600, color: row.stock > 0 ? 'var(--color-foreground)' : 'var(--color-accent)' }}>{row.stock} uds</span> },
                { key: 'is_active', label: 'Estado', render: (row: any) => <span style={{ color: row.is_active ? '#22c55e' : 'var(--color-muted)' }}>{row.is_active ? 'Activo' : 'Inactivo'}</span> },
                { key: 'actions', label: 'Acciones', render: (row: any) => <button onClick={() => handleOpenSpeciesModal(row)} style={{ background: 'transparent', border: 'none', color: 'var(--color-muted)', cursor: 'pointer', textDecoration: 'underline' }}>Editar</button> }
              ]} 
            />
          </div>
        )}


        {activeTab === 'usuarios' && isSuperAdmin && (
          <div className="slide-up">
             <SmartTable 
              data={users} 
              columns={[
                { key: 'id', label: 'ID', render: (row: any) => `#${row.id}` },
                { key: 'full_name', label: 'Cuenta', render: (row: any) => <><span style={{ fontWeight: 500 }}>{row.full_name || 'Sin Nombre'}</span><div style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>{row.email}</div></> },
                { key: 'is_admin', label: 'Rol', render: (row: any) => row.is_superadmin ? <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>SuperAdmin</span> : row.is_admin ? <span style={{ fontWeight: 600 }}>Administrador</span> : <span style={{ color: 'var(--color-muted)' }}>Usuario Estándar</span> },
                { key: 'status', label: 'Estado', render: (row: any) => '✓ Activa' },
                { key: 'actions', label: 'Gestión', render: (row: any) => !row.is_superadmin ? (
                    <button 
                      onClick={() => handleToggleAdmin(row.id, row.is_admin)}
                      style={{
                        background: row.is_admin ? 'transparent' : 'var(--color-foreground)',
                        color: row.is_admin ? 'var(--color-foreground)' : 'var(--color-background)',
                        border: row.is_admin ? '1px solid var(--color-foreground)' : 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 600
                      }}>
                      {row.is_admin ? 'Revocar Admin' : 'Hacer Admin'}
                    </button>
                  ) : <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>Inmutable</span>
                }
              ]} 
            />
          </div>
        )}
        {activeTab === 'configuracion' && storeConfig && (
          <div className="slide-up" style={{ maxWidth: '800px', background: 'var(--color-surface)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const token = localStorage.getItem('token');
              try {
                const res = await fetch('http://localhost:8001/api/v1/admin/config', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                  body: JSON.stringify(storeConfig)
                });
                if (res.ok) {
                  toast.success('Configuración guardada exitosamente.');
                } else {
                  toast.error('Error al guardar configuración');
                }
              } catch (e) {
                console.error(e);
                toast.error('Hubo un problema de conexión.');
              }
            }}>
              
              <h3 style={{ marginBottom: '1.5rem', color: 'var(--color-foreground)' }}>Tarifas y Tiempos de Envío</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--color-muted)' }}>Costo Envío GAM (Colones)</label>
                  <input type="number" required style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-foreground)' }} value={storeConfig.gam_shipping_cost} onChange={(e) => setStoreConfig({...storeConfig, gam_shipping_cost: parseFloat(e.target.value)})} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--color-muted)' }}>Tiempo Entrega GAM</label>
                  <input type="text" required style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-foreground)' }} value={storeConfig.gam_delivery_days} onChange={(e) => setStoreConfig({...storeConfig, gam_delivery_days: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--color-muted)' }}>Costo Envío Fuera GAM (Colones)</label>
                  <input type="number" required style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-foreground)' }} value={storeConfig.non_gam_shipping_cost} onChange={(e) => setStoreConfig({...storeConfig, non_gam_shipping_cost: parseFloat(e.target.value)})} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--color-muted)' }}>Tiempo Entrega Fuera GAM</label>
                  <input type="text" required style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-foreground)' }} value={storeConfig.non_gam_delivery_days} onChange={(e) => setStoreConfig({...storeConfig, non_gam_delivery_days: e.target.value})} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--color-muted)' }}>Lista de Cantones dentro del GAM</label>
                  <CantonAccordion 
                    gamCantonsStr={storeConfig.gam_cantons || ''} 
                    onChange={(newVal) => setStoreConfig({...storeConfig, gam_cantons: newVal})} 
                  />
                </div>
              </div>

              <h3 style={{ marginBottom: '1.5rem', color: 'var(--color-foreground)', borderTop: '1px solid var(--color-border)', paddingTop: '2rem' }}>Información de Pago (SINPE)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--color-muted)' }}>Número SINPE Móvil</label>
                  <input type="text" required style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-foreground)' }} value={storeConfig.sinpe_number} onChange={(e) => setStoreConfig({...storeConfig, sinpe_number: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--color-muted)' }}>Nombre Asociado a Cuenta</label>
                  <input type="text" required style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-foreground)' }} value={storeConfig.sinpe_name} onChange={(e) => setStoreConfig({...storeConfig, sinpe_name: e.target.value})} />
                </div>
              </div>

              <button type="submit" style={{ padding: '1rem', borderRadius: '8px', border: 'none', background: 'var(--color-foreground)', color: 'var(--color-background)', fontWeight: 600, cursor: 'pointer', display: 'block', width: '100%' }}>Guardar Configuración</button>
            </form>
          </div>
        )}
      </main>


      {/* --- ADD/EDIT SPECIES MODAL --- */}
      {isSpeciesModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}>
          <div style={{ background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: '1rem', width: '100%', maxWidth: '400px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{editingSpeciesId ? 'Editar Especie' : 'Añadir Nueva Especie'}</h2>
              <button 
                onClick={() => setIsSpeciesModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--color-muted)' }}
              >×</button>
            </div>
            
            <form onSubmit={handleSaveSpecies} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--color-muted)' }}>Nombre Común</label>
                <input required type="text" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-foreground)' }} value={speciesForm.name} onChange={(e) => setSpeciesForm({...speciesForm, name: e.target.value})} placeholder="Ej. Corteza Amarilla" />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--color-muted)' }}>Nombre Científico</label>
                <input required type="text" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-foreground)' }} value={speciesForm.scientific_name} onChange={(e) => setSpeciesForm({...speciesForm, scientific_name: e.target.value})} placeholder="Ej. Handroanthus chrysanthus" />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--color-muted)' }}>Descripción Biológica</label>
                <textarea required style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-foreground)', minHeight: '80px' }} value={speciesForm.description} onChange={(e) => setSpeciesForm({...speciesForm, description: e.target.value})} placeholder="Conocido por su espectacular floración..." />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--color-muted)' }}>Captura CO₂ (kg/año)</label>
                  <input required type="number" step="0.1" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-foreground)' }} value={speciesForm.co2_capture_capacity_kg_per_year} onChange={(e) => setSpeciesForm({...speciesForm, co2_capture_capacity_kg_per_year: parseFloat(e.target.value)})} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--color-muted)' }}>Precio (CRC)</label>
                  <input required type="number" step="1" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-foreground)' }} value={speciesForm.price_crc} onChange={(e) => setSpeciesForm({...speciesForm, price_crc: parseInt(e.target.value)})} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--color-muted)' }}>URL Fotografía Alta Resolución</label>
                <input required type="text" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-foreground)' }} value={speciesForm.image_url} onChange={(e) => setSpeciesForm({...speciesForm, image_url: e.target.value})} placeholder="https://..." />
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.5rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--color-muted)' }}>Stock Disponible</label>
                  <input required type="number" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-foreground)' }} value={speciesForm.stock} onChange={(e) => setSpeciesForm({...speciesForm, stock: parseInt(e.target.value) || 0})} />
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                  <input type="checkbox" id="is_active" checked={speciesForm.is_active} onChange={(e) => setSpeciesForm({...speciesForm, is_active: e.target.checked})} style={{ width: '18px', height: '18px' }} />
                  <label htmlFor="is_active" style={{ fontSize: '0.9rem', color: 'var(--color-foreground)', cursor: 'pointer' }}>Especie Pública y Activa</label>
                </div>
              </div>

              <button type="submit" style={{ marginTop: '1rem', padding: '1rem', borderRadius: '8px', border: 'none', background: 'var(--color-foreground)', color: 'var(--color-background)', fontWeight: 600, cursor: 'pointer' }}>Guardar Especie</button>

            </form>
          </div>
        </div>
      )}

      {/* --- GIFT DETAIL MODAL --- */}
      {isGiftModalOpen && selectedGift && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}>
          <div style={{ background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: '1rem', width: '100%', maxWidth: '600px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Detalle de Pedido #{selectedGift.id}</h2>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>{selectedGift.transaction_ref} - {selectedGift.status}</span>
              </div>
              <button 
                onClick={() => { setIsGiftModalOpen(false); setSelectedGift(null); }}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--color-muted)' }}
              >×</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              <div style={{ padding: '1rem', border: '1px solid var(--color-border)', borderRadius: '8px', background: 'var(--color-surface)' }}>
                <h3 style={{ fontSize: '0.9rem', color: 'var(--color-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Datos del Comprador</h3>
                <p style={{ margin: '0.2rem 0', fontWeight: 500 }}>{selectedGift.buyer_name} {selectedGift.buyer_last_name || ''}</p>
                <p style={{ margin: '0.2rem 0', color: 'var(--color-muted)', fontSize: '0.9rem' }}>Email: {selectedGift.buyer_email}</p>
                {selectedGift.buyer_whatsapp && (
                  <p style={{ margin: '0.2rem 0', color: 'var(--color-muted)', fontSize: '0.9rem' }}>WhatsApp: {selectedGift.buyer_whatsapp}</p>
                )}
                {selectedGift.invoice_requested && (
                  <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', borderRadius: '6px', fontSize: '0.85rem' }}>
                    <strong style={{ display: 'block', marginBottom: '0.25rem' }}>🎫 Requiere Factura Electrónica</strong>
                    <div style={{ paddingLeft: '1.2rem', opacity: 0.9 }}>
                      Razon Social/Nombre: {selectedGift.invoice_name}<br/>
                      Cédula: {selectedGift.invoice_id_number}<br/>
                      Dirección: {selectedGift.invoice_address}<br/>
                      Cod. Actividad: {selectedGift.invoice_activity_code}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ padding: '1rem', border: '1px solid var(--color-border)', borderRadius: '8px', background: 'var(--color-surface)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '0.9rem', color: 'var(--color-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Destinatario y Entrega</h3>
                    <p style={{ margin: '0.2rem 0', fontWeight: 500 }}>{selectedGift.recipient_name} {selectedGift.recipient_last_name}</p>
                    <p style={{ margin: '0.2rem 0', fontSize: '0.9rem' }}>Email: {selectedGift.recipient_email}</p>
                    <p style={{ margin: '0.2rem 0', fontSize: '0.9rem' }}>WhatsApp: {selectedGift.recipient_whatsapp}</p>
                  </div>
                  {selectedGift.recipient_whatsapp && (
                    <a 
                      href={`https://wa.me/${selectedGift.recipient_whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${selectedGift.recipient_name}, somos Dárboles. Tengo un presente que entregarle, ¿me compartes la ubicación donde puedo hacer la entrega por favor?`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ padding: '0.5rem 1rem', background: '#25D366', color: '#fff', textDecoration: 'none', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg> 
                      Contactar
                    </a>
                  )}
                </div>
                {selectedGift.recipient_address && (
                  <p style={{ margin: '0.2rem 0', fontSize: '0.9rem' }}>Dirección: {selectedGift.recipient_address}</p>
                )}
                {selectedGift.send_date && (
                  <p style={{ margin: '0.2rem 0', fontSize: '0.9rem' }}>Fecha Solicitada: {selectedGift.send_date}</p>
                )}
                {selectedGift.shipping_cost_applied !== undefined && selectedGift.shipping_cost_applied > 0 && (
                  <p style={{ margin: '0.2rem 0', fontSize: '0.9rem', color: 'var(--color-muted)' }}>Envío Cobrado: ${selectedGift.shipping_cost_applied}</p>
                )}
                {selectedGift.message && (
                  <div style={{ marginTop: '0.8rem', padding: '0.8rem', background: 'rgba(0,0,0,0.03)', borderRadius: '4px', fontStyle: 'italic', fontSize: '0.9rem' }}>
                    "{selectedGift.message}"
                  </div>
                )}
                {selectedGift.payment_receipt_url && (
                  <div style={{ marginTop: '0.8rem', padding: '0.8rem', border: '1px dashed #3b82f6', borderRadius: '4px' }}>
                    <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.85rem' }}>Comprobante SINPE Adjunto</h4>
                    <a href={`http://localhost:8001${selectedGift.payment_receipt_url}`} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline', fontSize: '0.9rem', fontWeight: 600 }}>Ver Imagen</a>
                  </div>
                )}
                {selectedGift.payment_receipt_method === 'whatsapp' && (
                  <div style={{ marginTop: '0.8rem', color: '#166534', background: '#f0fdf4', padding: '0.5rem', borderRadius: '4px', border: '1px solid #bbf7d0', fontSize: '0.85rem', fontWeight: 600 }}>
                    ✓ Cliente indicó que envió el comprobante por WhatsApp
                  </div>
                )}
              </div>

              <div style={{ padding: '1rem', border: '1px solid var(--color-border)', borderRadius: '8px', background: 'var(--color-surface)' }}>
                <h3 style={{ fontSize: '0.9rem', color: 'var(--color-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Árboles Solicitados</h3>
                {selectedGift.tree ? (
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {selectedGift.tree.image_url && (
                      <div style={{ width: '60px', height: '60px', borderRadius: '4px', overflow: 'hidden', background: '#ccc' }}>
                        <img src={selectedGift.tree.image_url} alt={selectedGift.tree.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                    <div>
                      <p style={{ margin: '0', fontWeight: 600 }}>{selectedGift.quantity}x {selectedGift.tree.name}</p>
                      <p style={{ margin: '0', fontSize: '0.85rem', color: 'var(--color-muted)' }}>{selectedGift.tree.scientific_name}</p>
                    </div>
                  </div>
                ) : (
                  <p>ID Especie: {selectedGift.tree_id} (Cantidad: {selectedGift.quantity})</p>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
