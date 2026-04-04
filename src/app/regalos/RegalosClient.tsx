"use client";

import { useEffect, useState } from 'react';
import styles from './Regalos.module.css';

interface TreeSpecies {
  id: number;
  name: string;
  scientific_name: string;
  description: string;
  co2_capture_capacity_kg_per_year: number;
  price_usd: number;
  image_url: string;
}

interface CartItem {
  id: string; // Unique ID for the cart row
  tree: TreeSpecies;
  quantity: number;
  recipientName: string;
  recipientLastName: string;
  recipientEmail: string;
  recipientWhatsapp: string;
  recipientAddress?: string;
  message: string;
  sendDate: string | null;
}

export default function RegalosPage() {
  const [trees, setTrees] = useState<TreeSpecies[]>([]);
  const [loading, setLoading] = useState(true);

  // Shopping Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Modals UI state
  const [configTree, setConfigTree] = useState<TreeSpecies | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'success'>('cart');

  // Active Gift Configuration Form
  const [quantity, setQuantity] = useState(1);
  const [recipientName, setRecipientName] = useState("");
  const [recipientLastName, setRecipientLastName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientWhatsapp, setRecipientWhatsapp] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [message, setMessage] = useState("");
  const [sendDate, setSendDate] = useState("");

  // Final Checkout Form
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<'sinpe' | 'card'>('sinpe');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const resetConfigForm = () => {
    setQuantity(1);
    setRecipientName("");
    setRecipientLastName("");
    setRecipientEmail("");
    setRecipientWhatsapp("");
    setRecipientAddress("");
    setMessage("");
    setSendDate("");
  };

  const handleStartConfig = (tree: TreeSpecies) => {
    resetConfigForm();
    setConfigTree(tree);
  };

  const handleAddToCart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!configTree) return;

    const newItem: CartItem = {
      id: crypto.randomUUID(),
      tree: configTree,
      quantity,
      recipientName,
      recipientLastName,
      recipientEmail,
      recipientWhatsapp,
      recipientAddress: recipientAddress || undefined,
      message,
      sendDate: sendDate || null
    };

    setCartItems([...cartItems, newItem]);
    setConfigTree(null); // Close modal
  };

  const handeRemoveFromCart = (id: string) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const openCheckout = () => {
    setCheckoutStep('cart');
    setShowCheckout(true);
  };

  const cartTotalUsd = cartItems.reduce((acc, item) => acc + (item.tree.price_usd * item.quantity), 0);

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('http://localhost:8001/api/v1/payments/checkout/gift', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          buyer_name: buyerName,
          buyer_email: buyerEmail,
          payment_method: paymentMethod,
          total_amount_usd: cartTotalUsd,
          gifts: cartItems.map(item => ({
            tree_id: item.tree.id,
            quantity: item.quantity,
            recipient_name: item.recipientName,
            recipient_last_name: item.recipientLastName,
            recipient_email: item.recipientEmail,
            recipient_whatsapp: item.recipientWhatsapp,
            recipient_address: item.recipientAddress,
            message: item.message,
            send_date: item.sendDate
          }))
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Backend Error payload:", data);
        alert(`Hubo un error de validación: ${JSON.stringify(data.detail || data)}`);
        setIsSubmitting(false);
        return;
      }

      if (paymentMethod === 'card' && data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        // SINPE locally succeeds
        setCheckoutStep('success');
        setCartItems([]); // clear cart
      }
    } catch (error) {
      console.error("Payment submission error:", error);
      alert("Hubo un error procesando tu solicitud.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <main className="page-container slide-up">
        <header className={styles.intro}>
          <span className={styles.badge}>Regala un Arbol</span>
          <h1 className={styles.title}>Regala Propósito.</h1>
          <p className={styles.subtitle}>
            Arma tu carrito botánico. Puedes regalar diferentes especies a una misma persona o distribuir tu compra entre varios amigos. Todos recibirán un certificado único.
          </p>
        </header>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-muted)' }}>Cargando catálogo biológico...</div>
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
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" /><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" /></svg>
                    Captura {tree.co2_capture_capacity_kg_per_year}kg CO₂/año
                  </div>

                  <div className={styles.priceRow}>
                    <div className={styles.price}>${tree.price_usd}</div>
                    <button
                      className={styles.buyBtn}
                      onClick={() => handleStartConfig(tree)}
                    >
                      Configurar Regalo
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Floating Cart Button */}
      {cartItems.length > 0 && !showCheckout && !configTree && (
        <button className={styles.floatingCartBtn} onClick={openCheckout}>
          <div className={styles.cartBadge}>{cartItems.length}</div>
          Finalizar Compra (${cartTotalUsd})
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
        </button>
      )}

      {/* Gift Configuration Modal (Step 1 per tree) */}
      {configTree && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Personaliza este Regalo</h3>
              <div className={styles.modalSubtitle}>Vas a añadir: <strong>{configTree.name}</strong> (${configTree.price_usd} c/u)</div>
              <button type="button" className={styles.closeBtn} onClick={() => setConfigTree(null)}>×</button>
            </div>

            <div className={styles.modalBody}>
              <form onSubmit={handleAddToCart}>

                <div className={styles.formSection}>
                  <div className={styles.formSectionTitle}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
                    ¿Cuántos de este tipo deseas añadir?
                  </div>
                  <div className={styles.quantitySelector}>
                    <button type="button" className={styles.quantityBtn} onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}>-</button>
                    <span className={styles.quantityDisplay}>{quantity}</span>
                    <button type="button" className={styles.quantityBtn} onClick={() => setQuantity(quantity + 1)}>+</button>
                  </div>
                </div>

                <div className={styles.formSection}>
                  <div className={styles.formSectionTitle}>¿Para quién es?</div>
                  <div className={styles.formGrid}>
                    <div>
                      <label className={styles.inputLabel}>Nombre</label>
                      <input type="text" value={recipientName} onChange={e => setRecipientName(e.target.value)} required className={styles.inputField} placeholder="Ej: María" />
                    </div>
                    <div>
                      <label className={styles.inputLabel}>Apellido</label>
                      <input type="text" value={recipientLastName} onChange={e => setRecipientLastName(e.target.value)} required className={styles.inputField} placeholder="Ej: Pérez" />
                    </div>
                    <div>
                      <label className={styles.inputLabel}>Correo</label>
                      <input type="email" value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)} required className={styles.inputField} placeholder="Ej: maria@correo.com" />
                    </div>
                    <div>
                      <label className={styles.inputLabel}>WhatsApp</label>
                      <input type="tel" value={recipientWhatsapp} onChange={e => setRecipientWhatsapp(e.target.value)} required className={styles.inputField} placeholder="Ej: +506 8888 8888" />
                    </div>
                  </div>
                  <div style={{ marginTop: '1rem' }}>
                    <label className={styles.inputLabel}>Dirección de Envío (Opcional)</label>
                    <textarea value={recipientAddress} onChange={e => setRecipientAddress(e.target.value)} className={`${styles.inputField} ${styles.textareaField}`} style={{ minHeight: '60px' }} placeholder="Ej: San José, Escazú..."></textarea>
                  </div>
                  <div style={{ marginTop: '1rem' }}>
                    <label className={styles.inputLabel}>Mensaje de dedicatoria (Opcional)</label>
                    <textarea value={message} onChange={e => setMessage(e.target.value)} className={`${styles.inputField} ${styles.textareaField}`} placeholder="Escribe unas palabras bonitas..."></textarea>
                  </div>
                  <div style={{ marginTop: '1rem' }}>
                    <label className={styles.inputLabel}>Fecha programada de envío (Opcional)</label>
                    <input type="date" value={sendDate} onChange={e => setSendDate(e.target.value)} className={styles.inputField} />
                  </div>
                </div>

                <div className={styles.summaryBox}>
                  <div>
                    <div style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>Subtotal</div>
                    <div className={styles.summaryTotal}>${configTree.price_usd * quantity} USD</div>
                  </div>
                  <button type="submit" className={styles.confirmBtn}>
                    Añadir al Carrito
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>
      )}

      {/* Cart & Checkout Final Modal */}
      {showCheckout && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Tu Carrito de Regalos</h3>
              {!isSubmitting && checkoutStep !== 'success' && (
                <button type="button" className={styles.closeBtn} onClick={() => setShowCheckout(false)}>×</button>
              )}
            </div>

            <div className={styles.modalBody}>
              {checkoutStep === 'cart' ? (
                <form onSubmit={handleConfirmOrder}>
                  <div className={styles.cartList}>
                    {cartItems.map((item) => (
                      <div key={item.id} className={styles.cartItem}>
                        <div className={styles.cartItemInfo}>
                          <div className={styles.cartItemTitle}>{item.quantity}x {item.tree.name}</div>
                          <div className={styles.cartItemSubtitle}>Para: {item.recipientName}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span className={styles.cartItemPrice}>${item.tree.price_usd * item.quantity}</span>
                          <button type="button" className={styles.deleteBtn} onClick={() => handeRemoveFromCart(item.id)}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                          </button>
                        </div>
                      </div>
                    ))}

                    {cartItems.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-muted)' }}>
                        Carrito vacío.
                      </div>
                    )}
                  </div>

                  {cartItems.length > 0 && (
                    <>
                      <div className={styles.formSection}>
                        <div className={styles.formSectionTitle}>Sobre ti</div>
                        <div className={styles.formGrid}>
                          <div>
                            <label className={styles.inputLabel}>Tu Nombre</label>
                            <input type="text" value={buyerName} onChange={e => setBuyerName(e.target.value)} required className={styles.inputField} />
                          </div>
                          <div>
                            <label className={styles.inputLabel}>Tu Correo (Recibos)</label>
                            <input type="email" value={buyerEmail} onChange={e => setBuyerEmail(e.target.value)} required className={styles.inputField} />
                          </div>
                        </div>
                      </div>

                      <div className={styles.formSection}>
                        <div className={styles.formSectionTitle}>Método de Pago</div>
                        <div className={styles.paymentMethods}>
                          <div className={`${styles.paymentMethodCard} ${paymentMethod === 'sinpe' ? styles.active : ''}`} onClick={() => setPaymentMethod('sinpe')}>
                            <h4>SINPE Móvil</h4>
                            <p>Local</p>
                          </div>
                          <div className={`${styles.paymentMethodCard} ${paymentMethod === 'card' ? styles.active : ''}`} onClick={() => setPaymentMethod('card')}>
                            <h4>Tarjeta</h4>
                            <p>Global</p>
                          </div>
                        </div>

                        {paymentMethod === 'sinpe' && (
                          <div className={styles.transferBox}>
                            <div className={styles.transferRow}>
                              <span style={{ color: 'var(--color-muted)' }}>Monto a Transferir:</span>
                              <strong style={{ fontSize: '1.25rem' }}>${cartTotalUsd.toLocaleString()} / ₡{(cartTotalUsd * 515).toLocaleString()}</strong>
                            </div>
                            <div className={styles.transferRow}>
                              <span style={{ color: 'var(--color-muted)' }}>SINPE:</span>
                              <strong>8888-8888</strong>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className={styles.summaryBox}>
                        <div>
                          <div style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>Gran Total</div>
                          <div className={styles.summaryTotal}>${cartTotalUsd.toLocaleString()} USD</div>
                        </div>
                        <button type="submit" className={styles.confirmBtn} disabled={isSubmitting}>
                          {isSubmitting ? "Procesando..." : "Confirmar Orden"}
                        </button>
                      </div>
                    </>
                  )}
                </form>
              ) : (
                <div className={styles.successState}>
                  <div className={styles.successIcon}>✓</div>
                  <h3 className={styles.modalTitle}>¡Pedido Registrado con Éxito!</h3>
                  <p style={{ color: 'var(--color-muted)', marginBottom: '2rem', lineHeight: 1.6 }}>
                    Hemos anotado los datos de todos los destinatarios y sus respectivos certificados. Se enviarán en las fechas programadas tras confirmar el pago.
                  </p>
                  <button className={styles.confirmBtn} onClick={() => { setShowCheckout(false); setCheckoutStep('cart'); }} style={{ maxWidth: '200px', margin: '0 auto' }}>Volver al Catálogo</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
