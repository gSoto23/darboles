import React from 'react';

export default function Privacidad() {
  return (
    <div style={{ paddingTop: '100px', minHeight: '100vh', paddingBottom: '100px' }}>
      <main className="page-container slide-up" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'left' }}>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', marginBottom: '2rem', letterSpacing: '-0.04em' }}>
          Política de Privacidad
        </h1>
        
        <div style={{ color: 'var(--color-muted)', fontSize: '1.125rem', lineHeight: '1.8' }}>
          <p style={{ marginBottom: '1.5rem' }}>
            Última actualización: {new Date().getFullYear()}
          </p>
          
          <h2 style={{ color: 'var(--color-foreground)', marginTop: '2.5rem', marginBottom: '1rem', fontSize: '1.5rem' }}>1. Información que Recopilamos</h2>
          <p style={{ marginBottom: '1.5rem' }}>
            En Dárboles recolectamos exclusivamente la información necesaria para gestionar tu cuenta, procesar pagos y mantener la operatividad de nuestras suscripciones. Esto incluye tu nombre, correo electrónico y preferencias de facturación. No almacenamos métodos de pago directamente; utilizamos procesadores certificados (Stripe / 4Geeks) para tal fin.
          </p>

          <h2 style={{ color: 'var(--color-foreground)', marginTop: '2.5rem', marginBottom: '1rem', fontSize: '1.5rem' }}>2. Tratamiento de Datos Botánicos y Destinatarios</h2>
          <p style={{ marginBottom: '1.5rem' }}>
            Cuando regalas un árbol, solicitamos el correo de la persona destinataria. Esta información es de circuito cerrado: solo se usa para notificarle de su certificado de reforestación. No vendemos ni cedemos bases de datos de remitentes ni beneficiarios a terceros corporativos ni agencias publicitarias.
          </p>

          <h2 style={{ color: 'var(--color-foreground)', marginTop: '2.5rem', marginBottom: '1rem', fontSize: '1.5rem' }}>3. Análisis y Mejoras</h2>
          <p style={{ marginBottom: '1.5rem' }}>
            Podemos recolectar metadatos técnicos (cookies esenciales, direcciones IP para métricas de tráfico) con la finalidad exclusiva de optimizar la plataforma, la velocidad de carga de nuestro dashboard de transparencia y garantizar una experiencia B2B y D2C fluida.
          </p>

          <h2 style={{ color: 'var(--color-foreground)', marginTop: '2.5rem', marginBottom: '1rem', fontSize: '1.5rem' }}>4. Tus Derechos de Control</h2>
          <p style={{ marginBottom: '1.5rem' }}>
            Mantienes poder absoluto sobre tus datos en nuestro servidor. Puedes solicitar su eliminación completa de nuestros registros contactándonos directamente a privacidad@darboles.com, salvo por el registro criptográfico de tu plantación de árboles si aplica, el cual se mantiene anónimo para auditorías ESG.
          </p>
        </div>
      </main>
    </div>
  );
}
