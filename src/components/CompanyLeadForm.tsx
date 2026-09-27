"use client";

import { useState } from 'react';
import { useTranslations } from '@/context/TranslationContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1";

type Motor = 'regalo_corporativo' | 'esg';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

interface Props {
  // "empresas" o "contacto": cambia el título, el formulario es el mismo
  variant?: 'empresas' | 'contacto';
  defaultMotor?: Motor;
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const inputStyle = { width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-foreground)', fontSize: '1rem', fontFamily: 'inherit' };
const labelStyle = { display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.95rem' };

export default function CompanyLeadForm({ variant = 'empresas', defaultMotor = 'regalo_corporativo' }: Props) {
  const { t } = useTranslations();
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', motor: defaultMotor as Motor, message: '', website: '' });
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  // Mismas reglas que el backend, para avisar antes de enviar
  const validate = (): string[] => {
    const codes: string[] = [];
    if (!form.name.trim()) codes.push('name_required');
    if (!form.email.trim() && !form.phone.trim()) codes.push('contact_required');
    if (form.email.trim() && !EMAIL_RE.test(form.email.trim())) codes.push('email_invalid');
    if (!consent) codes.push('consent_required');
    return codes;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const local = validate();
    if (local.length) {
      setErrors(local.map(code => t(`lead.errors.${code}`)));
      return;
    }
    setSending(true);
    setErrors([]);
    try {
      const res = await fetch(`${API_URL}/leads/empresas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, consent }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setDone(true);
        window.gtag?.('event', 'generate_lead', { lead_source: 'darboles.com', motor: form.motor });
        return;
      }
      // Los mensajes de tomatocr.com ya vienen redactados; los códigos propios se traducen
      const messages: string[] = Array.isArray(data.messages) && data.messages.length
        ? data.messages
        : (Array.isArray(data.errors) && data.errors.length ? data.errors : ['unavailable']).map((code: string) => t(`lead.errors.${code}`));
      setErrors(messages);
    } catch {
      setErrors([t('lead.errors.network')]);
    } finally {
      setSending(false);
    }
  };

  if (done) {
    return (
      <div id="cotizar" role="status" style={{ scrollMarginTop: '100px', maxWidth: '640px', margin: '0 auto', textAlign: 'center', padding: '3rem 2rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌳</div>
        <h2 style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>{t('lead.success.title')}</h2>
        <p style={{ color: 'var(--color-muted)', fontSize: '1.1rem', lineHeight: 1.6 }}>{t('lead.success.body')}</p>
      </div>
    );
  }

  return (
    <form id="cotizar" onSubmit={handleSubmit} noValidate style={{ scrollMarginTop: '100px', maxWidth: '640px', margin: '0 auto', textAlign: 'left', padding: '2rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', display: 'grid', gap: '1.25rem' }}>
      <div>
        <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{t(`lead.title.${variant}`)}</h2>
        <p style={{ color: 'var(--color-muted)', lineHeight: 1.6, margin: 0 }}>{t('lead.subtitle')}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div>
          <label htmlFor="lead-name" style={labelStyle}>{t('lead.name')}</label>
          <input id="lead-name" autoComplete="name" required maxLength={150} value={form.name} onChange={set('name')} style={inputStyle} />
        </div>
        <div>
          <label htmlFor="lead-company" style={labelStyle}>{t('lead.company')}</label>
          <input id="lead-company" autoComplete="organization" maxLength={200} value={form.company} onChange={set('company')} style={inputStyle} />
        </div>
        <div>
          <label htmlFor="lead-email" style={labelStyle}>{t('lead.email')}</label>
          <input id="lead-email" type="email" autoComplete="email" maxLength={150} value={form.email} onChange={set('email')} style={inputStyle} />
        </div>
        <div>
          <label htmlFor="lead-phone" style={labelStyle}>{t('lead.phone')}</label>
          <input id="lead-phone" type="tel" autoComplete="tel" maxLength={30} value={form.phone} onChange={set('phone')} style={inputStyle} />
        </div>
      </div>
      <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem', margin: '-0.5rem 0 0 0' }}>{t('lead.contactHint')}</p>

      <div>
        <label htmlFor="lead-motor" style={labelStyle}>{t('lead.motor')}</label>
        <select id="lead-motor" value={form.motor} onChange={set('motor')} style={inputStyle}>
          <option value="regalo_corporativo">{t('lead.motors.regalo_corporativo')}</option>
          <option value="esg">{t('lead.motors.esg')}</option>
        </select>
      </div>

      <div>
        <label htmlFor="lead-message" style={labelStyle}>{t('lead.message')}</label>
        <textarea id="lead-message" rows={4} maxLength={3000} value={form.message} onChange={set('message')} placeholder={t('lead.messagePh')} style={{ ...inputStyle, resize: 'vertical' }} />
      </div>

      {/* Campo trampa: invisible para las personas, los bots lo llenan */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: '1px', height: '1px', overflow: 'hidden' }}>
        <label htmlFor="lead-website">Website</label>
        <input id="lead-website" tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} />
      </div>

      <label style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', cursor: 'pointer', fontSize: '0.95rem', lineHeight: 1.5 }}>
        <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} required style={{ width: '18px', height: '18px', marginTop: '0.15rem', flexShrink: 0 }} />
        <span>
          {t('lead.consent')}{' '}
          <a href="https://tomatocr.com/privacidad" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>{t('lead.consentLink')}</a>.
        </span>
      </label>

      {errors.length > 0 && (
        <div role="alert" style={{ color: '#b91c1c', background: '#fef2f2', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.95rem' }}>
          {errors.length === 1 ? errors[0] : (
            <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>{errors.map(err => <li key={err}>{err}</li>)}</ul>
          )}
        </div>
      )}

      <button type="submit" disabled={sending} style={{ padding: '1rem', borderRadius: '8px', border: 'none', background: 'var(--color-foreground)', color: 'var(--color-background)', fontWeight: 600, fontSize: '1.05rem', cursor: sending ? 'wait' : 'pointer' }}>
        {sending ? t('lead.sending') : t('lead.submit')}
      </button>

      <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem', textAlign: 'center', margin: 0 }}>
        {t('lead.whatsapp')} <a href="https://wa.me/50670808613" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>+506 7080-8613</a>
      </p>
    </form>
  );
}
