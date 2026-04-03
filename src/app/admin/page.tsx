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
  const [farms, setFarms] = useState<Farm[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

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

  useEffect(() => {
    if (!isAdmin) return;
    const token = localStorage.getItem('token');

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
              data={[
                { id: 'ORD-891', client: 'Prueba Local', tree: 'Cedro Amargo', ref: 'SINPE-12345', status: 'Verificado' },
                { id: 'ORD-892', client: 'María Conejo', tree: 'Corteza Amarilla', ref: 'SINPE-99121', status: 'Validando SINPE' }
              ]} 
              columns={[
                { key: 'id', label: 'ID Pedido', render: (row: any) => `#${row.id}` },
                { key: 'client', label: 'Cliente', render: (row: any) => <span style={{ fontWeight: 500 }}>{row.client}</span> },
                { key: 'tree', label: 'Árbol Solicitado' },
                { key: 'ref', label: 'Referencia Bancaria', render: (row: any) => <span style={{ color: 'var(--color-muted)' }}>{row.ref}</span> },
                { key: 'status', label: 'Estado', render: (row: any) => <span className={`${styles.statusBadge} ${row.status === 'Verificado' ? styles.statusSuccess : styles.statusPending}`}>{row.status}</span> }
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

    </div>
  );
}
