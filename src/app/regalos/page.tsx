"use client";

import { useEffect, useState } from 'react';
import styles from './Regalos.module.css';
import { useTranslations } from '@/context/TranslationContext';

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
  shipping_cost_applied: number;
}

export default function RegalosPage() {
  const { t } = useTranslations();
  const [trees, setTrees] = useState<TreeSpecies[]>([]);
  const [loading, setLoading] = useState(true);
  const [country, setCountry] = useState('CR');

  // Shopping Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [storeConfig, setStoreConfig] = useState<any>(null);

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
  const [message, setMessage] = useState("");
  const [sendDate, setSendDate] = useState("");
  
  // Geographic Address State
  const [provincia, setProvincia] = useState("");
  const [canton, setCanton] = useState("");
  const [distrito, setDistrito] = useState("");
  const [direccionExacta, setDireccionExacta] = useState("");
  const [codigoPostal, setCodigoPostal] = useState("");

  const [provinciasList, setProvinciasList] = useState<{ [key: string]: string }>({});
  const [cantonesList, setCantonesList] = useState<{ [key: string]: string }>({});
  const [distritosList, setDistritosList] = useState<{ [key: string]: string }>({});

  // Final Checkout Form
  const [buyerName, setBuyerName] = useState("");
  const [buyerLastName, setBuyerLastName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerWhatsapp, setBuyerWhatsapp] = useState("");
  const [invoiceRequested, setInvoiceRequested] = useState(false);
  const [invoiceName, setInvoiceName] = useState("");
  const [invoiceIdNumber, setInvoiceIdNumber] = useState("");
  const [invoiceAddress, setInvoiceAddress] = useState("");
  const [invoiceActivityCode, setInvoiceActivityCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<'sinpe' | 'card'>('sinpe');
  const [receiptMethod, setReceiptMethod] = useState<'upload' | 'whatsapp'>('upload');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
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

    fetch('http://localhost:8001/api/v1/config')
      .then(res => res.json())
      .then(data => setStoreConfig(data))
      .catch(console.error);

    // Read NEXT_COUNTRY cookie
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return undefined;
    };
    const userCountry = getCookie('NEXT_COUNTRY');
    if (userCountry) {
      setCountry(userCountry);
    }
  }, []);

  useEffect(() => {
    if (configTree) {
      fetch('https://ubicaciones.paginasweb.cr/provincias.json')
        .then(res => res.json())
        .then(data => setProvinciasList(data))
        .catch(err => console.error("Error fetching provincias:", err));
    }
  }, [configTree]);

  useEffect(() => {
    if (provincia) {
      fetch(`https://ubicaciones.paginasweb.cr/provincia/${provincia}/cantones.json`)
        .then(res => res.json())
        .then(data => {
          setCantonesList(data);
          setCanton("");
          setDistritosList({});
          setDistrito("");
        })
        .catch(err => console.error("Error fetching cantones:", err));
    } else {
      setCantonesList({});
      setCanton("");
    }
  }, [provincia]);

  useEffect(() => {
    if (provincia && canton) {
      fetch(`https://ubicaciones.paginasweb.cr/provincia/${provincia}/canton/${canton}/distritos.json`)
        .then(res => res.json())
        .then(data => {
          setDistritosList(data);
          setDistrito("");
        })
        .catch(err => console.error("Error fetching distritos:", err));
    } else {
      setDistritosList({});
      setDistrito("");
    }
  }, [provincia, canton]);

  const resetConfigForm = () => {
    setQuantity(1);
    setRecipientName("");
    setRecipientLastName("");
    setRecipientEmail("");
    setRecipientWhatsapp("");
    setProvincia("");
    setCanton("");
    setDistrito("");
    setDireccionExacta("");
    setCodigoPostal("");
    setMessage("");
    setSendDate("");
  };

  const handleStartConfig = (tree: TreeSpecies) => {
    resetConfigForm();
    setConfigTree(tree);
  };

  const gamCantonsArray = storeConfig && storeConfig.gam_cantons 
    ? storeConfig.gam_cantons.split(',').map((c: string) => c.trim().toLowerCase()) 
    : [];

  const currentProvinciaName = provinciasList[provincia] || '';
  const currentCantonName = cantonesList[canton] || '';
  const compKey = `${currentProvinciaName}|${currentCantonName}`.toLowerCase();
  const legacyKey = currentCantonName.toLowerCase();
  const isCantonGAM = !!(currentCantonName && (gamCantonsArray.includes(compKey) || gamCantonsArray.includes(legacyKey)));
  
  // Shipping configuration
  const currentShippingCostCrc = storeConfig ? (isCantonGAM ? storeConfig.gam_shipping_cost : storeConfig.non_gam_shipping_cost) : 0;
  const currentDeliveryDays = storeConfig ? (isCantonGAM ? storeConfig.gam_delivery_days : storeConfig.non_gam_delivery_days) : '';
  const configTotal = (configTree ? configTree.price_crc * quantity : 0) + (provincia && canton ? currentShippingCostCrc : 0);

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
      recipientAddress: `${direccionExacta}, ${distritosList[distrito]}, ${cantonesList[canton]}, ${provinciasList[provincia]}${codigoPostal ? `. CP: ${codigoPostal}` : ""}`,
      message,
      sendDate: sendDate || null,
      shipping_cost_applied: provincia && canton ? currentShippingCostCrc : 0
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

  const cartTreeTotalCrc = cartItems.reduce((acc, item) => acc + (item.tree.price_crc * item.quantity), 0);
  const cartShippingTotalCrc = cartItems.reduce((acc, item) => acc + (item.shipping_cost_applied || 0), 0);
  const cartTotalCrc = cartTreeTotalCrc + cartShippingTotalCrc;

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
          buyer_last_name: buyerLastName,
          buyer_email: buyerEmail,
          buyer_whatsapp: buyerWhatsapp,
          invoice_requested: invoiceRequested,
          invoice_name: invoiceName,
          invoice_id_number: invoiceIdNumber,
          invoice_address: invoiceAddress,
          invoice_activity_code: invoiceActivityCode,
          payment_method: paymentMethod,
          payment_receipt_method: paymentMethod === 'sinpe' ? receiptMethod : null,
          total_amount_crc: cartTotalCrc,
          gifts: cartItems.map(item => ({
            tree_id: item.tree.id,
            quantity: item.quantity,
            recipient_name: item.recipientName,
            recipient_last_name: item.recipientLastName,
            recipient_email: item.recipientEmail,
            recipient_whatsapp: item.recipientWhatsapp,
            recipient_address: item.recipientAddress,
            message: item.message,
            send_date: item.sendDate,
            shipping_cost_applied: item.shipping_cost_applied
          }))
        })
      });

      if (!response.ok) {
        throw new Error(`Error en el servidor: ${response.status}`);
      }
      const data = await response.json();

      if (paymentMethod === 'card' && data.checkout_url) {
        window.location.href = data.checkout_url;
        return;
      } else {
        if (paymentMethod === 'sinpe' && receiptMethod === 'upload' && receiptFile && data.transaction_ref) {
            const formData = new FormData();
            formData.append('file', receiptFile);
            await fetch(`http://localhost:8001/api/v1/payments/checkout/upload-receipt/${data.transaction_ref}`, {
                method: 'POST',
                body: formData
            });
        }
        setCheckoutStep('success');
        setCartItems([]);
      }
    } catch (error) {
      console.error("Payment submission error:", error);
      alert("Hubo un error procesando tu solicitud.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <main className="page-container slide-up">
        <header className={styles.intro}>
          <span className={styles.badge}>{t("regalos.badge")}</span>
          <h1 className={styles.title}>{t("regalos.title")}</h1>
          <p className={styles.subtitle}>
            {t("regalos.subtitle")}
          </p>
        </header>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-muted)' }}>{t("regalos.loading")}</div>
        ) : (
          <div className={styles.grid}>
            {trees.filter(t => t.is_active).map((tree) => (
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
                    {t("regalos.metrics", { co2: tree.co2_capture_capacity_kg_per_year })}
                  </div>

                  <div className={styles.priceRow}>
                    <div className={styles.price}>₡{tree.price_crc}</div>
                    <button
                      className={styles.buyBtn}
                      disabled={tree.stock <= 0}
                      style={tree.stock <= 0 ? { background: 'var(--color-muted)', cursor: 'not-allowed' } : {}}
                      onClick={() => handleStartConfig(tree)}
                    >
                      {tree.stock > 0 ? t("regalos.buyBtn") : t("regalos.outOfStock")}
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
          {t("regalos.checkoutBtn")} (₡{cartTotalCrc})
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
        </button>
      )}

      {/* Gift Configuration Modal (Step 1 per tree) */}
      {configTree && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{t("regalos.modalConfig.title")}</h3>
              <div className={styles.modalSubtitle}>{t("regalos.modalConfig.subtitle")} <strong>{configTree.name}</strong> (₡{configTree.price_crc} c/u)</div>
              <button type="button" className={styles.closeBtn} onClick={() => setConfigTree(null)}>×</button>
            </div>

            <div className={styles.modalBody}>
              <form onSubmit={handleAddToCart}>

                <div className={styles.formSection}>
                  <div className={styles.formSectionTitle}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
                    {t("regalos.modalConfig.quantity")} <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)', fontWeight: 'normal', marginLeft: '0.5rem' }}>({t("regalos.maxStock")}: {configTree.stock})</span>
                  </div>
                  <div className={styles.quantitySelector}>
                    <button type="button" className={styles.quantityBtn} onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}>-</button>
                    <span className={styles.quantityDisplay}>{quantity}</span>
                    <button type="button" className={styles.quantityBtn} onClick={() => setQuantity(Math.min(configTree.stock, quantity + 1))} disabled={quantity >= configTree.stock}>+</button>
                  </div>
                </div>

                <div className={styles.formSection}>
                  <div className={styles.formSectionTitle}>{t("regalos.modalConfig.recipient")}</div>
                  <div className={styles.formGrid}>
                    <div>
                      <label className={styles.inputLabel}>{t("regalos.modalConfig.name")}</label>
                      <input type="text" value={recipientName} onChange={e => setRecipientName(e.target.value)} required className={styles.inputField} />
                    </div>
                    <div>
                      <label className={styles.inputLabel}>{t("regalos.modalConfig.lastName")}</label>
                      <input type="text" value={recipientLastName} onChange={e => setRecipientLastName(e.target.value)} required className={styles.inputField} />
                    </div>
                    <div>
                      <label className={styles.inputLabel}>{t("regalos.modalConfig.email")}</label>
                      <input type="email" value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)} required className={styles.inputField} />
                    </div>
                    <div>
                      <label className={styles.inputLabel}>{t("regalos.modalConfig.whatsapp")}</label>
                      <input type="tel" value={recipientWhatsapp} onChange={e => setRecipientWhatsapp(e.target.value)} required className={styles.inputField} />
                    </div>
                  </div>
                  <div style={{ marginTop: '1rem' }}>
                    <div className={styles.formSectionTitle} style={{ marginTop: '0', fontSize: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                      {t("regalos.modalConfig.address")}
                    </div>
                    <div className={styles.formGrid}>
                      <div>
                        <label className={styles.inputLabel}>{t("regalos.modalConfig.provincia")}</label>
                        <select value={provincia} onChange={e => setProvincia(e.target.value)} required className={styles.inputField}>
                          <option value="">{t("regalos.modalConfig.selectProvincia")}</option>
                          {Object.entries(provinciasList).map(([id, name]) => (
                            <option key={id} value={id}>{name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={styles.inputLabel}>{t("regalos.modalConfig.canton")}</label>
                        <select value={canton} onChange={e => setCanton(e.target.value)} required disabled={!provincia} className={styles.inputField}>
                          <option value="">{t("regalos.modalConfig.selectCanton")}</option>
                          {Object.entries(cantonesList).map(([id, name]) => (
                            <option key={id} value={id}>{name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={styles.inputLabel}>{t("regalos.modalConfig.distrito")}</label>
                        <select value={distrito} onChange={e => setDistrito(e.target.value)} required disabled={!canton} className={styles.inputField}>
                          <option value="">{t("regalos.modalConfig.selectDistrito")}</option>
                          {Object.entries(distritosList).map(([id, name]) => (
                            <option key={id} value={id}>{name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={styles.inputLabel}>{t("regalos.modalConfig.zip")}</label>
                        <input type="text" value={codigoPostal} onChange={e => setCodigoPostal(e.target.value)} className={styles.inputField} />
                      </div>
                    </div>
                    <div style={{ marginTop: '1rem' }}>
                      <label className={styles.inputLabel}>{t("regalos.modalConfig.exactAddress")}</label>
                      <textarea value={direccionExacta} onChange={e => setDireccionExacta(e.target.value)} required className={`${styles.inputField} ${styles.textareaField}`} style={{ minHeight: '60px' }}></textarea>
                    </div>
                  </div>
                  <div style={{ marginTop: '1rem' }}>
                    <label className={styles.inputLabel}>{t("regalos.modalConfig.message")}</label>
                    <textarea value={message} onChange={e => setMessage(e.target.value)} className={`${styles.inputField} ${styles.textareaField}`}></textarea>
                  </div>
                  <div style={{ marginTop: '1rem' }}>
                    <label className={styles.inputLabel}>{t("regalos.modalConfig.date")}</label>
                    <input type="date" value={sendDate} onChange={e => setSendDate(e.target.value)} className={styles.inputField} />
                  </div>
                </div>

                {provincia && canton && (
                  <div style={{ padding: '1rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                    <div style={{ color: 'var(--color-foreground)', fontWeight: 600, marginBottom: '0.25rem' }}>+ Costo de Envío: ₡{currentShippingCostCrc}</div>
                    <div style={{ color: 'var(--color-muted)', fontSize: '0.9rem', marginBottom: !isCantonGAM ? '0.5rem' : '0' }}>Tiempo estimado de entrega: {currentDeliveryDays}</div>
                    {!isCantonGAM && (
                      <div style={{ padding: '0.5rem 0.75rem', backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 500 }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                        Aviso: Para destinos fuera del GAM, el envío se realizará mediante Correos de Costa Rica.
                      </div>
                    )}
                  </div>
                )}

                <div className={styles.summaryBox}>
                  <div>
                    <div style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>{t("regalos.modalConfig.subtotal")}</div>
                    <div className={styles.summaryTotal}>₡{configTotal}</div>
                  </div>
                  <button type="submit" className={styles.confirmBtn}>
                    {t("regalos.modalConfig.addCart")}
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
              <h3 className={styles.modalTitle}>{t("regalos.checkout.title")}</h3>
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
                          <div className={styles.cartItemSubtitle}>{t("regalos.checkout.for")} {item.recipientName}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span className={styles.cartItemPrice}>₡{item.tree.price_crc * item.quantity}</span>
                          <button type="button" className={styles.deleteBtn} onClick={() => handeRemoveFromCart(item.id)}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                          </button>
                        </div>
                      </div>
                    ))}

                    {cartItems.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-muted)' }}>
                        {t("regalos.checkout.empty")}
                      </div>
                    )}
                  </div>

                  {cartItems.length > 0 && (
                    <>
                      <div className={styles.formSection}>
                        <div className={styles.formSectionTitle}>{t("regalos.checkout.aboutYou")}</div>
                        <div className={styles.formGrid}>
                          <div>
                            <label className={styles.inputLabel}>{t("regalos.checkout.buyerName")}</label>
                            <input type="text" value={buyerName} onChange={e => setBuyerName(e.target.value)} required className={styles.inputField} />
                          </div>
                          <div>
                            <label className={styles.inputLabel}>Apellido</label>
                            <input type="text" value={buyerLastName} onChange={e => setBuyerLastName(e.target.value)} required className={styles.inputField} />
                          </div>
                          <div>
                            <label className={styles.inputLabel}>WhatsApp</label>
                            <input type="text" value={buyerWhatsapp} onChange={e => setBuyerWhatsapp(e.target.value)} required className={styles.inputField} />
                          </div>
                          <div>
                            <label className={styles.inputLabel}>{t("regalos.checkout.buyerEmail")}</label>
                            <input type="email" value={buyerEmail} onChange={e => setBuyerEmail(e.target.value)} required className={styles.inputField} />
                          </div>
                        </div>

                        <div style={{ marginTop: '1.5rem' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer', fontWeight: 500, color: 'var(--color-foreground)' }}>
                            <input type="checkbox" checked={invoiceRequested} onChange={e => setInvoiceRequested(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                            Factura Electrónica
                          </label>
                        </div>
                        
                        {invoiceRequested && (
                          <div className={styles.formGrid} style={{ marginTop: '1rem', padding: '1rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '6px' }}>
                            <div>
                               <label className={styles.inputLabel}>Nombre o Razón Social</label>
                               <input type="text" value={invoiceName} onChange={e => setInvoiceName(e.target.value)} required className={styles.inputField} />
                            </div>
                            <div>
                               <label className={styles.inputLabel}>Número de Cédula</label>
                               <input type="text" value={invoiceIdNumber} onChange={e => setInvoiceIdNumber(e.target.value)} required className={styles.inputField} />
                            </div>
                            <div>
                               <label className={styles.inputLabel}>Dirección de Facturación</label>
                               <input type="text" value={invoiceAddress} onChange={e => setInvoiceAddress(e.target.value)} required className={styles.inputField} />
                            </div>
                            <div>
                               <label className={styles.inputLabel}>Código de Actividad</label>
                               <input type="text" value={invoiceActivityCode} onChange={e => setInvoiceActivityCode(e.target.value)} required className={styles.inputField} />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className={styles.formSection}>
                        <div className={styles.formSectionTitle}>{t("regalos.checkout.paymentMethod")}</div>
                        <div className={styles.paymentMethods}>
                          <div className={`${styles.paymentMethodCard} ${paymentMethod === 'sinpe' ? styles.active : ''}`} onClick={() => setPaymentMethod('sinpe')}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.2rem', color: 'var(--color-foreground)' }}>
                              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                            </div>
                            <h4 style={{ margin: 0 }}>SINPE Móvil</h4>
                          </div>
                          <div className={`${styles.paymentMethodCard} ${paymentMethod === 'card' ? styles.active : ''}`} onClick={() => setPaymentMethod('card')}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.2rem', color: 'var(--color-foreground)' }}>
                              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                            </div>
                            <h4 style={{ margin: 0 }}>Transferencia con Tarjeta</h4>
                          </div>
                        </div>

                        {paymentMethod === 'sinpe' && storeConfig && (
                          <div className={styles.transferBox}>
                            <div className={styles.transferRow}>
                              <span style={{ color: 'var(--color-muted)', flex: 1 }}>{t("regalos.checkout.totalAmount")}:</span>
                              <strong style={{ fontSize: '1.25rem', flex: 2, textAlign: 'right' }}>₡{cartTotalCrc.toLocaleString()}</strong>
                            </div>
                            <div className={styles.transferRow}>
                              <span style={{ color: 'var(--color-muted)', flex: 1 }}>A nombre de:</span>
                              <strong style={{ flex: 2, textAlign: 'right' }}>{storeConfig.sinpe_name}</strong>
                            </div>
                            <div className={styles.transferRow}>
                              <span style={{ color: 'var(--color-muted)', flex: 1 }}>Número SINPE:</span>
                              <strong style={{ fontSize: '1.25rem', flex: 2, textAlign: 'right' }}>{storeConfig.sinpe_number}</strong>
                            </div>

                            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600 }}>Comprobante de Pago</label>
                              
                              <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                                  <input type="radio" name="receiptMethod" checked={receiptMethod === 'upload'} onChange={() => setReceiptMethod('upload')} />
                                  Adjuntar imagen del recibo ahora
                                </label>
                                
                                {receiptMethod === 'upload' && (
                                  <div style={{ paddingLeft: '1.5rem' }}>
                                    <input type="file" accept="image/*" onChange={(e) => setReceiptFile(e.target.files?.[0] || null)} required style={{ fontSize: '0.8rem', padding: '0.5rem', border: '1px dashed var(--color-border)', width: '100%', borderRadius: '4px' }} />
                                  </div>
                                )}

                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                                  <input type="radio" name="receiptMethod" checked={receiptMethod === 'whatsapp'} onChange={() => setReceiptMethod('whatsapp')} />
                                  Lo enviaré al WhatsApp de Dárboles
                                </label>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className={styles.summaryBox}>
                        <div>
                          <div style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>{t("regalos.checkout.grandTotal")}</div>
                          <div className={styles.summaryTotal}>₡{cartTotalCrc.toLocaleString()}</div>
                        </div>
                        <button type="submit" className={styles.confirmBtn} disabled={isSubmitting}>
                          {isSubmitting ? t("regalos.checkout.processing") : t("regalos.checkout.confirmOrder")}
                        </button>
                      </div>
                    </>
                  )}
                </form>
              ) : (
                <div className={styles.successState}>
                  <div className={styles.successIcon}>✓</div>
                  <h3 className={styles.modalTitle}>{t("regalos.checkout.successTitle")}</h3>
                  <p style={{ color: 'var(--color-muted)', marginBottom: '2rem', lineHeight: 1.6 }}>
                    {t("regalos.checkout.successBody")}
                  </p>
                  <button className={styles.confirmBtn} onClick={() => { setShowCheckout(false); setCheckoutStep('cart'); }} style={{ maxWidth: '200px', margin: '0 auto' }}>{t("regalos.checkout.backBtn")}</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
