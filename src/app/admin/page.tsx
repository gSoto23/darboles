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
  price_usd: number;
  image_url: string;
}

interface Gift {
  id: number;
  buyer_name: string;
  buyer_email: string;
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
  tree?: TreeSpecies;
}

interface Farm {
  id: number;
  name: string;
  total_trees: number;
  trees_sold: number;
  carbon_capacity_tons: number;
  gps_location: string;
  caretaker_name: string;
  caretaker_contact: string;
}

interface Subscription {
  id: number;
  customer_name: string;
  customer_email: string;
  quantity: number;
  status: string;
  farm_id: number | null;
}

import Loader from '@/components/Loader';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'pedidos' | 'suscripciones' | 'catalogo' | 'fincas' | 'usuarios'>('pedidos');
  const [trees, setTrees] = useState<TreeSpecies[]>([]);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Gift Modal
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);

  // New Farm Modal State
  const [isFarmModalOpen, setIsFarmModalOpen] = useState(false);
  const [newFarm, setNewFarm] = useState({
    name: '', total_trees: 0, carbon_capacity_tons: 0, 
    gps_location: '', caretaker_name: '', caretaker_contact: ''
  });

  // Species Modal State
  const [isSpeciesModalOpen, setIsSpeciesModalOpen] = useState(false);
  const [editingSpeciesId, setEditingSpeciesId] = useState<number | null>(null);
  const [speciesForm, setSpeciesForm] = useState({
    name: '', scientific_name: '', price_usd: 0,
    description: '', co2_capture_capacity_kg_per_year: 0, image_url: ''
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

  const fetchFarms = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('http://localhost:8001/api/v1/inventory/farms', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setFarms(data);
    } catch(err) { console.error(err); }
  };

  const fetchSubscriptions = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('http://localhost:8001/api/v1/subscriptions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setSubscriptions(data);
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
    if (activeTab === 'fincas') {
      fetchFarms();
    }
    if (activeTab === 'suscripciones') {
      fetchSubscriptions();
      fetchFarms(); // need farms for the dropdown
    }
    if (activeTab === 'usuarios' && isSuperAdmin) {
      fetchUsers();
    }
  }, [activeTab, isAdmin, isSuperAdmin]);

  const handleCreateFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:8001/api/v1/inventory/farms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newFarm)
      });
      if (res.ok) {
        setIsFarmModalOpen(false);
        fetchFarms(); // Refresh
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenSpeciesModal = (species?: TreeSpecies) => {
    if (species) {
      setEditingSpeciesId(species.id);
      setSpeciesForm({
        name: species.name,
        scientific_name: species.scientific_name,
        price_usd: species.price_usd,
        description: species.description || '',
        co2_capture_capacity_kg_per_year: species.co2_capture_capacity_kg_per_year || 0,
        image_url: species.image_url || ''
      });
    } else {
      setEditingSpeciesId(null);
      setSpeciesForm({ name: '', scientific_name: '', price_usd: 0, description: '', co2_capture_capacity_kg_per_year: 0, image_url: '' });
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

  const handleAssignFarm = async (subId: number, farmIdStr: string) => {
    const token = localStorage.getItem('token');
    const farmId = farmIdStr ? parseInt(farmIdStr, 10) : null;
    try {
      await fetch(`http://localhost:8001/api/v1/subscriptions/${subId}/assign-farm`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ farm_id: farmId })
      });
      fetchSubscriptions();
    } catch (err) {
      console.error(err);
    }
  }

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
          className={`${styles.navItem} ${activeTab === 'suscripciones' ? styles.active : ''}`}
          onClick={() => setActiveTab('suscripciones')}
        >
          Suscripciones
        </button>
        <button 
          className={`${styles.navItem} ${activeTab === 'catalogo' ? styles.active : ''}`}
          onClick={() => setActiveTab('catalogo')}
        >
          Catálogo de Árboles
        </button>
        <button 
          className={`${styles.navItem} ${activeTab === 'fincas' ? styles.active : ''}`}
          onClick={() => setActiveTab('fincas')}
        >
          Net-Zero (Fincas)
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
              {activeTab === 'suscripciones' && 'Panel de Suscripciones (Calculadora)'}
              {activeTab === 'catalogo' && 'Control de Especies e Inventario'}
              {activeTab === 'fincas' && 'Monitoreo Global de Fincas'}
              {activeTab === 'usuarios' && 'Sistema de Roles y Accesos MAESTRO'}
            </h1>
            <p className={styles.subtitle}>
              Monitor central del ecosistema Dárboles.
            </p>
          </div>
          {activeTab === 'catalogo' && (
            <button className={styles.addBtn} onClick={() => handleOpenSpeciesModal()}>+ Añadir Especie</button>
          )}
          {activeTab === 'fincas' && (
            <button className={styles.addBtn} onClick={() => setIsFarmModalOpen(true)}>+ Añadir Finca</button>
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
                  <span className={`${styles.statusBadge} ${row.status === 'verified' || row.status === 'delivered' || row.status === 'sent' ? styles.statusSuccess : styles.statusPending}`}>
                    {row.status === 'verified' ? 'Verificado' : row.status === 'delivered' ? 'Entregado' : row.status === 'sent' ? 'Enviado' : row.status === 'pending' ? 'Pendiente' : row.status}
                  </span>
                ) },
                { key: 'actions', label: 'Acciones', render: (row: any) => (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button 
                        onClick={() => { setSelectedGift(row); setIsGiftModalOpen(true); }}
                        style={{ padding: '0.4rem 0.8rem', borderRadius: '4px', border: '1px solid var(--color-border)', cursor: 'pointer', background: 'transparent', fontSize: '0.8rem' }}
                      >Detalle</button>
                      
                      {row.status === 'pending' && row.transaction_ref?.startsWith('LOCAL-') && (
                        <button 
                          onClick={() => handleUpdateGiftStatus(row.id, 'verified')}
                          style={{ padding: '0.4rem 0.8rem', borderRadius: '4px', border: 'none', background: '#22c55e', color: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                        >Validar SINPE</button>
                      )}
                      
                      {(row.status === 'verified' || row.status === 'sent') && (
                        <button 
                          onClick={() => handleUpdateGiftStatus(row.id, 'delivered')}
                          style={{ padding: '0.4rem 0.8rem', borderRadius: '4px', border: 'none', background: '#3b82f6', color: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                        >Marcar Entregado</button>
                      )}
                    </div>
                )}
              ]} 
            />
          </div>
        )}

        {activeTab === 'suscripciones' && (
          <div className="slide-up">
            <SmartTable 
              data={subscriptions} 
              columns={[
                { key: 'id', label: 'ID', render: (row: any) => `#${row.id}` },
                { key: 'customer_name', label: 'Cliente Net-Zero', render: (row: any) => <><span style={{ fontWeight: 500 }}>{row.customer_name}</span><div style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>{row.customer_email}</div></> },
                { key: 'quantity', label: 'Árboles' },
                { key: 'status', label: 'Estado', render: (row: any) => <span className={`${styles.statusBadge} ${row.status === 'active' ? styles.statusSuccess : styles.statusPending}`}>{row.status}</span> },
                { key: 'farm_id', label: 'Asignación de Finca', render: (row: any) => (
                  <select 
                    value={row.farm_id || ''} 
                    onChange={(e) => handleAssignFarm(row.id, e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-foreground)', fontSize: '0.85rem', maxWidth: '200px', width: '100%', textOverflow: 'ellipsis' }}
                  >
                    <option value="">Finca NO Asignada</option>
                    {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
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
                { key: 'price_usd', label: 'Precio', render: (row: any) => `$${row.price_usd.toFixed(2)}` },
                { key: 'actions', label: 'Acciones', render: (row: any) => <button onClick={() => handleOpenSpeciesModal(row)} style={{ background: 'transparent', border: 'none', color: 'var(--color-muted)', cursor: 'pointer', textDecoration: 'underline' }}>Editar</button> }
              ]} 
            />
          </div>
        )}

        {activeTab === 'fincas' && (
          <div className="slide-up">
            <SmartTable 
              data={farms} 
              columns={[
                { key: 'id', label: 'ID', render: (row: any) => `#${row.id}` },
                { key: 'name', label: 'Nombre Operativo', render: (row: any) => <span style={{ fontWeight: 500 }}>{row.name}</span> },
                { key: 'gps_location', label: 'Coordenadas GPS', render: (row: any) => <a href={`https://www.google.com/maps?q=${row.gps_location}`} target="_blank" rel="noopener noreferrer" style={{ fontStyle: 'italic', color: 'var(--color-accent)', textDecoration: 'underline' }}>{row.gps_location}</a> },
                { key: 'total_trees', label: 'Árboles (Meta)', render: (row: any) => <><span style={{ fontWeight: 600 }}>{row.total_trees.toLocaleString()}</span> totales / <span style={{ color: 'var(--color-accent)'}}>{row.trees_sold.toLocaleString()}</span> vendidos</> },
                { key: 'carbon_capacity_tons', label: 'Capacidad de CO₂', render: (row: any) => `${row.carbon_capacity_tons.toLocaleString()} Toneladas` },
                { key: 'caretaker_name', label: 'Cuidador', render: (row: any) => `${row.caretaker_name} (${row.caretaker_contact})` }
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
      </main>

      {/* --- ADD FARM MODAL --- */}
      {isFarmModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}>
          <div style={{ background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: '1rem', width: '100%', maxWidth: '500px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Añadir Nueva Finca</h2>
              <button 
                onClick={() => setIsFarmModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--color-muted)' }}
              >×</button>
            </div>
            
            <form onSubmit={handleCreateFarm} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--color-muted)' }}>Nombre Operativo</label>
                <input required type="text" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-foreground)' }} value={newFarm.name} onChange={(e) => setNewFarm({...newFarm, name: e.target.value})} placeholder="Ej. Reserva Dárboles Guanacaste" />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--color-muted)' }}>Capacidad de Árboles Plantados</label>
                  <input required type="number" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-foreground)' }} value={newFarm.total_trees} onChange={(e) => setNewFarm({...newFarm, total_trees: parseInt(e.target.value, 10)})} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--color-muted)' }}>Toneladas de CO₂ Auditadas</label>
                  <input required type="number" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-foreground)' }} value={newFarm.carbon_capacity_tons} onChange={(e) => setNewFarm({...newFarm, carbon_capacity_tons: parseInt(e.target.value, 10)})} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--color-muted)' }}>Coordenadas GPS (Lat, Lng)</label>
                <input required type="text" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-foreground)' }} value={newFarm.gps_location} onChange={(e) => setNewFarm({...newFarm, gps_location: e.target.value})} placeholder="Ej. 10.612, -85.431" />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--color-muted)' }}>Nombre Guardabosques</label>
                  <input required type="text" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-foreground)' }} value={newFarm.caretaker_name} onChange={(e) => setNewFarm({...newFarm, caretaker_name: e.target.value})} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--color-muted)' }}>Teléfono</label>
                  <input required type="text" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-foreground)' }} value={newFarm.caretaker_contact} onChange={(e) => setNewFarm({...newFarm, caretaker_contact: e.target.value})} />
                </div>
              </div>

              <button type="submit" style={{ marginTop: '1rem', padding: '1rem', borderRadius: '8px', border: 'none', background: 'var(--color-foreground)', color: 'var(--color-background)', fontWeight: 600, cursor: 'pointer' }}>Guardar e Inicializar Finca</button>

            </form>
          </div>
        </div>
      )}

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
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--color-muted)' }}>Precio (USD)</label>
                  <input required type="number" step="0.01" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-foreground)' }} value={speciesForm.price_usd} onChange={(e) => setSpeciesForm({...speciesForm, price_usd: parseFloat(e.target.value)})} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--color-muted)' }}>URL Fotografía Alta Resolución</label>
                <input required type="text" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-foreground)' }} value={speciesForm.image_url} onChange={(e) => setSpeciesForm({...speciesForm, image_url: e.target.value})} placeholder="https://..." />
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
                <p style={{ margin: '0.2rem 0', fontWeight: 500 }}>{selectedGift.buyer_name}</p>
                <p style={{ margin: '0.2rem 0', color: 'var(--color-muted)', fontSize: '0.9rem' }}>{selectedGift.buyer_email}</p>
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
                {selectedGift.message && (
                  <div style={{ marginTop: '0.8rem', padding: '0.8rem', background: 'rgba(0,0,0,0.03)', borderRadius: '4px', fontStyle: 'italic', fontSize: '0.9rem' }}>
                    "{selectedGift.message}"
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
