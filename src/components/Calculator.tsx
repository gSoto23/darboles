"use client";

import { useState } from 'react';
import styles from './Calculator.module.css';
import { useTranslations } from '@/context/TranslationContext';

export default function Calculator() {
  const { t } = useTranslations();
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
      alert(t("calc.err.email"));
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
        alert(t("calc.err.checkout") + (data.detail || "Error desconocido"));
      }
    } catch (e) {
      alert(t("calc.err.server"));
    } finally {
      setLoadingCheckout(false);
    }
  };

  return (
    <div className={`${styles.calcContainer} fade-in`}>
      {step === 1 && (
        <div className="slide-up">
          <h2 className={styles.stepTitle}>{t("calc.step1.title")}</h2>
          <div className={styles.inputGroup}>
            <span className={styles.label}>{t("calc.step1.q")}</span>
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
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setStep(2)}>{t("calc.btn.next")}</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="slide-up">
          <h2 className={styles.stepTitle}>{t("calc.step2.title")}</h2>
          <div className={styles.inputGroup}>
            <span className={styles.label}>{t("calc.step2.q")}</span>
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
            <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setStep(1)}>{t("calc.btn.back")}</button>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setStep(3)}>{t("calc.btn.next")}</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="slide-up">
          <h2 className={styles.stepTitle}>{t("calc.step3.title")}</h2>
          <div className={styles.inputGroup}>
            <span className={styles.label}>{t("calc.step3.q")}</span>
            <div className={styles.optionsRow}>
              <button
                className={`${styles.optionBtn} ${diet === 'omnivoro' ? styles.active : ''}`}
                onClick={() => setDiet('omnivoro')}
              >
                {t("calc.step3.opt1")}
              </button>
              <button
                className={`${styles.optionBtn} ${diet === 'vegetariano' ? styles.active : ''}`}
                onClick={() => setDiet('vegetariano')}
              >
                {t("calc.step3.opt2")}
              </button>
              <button
                className={`${styles.optionBtn} ${diet === 'vegano' ? styles.active : ''}`}
                onClick={() => setDiet('vegano')}
              >
                {t("calc.step3.opt3")}
              </button>
            </div>
          </div>
          <div className={styles.actions}>
            <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setStep(2)}>{t("calc.btn.back")}</button>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={calculateFootprint}>{t("calc.step3.btn")}</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="slide-up">
          <div className={styles.resultContainer}>
            <span className={styles.label}>{t("calc.step4.label")}</span>
            <div className={styles.resultNumber}>{totalCarbon}t <span style={{ fontSize: '2rem' }}>CO₂</span></div>
            <p className={styles.resultSubtitle}>{t("calc.step4.sub")}</p>

            <div className={styles.subscriptionCard}>
              <h3>{t("calc.step4.card.title")}</h3>
              <p style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
                {t("calc.step4.card.desc1")} <strong>{Math.ceil((totalCarbon * 1000) / 25)}{t("calc.step4.card.desc2")}</strong> {t("calc.step4.card.desc3")}
              </p>
              <div className={styles.price}>${Math.ceil(totalCarbon * 12)} <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--color-muted)' }}>{t("calc.step4.card.mo")}</span></div>

              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>{t("calc.step4.card.data")}</label>
                <input
                  type="text"
                  placeholder={t("calc.step4.card.ph1")}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc', fontSize: '1rem' }}
                />
                <input
                  type="email"
                  placeholder={t("calc.step4.card.ph2")}
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
                {loadingCheckout ? t("calc.step4.card.btn1") : t("calc.step4.card.btn2")}
              </button>
            </div>

            <div style={{ marginTop: '2rem' }}>
              <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setStep(1)}>{t("calc.step4.recalc")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
