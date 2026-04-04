import React from 'react';

export default function Terminos() {
  return (
    <div style={{ paddingTop: '100px', minHeight: '100vh', paddingBottom: '100px' }}>
      <main className="page-container slide-up" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'left' }}>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', marginBottom: '2rem', letterSpacing: '-0.04em' }}>
          Términos y Condiciones
        </h1>
        
        <div style={{ color: 'var(--color-muted)', fontSize: '1.125rem', lineHeight: '1.8' }}>
          <p style={{ marginBottom: '1.5rem' }}>
            Última actualización: {new Date().getFullYear()}
          </p>
          
          <h2 style={{ color: 'var(--color-foreground)', marginTop: '2.5rem', marginBottom: '1rem', fontSize: '1.5rem' }}>1. Filosofía del Servicio</h2>
          <p style={{ marginBottom: '1.5rem' }}>
            Al utilizar Dárboles, estás conectándote a una infraestructura de conservación forestal localizada en Costa Rica. Nosotros ejecutamos el mantenimiento de la biomasa por ti bajo el esquema de suscripciones o de un obsequio singular. Nuestro modelo se enfoca en el ecosistema real con las variables que impone la propia naturaleza.
          </p>

          <h2 style={{ color: 'var(--color-foreground)', marginTop: '2.5rem', marginBottom: '1rem', fontSize: '1.5rem' }}>2. Riesgo Orgánico y Compromiso Operativo</h2>
          <p style={{ marginBottom: '1.5rem' }}>
            Como entidades biológicas, los árboles pueden sufrir daños fortuitos ligados al clima, fauna u otros riesgos orgánicos. Dárboles no puede comprometer la perpetuidad intocable de un único árbol específico frente a un desastre extremo; sin embargo, al comprar, adquieres nuestro compromiso tecnológico de replantación rotatoria, lo cual asegura que la cantidad de carbono y árboles del proyecto global se mantengan.
          </p>

          <h2 style={{ color: 'var(--color-foreground)', marginTop: '2.5rem', marginBottom: '1rem', fontSize: '1.5rem' }}>3. Suscripciones y Compensación Net-Zero</h2>
          <p style={{ marginBottom: '1.5rem' }}>
            Si adquieres una suscripción "Net-Zero", se facturarán cobros recurrentes acorde al cálculo de huella personal. Los fondos se dividen entre siembra, protección y mantenimiento tecnológico (servidores, API, geoposicionamiento y desarrollo). Puedes pausar o cancelar tu suscripción en cualquier momento accediendo al panel principal.
          </p>

          <h2 style={{ color: 'var(--color-foreground)', marginTop: '2.5rem', marginBottom: '1rem', fontSize: '1.5rem' }}>4. Certificados PDF y Reclamaciones B2B Corporativas</h2>
          <p style={{ marginBottom: '1.5rem' }}>
            La generación de certificados en formato digital está automatizada. Cualquier reclamación relacionada a facturación de volumen (B2B), erratas biológicas (científicas) o incidencias deberá comunicarse por el portal administrativo a fin de gestionarse acorde a los reportes de reforestación del año fiscal vigente. 
          </p>
        </div>
      </main>
    </div>
  );
}
