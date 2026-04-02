"use client";

import { useState, useEffect } from 'react';
import styles from './Admin.module.css';

interface TreeSpecies {
  id: number;
  name: string;
  scientific_name: string;
  price_usd: number;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'pedidos' | 'suscripciones' | 'catalogo'>('pedidos');
  const [trees, setTrees] = useState<TreeSpecies[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if user is admin
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
          window.location.href = '/dashboard';
          return;
        }
        const data = await res.json();
        if (!data.is_admin) {
          window.location.href = '/dashboard';
        } else {
          setIsAdmin(true);
        }
      } catch (e) {
        window.location.href = '/dashboard';
      }
    };
    checkAdmin();
  }, []);

  useEffect(() => {
    // Only fetch when catalog tab is entered
    if (activeTab === 'catalogo' && isAdmin) {
      fetch('http://localhost:8001/api/v1/admin/trees')
        .then(res => res.json())
        .then(data => setTrees(data))
        .catch(err => console.error(err));
    }
  }, [activeTab, isAdmin]);

  if (!isAdmin) return null; // Evitar pantallazos mientras chequea

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
      </aside>

      <main className={`${styles.mainContent} fade-in`}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>
              {activeTab === 'pedidos' && 'Gestor de Entregas y Checkout'}
              {activeTab === 'suscripciones' && 'Panel de Suscripciones (Stripe)'}
              {activeTab === 'catalogo' && 'Control de Especies e Inventario'}
            </h1>
            <p className={styles.subtitle}>
              Monitor central del ecosistema Dárboles.
            </p>
          </div>
          {activeTab === 'catalogo' && (
            <button className={styles.addBtn}>+ Añadir Especie</button>
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
             <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
               <h3 style={{ marginBottom: '1rem' }}>Módulo de Suscripciones en Construcción</h3>
               <p style={{ color: 'var(--color-muted)' }}>Esperando integración de Stripe API para rellenar los datos recurrentes.</p>
             </div>
          </div>
        )}

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
                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>Cargando catálogo desde Backend...</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

      </main>
    </div>
  );
}
