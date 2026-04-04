import os
from smtplib import SMTP_SSL, SMTP
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication

# Configuraciones de Entorno
SMTP_SERVER = os.getenv("SMTP_SERVER", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SENDER_EMAIL = os.getenv("SENDER_EMAIL", "no-reply@darboles.com")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3001")

def send_reset_password_email(to_email: str, token: str):
    reset_link = f"{FRONTEND_URL}/recuperar?token={token}"
    
    # MODO DESARROLLO: Si no hay SMTP configurado, imprimir el enlace en consola
    if not SMTP_SERVER or not SMTP_USERNAME:
        print("="*60)
        print(f"SIMULACIÓN DE CORREO SMTP (Modo Desarrollo)")
        print(f"Para: {to_email}")
        print(f"Asunto: Recuperación de Contraseña - Dárboles")
        print(f"Enlace seguro: {reset_link}")
        print("="*60)
        return True

    # MODO PRODUCCIÓN: Enviar correo real
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Restablece tu contraseña - Dárboles"
    msg["From"] = SENDER_EMAIL
    msg["To"] = to_email

    text = f"Hola,\n\nHaz clic en el siguiente enlace de un solo uso para establecer tu nueva contraseña en Dárboles. Este enlace expira en 15 minutos.\n\n{reset_link}\n\nSi no fuiste tú, ignora este mensaje."
    html_content = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background: #ffffff;">
        <h2 style="color: #0A0A0A; letter-spacing: -0.02em; font-size: 24px;">Restablecer Contraseña</h2>
        <p style="color: #666666; font-size: 16px; line-height: 1.6;">Hemos recibido una solicitud para cambiar tu contraseña en Dárboles. Haz clic en el botón de abajo para continuar. El enlace es válido por 15 minutos.</p>
        <div style="margin: 30px 0;">
            <a href="{reset_link}" style="display: inline-block; padding: 14px 28px; background-color: #0A0A0A; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500;">Restablecer Ahora</a>
        </div>
        <p style="color: #999999; font-size: 14px;">Si tú no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
    </div>
    """

    part1 = MIMEText(text, "plain")
    part2 = MIMEText(html_content, "html")
    msg.attach(part1)
    msg.attach(part2)

    try:
        # Se asume uso de TLS estándar
        from smtplib import SMTP
        server = SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.sendmail(SENDER_EMAIL, to_email, msg.as_string())
        server.quit()
        return True
    except Exception as e:
        print(f"Error enviando correo SMTP: {e}")
        return False

def send_certificate_email(to_email: str, subject: str, gift, tree_name: str, attachment_path: str):
    """
    Simulates or sends an email with the PDF attached.
    """
    if not SMTP_SERVER or not SMTP_USERNAME:
        print("="*60)
        print(f"SIMULACIÓN DE CORREO (Certificdo) -> Para: {to_email}")
        print(f"Asunto: {subject}")
        print(f"Adjunto: {attachment_path}")
        print("="*60)
        return True
        
    msg = MIMEMultipart("mixed")
    msg["Subject"] = subject
    msg["From"] = SENDER_EMAIL
    msg["To"] = to_email
    
    html_content = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background: #ffffff;">
        <h2 style="color: #0A0A0A;">Certificado Botánico de Dárboles</h2>
        <p style="color: #666666; font-size: 16px;">¡Hola {gift.recipient_name}!</p>
        <p style="color: #666666; font-size: 16px;">{gift.buyer_name} te ha obsequiado la tutela directa de la especie <strong>{tree_name}</strong> a través de nuestra infraestructura tecnológica de mitigación.</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #475569; font-style: italic;">"{gift.message or 'Un regalo al planeta y a ti.'}"</p>
        </div>
        
        <p style="color: #666666; font-size: 16px;">Adjunto a este correo encontrarás el certificado de propiedad y mitigación expedido por Dárboles. Guárdalo, es el documento oficial de esta siembra.</p>
        
        <p style="color: #999999; font-size: 14px; margin-top: 40px;">Verifica la autenticidad e injerencia climática en nuestro portal de transparencia.</p>
    </div>
    """
    msg.attach(MIMEText(html_content, "html"))
    
    # Attach PDF
    try:
        with open(attachment_path, "rb") as f:
            pdf_attachment = MIMEApplication(f.read(), _subtype="pdf")
            pdf_attachment.add_header('Content-Disposition', 'attachment', filename=f"{tree_name}_Certificado.pdf")
            msg.attach(pdf_attachment)
    except Exception as e:
        print(f"Error procesando archivo adjunto: {e}")
        return False

    try:
        from smtplib import SMTP
        server = SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.sendmail(SENDER_EMAIL, to_email, msg.as_string())
        server.quit()
        return True
    except Exception as e:
        print(f"Error enviando correo SMTP: {e}")
        return False

def send_order_verified_email(to_email: str, buyer_name: str, order_id: str):
    if not SMTP_SERVER or not SMTP_USERNAME:
        print("="*60)
        print(f"SIMULACIÓN DE CORREO (Verificación SINPE) -> Para: {to_email}")
        print(f"Asunto: Pago Verificado - Pedido #{order_id}")
        print("="*60)
        return True

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Pago Verificado - Pedido #{order_id}"
    msg["From"] = SENDER_EMAIL
    msg["To"] = to_email

    html_content = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background: #ffffff;">
        <h2 style="color: #0A0A0A;">Pago Recibido Exitosamente</h2>
        <p style="color: #666666; font-size: 16px;">Hola {buyer_name},</p>
        <p style="color: #666666; font-size: 16px;">Hemos validado tu transferencia SINPE. Tu pedido <strong>#{order_id}</strong> se encuentra ahora en proceso de preparación y logística para su envío o siembra correspondiente.</p>
        <p style="color: #666666; font-size: 16px;">Te notificaremos una vez que la orden sea entregada.</p>
        <p style="color: #999999; font-size: 14px; margin-top: 40px;">Gracias por apoyar el ecosistema Dárboles.</p>
    </div>
    """
    msg.attach(MIMEText(html_content, "html"))

    try:
        from smtplib import SMTP
        server = SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.sendmail(SENDER_EMAIL, to_email, msg.as_string())
        server.quit()
        return True
    except Exception as e:
        print(f"Error enviando correo SMTP: {e}")
        return False

def send_order_delivered_email(to_email: str, recipient_name: str, tree_name: str, order_id: str):
    if not SMTP_SERVER or not SMTP_USERNAME:
        print("="*60)
        print(f"SIMULACIÓN DE CORREO (Pedido Entregado) -> Para: {to_email}")
        print(f"Asunto: Pedido Entregado - #{order_id}")
        print("="*60)
        return True

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Tu regalo ha sido entregado - Pedido #{order_id}"
    msg["From"] = SENDER_EMAIL
    msg["To"] = to_email

    html_content = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background: #ffffff;">
        <h2 style="color: #0A0A0A;">Paquete Entregado</h2>
        <p style="color: #666666; font-size: 16px;">Hola {recipient_name},</p>
        <p style="color: #666666; font-size: 16px;">Tu ejemplar de <strong>{tree_name}</strong> ha sido exitosamente entregado al destinatario para su cuidado y siembra.</p>
        <p style="color: #666666; font-size: 16px;">Agradecemos inmensamente tu participación activa en el proceso de regeneración climática. Cada acción cuenta.</p>
        <p style="color: #999999; font-size: 14px; margin-top: 40px;">Equipo Dárboles.</p>
    </div>
    """
    msg.attach(MIMEText(html_content, "html"))

    try:
        from smtplib import SMTP
        server = SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.sendmail(SENDER_EMAIL, to_email, msg.as_string())
        server.quit()
        return True
    except Exception as e:
        print(f"Error enviando correo SMTP: {e}")
        return False
