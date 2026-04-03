"use client";

import { useState } from 'react';
import styles from './Calculator.module.css';

export default function Calculator() {
  const [step, setStep] = useState(1);
  const [carKm, setCarKm] = useState(150);
  const [flightHours, setFlightHours] = useState(10);
  const [diet, setDiet] = useState('omnivoro');
  const [totalCarbon, setTotalCarbon] = useState(0);

  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  const calculateFootprint = () => {
    // Parámetros mundiales genéricos:
    // Coche: ~0.20 kg CO2 per km * 52 semanas
    const carCarbonAnnual = carKm * 52 * 0.20;

    // Vuelo: ~250 kg CO2 per hour
    const flightCarbonAnnual = flightHours * 250;

    // Dieta: Omnivoro (2500kg), Vegetariano (1700kg), Vegano (1500kg)
    let dietCarbon = 2500;
    if (diet === 'vegetariano') dietCarbon = 1700;
    if (diet === 'vegano') dietCarbon = 1500;

    // Total anual en Toneladas (dividir entre 1000)
    const totalKg = carCarbonAnnual + flightCarbonAnnual + dietCarbon;
    setTotalCarbon(+(totalKg / 1000).toFixed(2));
    setStep(4);
  };

  const handleCheckout = async () => {
    if (!customerEmail || !customerName) {
      alert("Por favor ingresa tu nombre y correo para continuar.");
      return;
    }
    setLoadingCheckout(true);
    try {
      const amount = Math.ceil(totalCarbon * 12);

      const payload = {
        total_carbon: totalCarbon,
        amount_usd: amount,
        customer_email: customerEmail,
        customer_name: customerName
      };

      const res = await fetch("http://localhost:8001/api/v1/payments/checkout/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        alert("Error al iniciar checkout: " + (data.detail || "Error desconocido"));
      }
    } catch (e) {
      alert("Error de conexión con el servidor");
    } finally {
      setLoadingCheckout(false);
    }
  };

  return (
    <div className={`${styles.calcContainer} fade-in`}>
      {step === 1 && (
        <div className="slide-up">
          <h2 className={styles.stepTitle}>Paso 1: Transporte Terrestre</h2>
          <div className={styles.inputGroup}>
            <span className={styles.label}>¿Cuántos Kilómetros conduces a la semana aproximádamente?</span>
            <div className={styles.sliderValue}>{carKm} km</div>
            <input
              type="range"
              min="0" max="1000" step="10"
              value={carKm}
              onChange={(e) => setCarKm(Number(e.target.value))}
              className={styles.slider}
            />
          </div>
          <div className={styles.actions}>
            <div /> {/* Spacing */}
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setStep(2)}>Siguiente</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="slide-up">
          <h2 className={styles.stepTitle}>Paso 2: Viajes Aéreos</h2>
          <div className={styles.inputGroup}>
            <span className={styles.label}>¿Cuántas horas de vuelo tomaste el último año?</span>
            <div className={styles.sliderValue}>{flightHours} h</div>
            <input
              type="range"
              min="0" max="100" step="1"
              value={flightHours}
              onChange={(e) => setFlightHours(Number(e.target.value))}
              className={styles.slider}
            />
          </div>
          <div className={styles.actions}>
            <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setStep(1)}>Atrás</button>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setStep(3)}>Siguiente</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="slide-up">
          <h2 className={styles.stepTitle}>Paso 3: Hábitos Alimenticios</h2>
          <div className={styles.inputGroup}>
            <span className={styles.label}>Nuestra dieta impacta fuertemente nuestra huella ecológica. Selecciona la más acorde a ti:</span>
            <div className={styles.optionsRow}>
              <button
                className={`${styles.optionBtn} ${diet === 'omnivoro' ? styles.active : ''}`}
                onClick={() => setDiet('omnivoro')}
              >
                Omnívora
              </button>
              <button
                className={`${styles.optionBtn} ${diet === 'vegetariano' ? styles.active : ''}`}
                onClick={() => setDiet('vegetariano')}
              >
                Vegetariana
              </button>
              <button
                className={`${styles.optionBtn} ${diet === 'vegano' ? styles.active : ''}`}
                onClick={() => setDiet('vegano')}
              >
                Vegana
              </button>
            </div>
          </div>
          <div className={styles.actions}>
            <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setStep(2)}>Atrás</button>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={calculateFootprint}>Calcular Mi Huella</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="slide-up">
          <div className={styles.resultContainer}>
            <span className={styles.label}>Tu huella de carbono estimada anual es de</span>
            <div className={styles.resultNumber}>{totalCarbon}t <span style={{ fontSize: '2rem' }}>CO₂</span></div>
            <p className={styles.resultSubtitle}>El promedio mundial es de 4.7 toneladas. Con Dárboles puedes neutralizar esto delegando la captura a nuestros bosques.</p>

            <div className={styles.subscriptionCard}>
              <h3>Suscripción de Mitigación Total</h3>
              <p style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
                Mantendremos al menos <strong>{Math.ceil((totalCarbon * 1000) / 25)} árboles vivos</strong> creciendo a tu nombre cada año para capturar esta cantidad exacta de CO2.
              </p>
              <div className={styles.price}>${Math.ceil(totalCarbon * 12)} <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--color-muted)' }}>/ mes</span></div>

              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Tus datos para iniciar</label>
                <input
                  type="text"
                  placeholder="Nombre completo"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc', fontSize: '1rem' }}
                />
                <input
                  type="email"
                  placeholder="Correo electrónico"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc', fontSize: '1rem' }}
                />
              </div>

              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                style={{ width: '100%', marginTop: '1.5rem' }}
                onClick={handleCheckout}
                disabled={loadingCheckout}
              >
                {loadingCheckout ? "Creando tu suscripción en 4Geeks..." : "Iniciar Patrocinio"}
              </button>
            </div>

            <div style={{ marginTop: '2rem' }}>
              <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setStep(1)}>Recalcular</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
