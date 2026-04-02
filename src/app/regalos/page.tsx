"use client";

import { useEffect, useState } from 'react';
import styles from './Regalos.module.css';

interface TreeSpecies {
  id: number;
  name: str;
  scientific_name: str;
  description: str;
  co2_capture_capacity_kg_per_year: number;
  price_usd: number;
  image_url: string;
}

export default function RegalosPage() {
  const [trees, setTrees] = useState<TreeSpecies[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [selectedTree, setSelectedTree] = useState<TreeSpecies | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<'info' | 'success'>('info');

  useEffect(() => {
    fetch('http://localhost:8001/api/v1/admin/trees')
      .then(res => res.json())
      .then(data => {
        setTrees(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching trees:", err);
        setLoading(false);
      });
  }, []);

  const handleBuyClick = (tree: TreeSpecies) => {
    setSelectedTree(tree);
    setCheckoutStep('info');
  };

  const handleConfirmOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutStep('success');
  };

  return (
    <div className={styles.container}>
      <main className="page-container slide-up">
        
        <header className={styles.intro}>
          <span className={styles.badge}>Mercado Local — Costa Rica</span>
          <h1 className={styles.title}>Regala Propósito.</h1>
          <p className={styles.subtitle}>
            Selecciona un árbol de nuestro catálogo criollo. Empacado en tecnología Zero-Waste, listo para ser enviado a todo el país o plantado en su nombre en nuestras fincas si lo prefieres de manera remota.
          </p>
        </header>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-muted)' }}>Cargando catálogo botánico...</div>
        ) : (
          <div className={styles.grid}>
            {trees.map((tree) => (
              <div key={tree.id} className={styles.productCard}>
                <div className={styles.imageArea}>
                  <img src={tree.image_url || 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?q=80&w=600'} alt={tree.name} />
                </div>
                <div className={styles.cardBody}>
                  <h2 className={styles.productName}>{tree.name}</h2>
                  <div className={styles.scientificName}>{tree.scientific_name}</div>
                  <p className={styles.description}>{tree.description}</p>
                  
                  <div className={styles.metrics}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    Captura {tree.co2_capture_capacity_kg_per_year}kg CO₂/año
                  </div>
                  
                  <div className={styles.priceRow}>
                    <div className={styles.price}>${tree.price_usd}</div>
                    <button 
                      className={styles.buyBtn}
                      onClick={() => handleBuyClick(tree)}
                    >
                      Regalar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Checkout Modal */}
      {selectedTree && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalContent} slide-up`}>
            <button className={styles.closeBtn} onClick={() => setSelectedTree(null)}>×</button>
            
            {checkoutStep === 'info' ? (
              <>
                <h3 className={styles.modalTitle}>Checkout: {selectedTree.name}</h3>
                <p style={{ color: 'var(--color-muted)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                  Completa tu regalo realizando una transferencia directa o SINPE Móvil. Nuestro equipo preparará el empaque especial de inmediato.
                </p>
                
                <div className={styles.transferBox}>
                  <div className={styles.transferRow}>
                    <span style={{ color: 'var(--color-muted)' }}>Monto a Enviar:</span>
                    <strong style={{ fontSize: '1.25rem' }}>${selectedTree.price_usd} / ₡{(selectedTree.price_usd * 515).toLocaleString()}</strong>
                  </div>
                  <div style={{ height: '1px', background: 'var(--color-border)', margin: '1rem 0' }}></div>
                  <div className={styles.transferRow}>
                    <span style={{ color: 'var(--color-muted)' }}>SINPE Móvil:</span>
                    <strong>8888-8888</strong>
                  </div>
                  <div className={styles.transferRow}>
                    <span style={{ color: 'var(--color-muted)' }}>A nombre de:</span>
                    <strong>Dárboles S.A.</strong>
                  </div>
                </div>

                <form onSubmit={handleConfirmOrder}>
                  <input type="text" placeholder="Nombre completo del remitente" className={styles.inputField} required />
                  <input type="email" placeholder="Correo electrónico de contacto" className={styles.inputField} required />
                  <input type="text" placeholder="# de Referencia o Comprobante SINPE" className={styles.inputField} required />
                  <button type="submit" className={styles.confirmBtn}>Confirmar Pedido</button>
                </form>
              </>
            ) : (
               <div className={styles.successState}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--color-accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '2rem' }}>✓</div>
                  <h3 className={styles.modalTitle}>¡Pedido Recibido!</h3>
                  <p style={{ color: 'var(--color-muted)', marginBottom: '2rem', lineHeight: 1.6 }}>
                    Hemos registrado tu comprobante exitosamente. En breve recibirás un correo con la confirmación y te enviaremos el enlace digital para que puedas personalizar el certificado de regalo. 
                  </p>
                  <button className={styles.confirmBtn} onClick={() => setSelectedTree(null)}>Volver al Catálogo</button>
               </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
