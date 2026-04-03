"use client";

import { useState, useEffect } from 'react';
import styles from './Admin.module.css';

interface TreeSpecies {
  id: number;
  name: string;
  scientific_name: string;
  price_usd: number;
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

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'pedidos' | 'suscripciones' | 'catalogo' | 'fincas'>('pedidos');
  const [trees, setTrees] = useState<TreeSpecies[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // New Farm Modal State
  const [isFarmModalOpen, setIsFarmModalOpen] = useState(false);
  const [newFarm, setNewFarm] = useState({
    name: '', total_trees: 0, carbon_capacity_tons: 0, 
    gps_location: '', caretaker_name: '', caretaker_contact: ''
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
        }
      } catch (e) {
        window.location.href = '/login';
      }
    };
    checkAdmin();
  }, []);

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
  }, [activeTab, isAdmin]);

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

  if (!isAdmin) return null;

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div style={{ padding: '0 1rem', marginBottom: '2rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-muted)' }}>
          ADMINISTRACIÓN
        </div>
        <button 
          className={`${styles.navItem} ${activeTab === 'pedidos' ? styles.active : ''}`}
          onClick={() => setActiveTab('pedidos')}
        >
          Pedidos Locales (SINPE)
        </button>
        <button 
          className={`${styles.navItem} ${activeTab === 'suscripciones' ? styles.active : ''}`}
          onClick={() => setActiveTab('suscripciones')}
        >
          Suscripciones Internacionales
        </button>
        <button 
          className={`${styles.navItem} ${activeTab === 'catalogo' ? styles.active : ''}`}
          onClick={() => setActiveTab('catalogo')}
        >
          Catálogo de Especies
        </button>
        <button 
          className={`${styles.navItem} ${activeTab === 'fincas' ? styles.active : ''}`}
          onClick={() => setActiveTab('fincas')}
        >
          Inventario Net-Zero (Fincas)
        </button>
      </aside>

      <main className={`${styles.mainContent} fade-in`}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>
              {activeTab === 'pedidos' && 'Gestor de Entregas y Checkout'}
              {activeTab === 'suscripciones' && 'Panel de Suscripciones (Calculadora)'}
              {activeTab === 'catalogo' && 'Control de Especies e Inventario'}
              {activeTab === 'fincas' && 'Monitoreo Global de Fincas'}
            </h1>
            <p className={styles.subtitle}>
              Monitor central del ecosistema Dárboles.
            </p>
          </div>
          {activeTab === 'catalogo' && (
            <button className={styles.addBtn}>+ Añadir Especie</button>
          )}
          {activeTab === 'fincas' && (
            <button className={styles.addBtn} onClick={() => setIsFarmModalOpen(true)}>+ Añadir Finca</button>
          )}
        </header>

        {activeTab === 'pedidos' && (
          <div className="slide-up">
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>ID Pedido</th>
                  <th>Cliente</th>
                  <th>Árbol Solicitado</th>
                  <th>Referencia Bancaria</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>#ORD-891</td>
                  <td>Prueba Local</td>
                  <td>Cedro Amargo</td>
                  <td>SINPE-12345</td>
                  <td><span className={`${styles.statusBadge} ${styles.statusSuccess}`}>Verificado</span></td>
                </tr>
                <tr>
                  <td>#ORD-892</td>
                  <td>María Conejo</td>
                  <td>Corteza Amarilla</td>
                  <td>SINPE-99121</td>
                  <td><span className={`${styles.statusBadge} ${styles.statusPending}`}>Validando SINPE</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'suscripciones' && (
          <div className="slide-up">
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Cliente Net-Zero</th>
                  <th>Cantidad de Árboles</th>
                  <th>Estado</th>
                  <th>Asignación de Finca</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map(sub => (
                  <tr key={sub.id}>
                    <td>#{sub.id}</td>
                    <td style={{ fontWeight: 500 }}>{sub.customer_name} <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>{sub.customer_email}</div></td>
                    <td>{sub.quantity}</td>
                    <td><span className={`${styles.statusBadge} ${sub.status === 'active' ? styles.statusSuccess : styles.statusPending}`}>{sub.status}</span></td>
                    <td>
                      <select 
                        value={sub.farm_id || ''} 
                        onChange={(e) => handleAssignFarm(sub.id, e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-foreground)', fontSize: '0.85rem' }}
                      >
                        <option value="">Finca NO Asignada</option>
                        {farms.map(f => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
                {subscriptions.length === 0 && (
                   <tr>
                     <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>No hay suscripciones registradas.</td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* --- Catalog --- */}
        {activeTab === 'catalogo' && (
          <div className="slide-up">
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre Común</th>
                  <th>Nombre Científico</th>
                  <th>Precio Comercial</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {trees.length > 0 ? trees.map(tree => (
                  <tr key={tree.id}>
                    <td>#{tree.id}</td>
                    <td style={{ fontWeight: 500 }}>{tree.name}</td>
                    <td style={{ fontStyle: 'italic', color: 'var(--color-muted)' }}>{tree.scientific_name}</td>
                    <td>${tree.price_usd.toFixed(2)}</td>
                    <td><button style={{ background: 'transparent', border: 'none', color: 'var(--color-muted)', cursor: 'pointer', textDecoration: 'underline' }}>Editar</button></td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>Catálogo vacío.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* --- Fincas --- */}
        {activeTab === 'fincas' && (
          <div className="slide-up">
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre Operativo</th>
                  <th>GPS / Coord</th>
                  <th>Árboles (Plantados/Vendidos)</th>
                  <th>Capacidad de CO₂</th>
                  <th>Cuidador</th>
                </tr>
              </thead>
              <tbody>
                {farms.length > 0 ? farms.map(farm => (
                  <tr key={farm.id}>
                    <td>#{farm.id}</td>
                    <td style={{ fontWeight: 500 }}>{farm.name}</td>
                    <td>
                      <a href={`https://www.google.com/maps?q=${farm.gps_location}`} target="_blank" rel="noopener noreferrer" style={{ fontStyle: 'italic', color: 'var(--color-accent)', textDecoration: 'underline' }}>
                        {farm.gps_location}
                      </a>
                    </td>
                    <td><span style={{ fontWeight: 600 }}>{farm.total_trees.toLocaleString()}</span> totales / <span style={{ color: 'var(--color-accent)'}}>{farm.trees_sold.toLocaleString()}</span> asignados</td>
                    <td>{farm.carbon_capacity_tons.toLocaleString()} Toneladas</td>
                    <td>{farm.caretaker_name} ({farm.caretaker_contact})</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No hay fincas registradas en el inventario.</td>
                  </tr>
                )}
              </tbody>
            </table>
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

    </div>
  );
}
