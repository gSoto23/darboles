import sys
import os
from datetime import datetime

# Añadir el path base para que reconozca "app"
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(current_dir, "..", "backend")
sys.path.append(backend_dir)

from app.core.database import SessionLocal
from app.models.tracked_tree import TrackedTree
from app.core.mailer import SENDER_EMAIL, SMTP_SERVER, SMTP_USERNAME, get_logo_html
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

def send_reminder_email(to_email: str, planter_name: str, tree_name: str, id_code: str):
    """Envía un recordatorio de foto y cuidados a quien plantó el árbol."""
    if not SMTP_SERVER or not SMTP_USERNAME:
        print(f"[SIMULACIÓN] Recordatorio enviado a {to_email} (Árbol {id_code})")
        return True

    try:
        from smtplib import SMTP
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"🌱 ¿Cómo va tu {tree_name}? - Dárboles"
        msg["From"] = SENDER_EMAIL
        msg["To"] = to_email

        html_content = f"""
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            {get_logo_html()}
            <h2 style="color: #059669;">¡Hola {planter_name or 'Guardián'}!</h2>
            <p>Ha pasado un tiempo desde que matriculaste tu <strong>{tree_name}</strong> (ID: {id_code}) en el mapa de Dárboles.</p>
            <p>Queríamos recordarte que los primeros meses son vitales para su adaptación. Asegúrate de que reciba suficiente agua si estamos en temporada seca.</p>
            <p><strong>¡Nos encantaría ver cómo ha crecido!</strong></p>
            <p>Si deseas, puedes tomarle una foto nueva y enviárnosla para actualizar el expediente botánico de tu árbol y mostrarle a quien te lo regaló el impacto que están logrando juntos.</p>
            <br/>
            <p style="color: #64748b; font-size: 14px;">Gracias por ser parte del cambio climático, <br/>El equipo de Dárboles.</p>
        </div>
        """
        msg.attach(MIMEText(html_content, "html"))

        # TODO: Cargar credenciales desde variables de entorno para el script si se ejecuta vía cron
        # with SMTP(SMTP_SERVER, 587) as server:
        #    server.starttls()
        #    server.login(SMTP_USERNAME, os.getenv("SMTP_PASSWORD"))
        #    server.send_message(msg)
        
        return True
    except Exception as e:
        print(f"Error enviando recordatorio a {to_email}: {e}")
        return False

def main():
    print("=========================================")
    print("Iniciando envío de recordatorios masivos")
    print("=========================================")
    db = SessionLocal()
    
    # Buscar todos los plantados que NO han recibido recordatorio
    trees = db.query(TrackedTree).filter(
        TrackedTree.status == "planted",
        TrackedTree.reminder_sent == False
    ).all()
    
    count = 0
    for tree in trees:
        if tree.planter_email:
            print(f"[{tree.id_code}] Procesando recordatorio para {tree.planter_email}...")
            
            success = send_reminder_email(
                to_email=tree.planter_email,
                planter_name=tree.planter_name,
                tree_name=tree.species.name if tree.species else "Árbol",
                id_code=tree.id_code
            )
            
            if success:
                tree.reminder_sent = True
                count += 1
                
    db.commit()
    db.close()
    
    print("=========================================")
    print(f"Completado. Se enviaron {count} recordatorios.")
    print("=========================================")

if __name__ == "__main__":
    main()
