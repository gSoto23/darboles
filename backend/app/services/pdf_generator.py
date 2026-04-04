import os
from io import BytesIO
from datetime import datetime
from reportlab.lib.pagesizes import landscape, letter
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.lib import colors

# Constants
OUTPUT_DIR = "/tmp/darboles_certificates"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def generate_gift_certificate(gift, tree_species) -> str:
    """
    Generates a PDF certificate for a gifted tree using ReportLab.
    Returns the absolute path to the generated PDF.
    """
    filename = f"certificate_gift_{gift.id}_{datetime.now().timestamp()}.pdf"
    file_path = os.path.join(OUTPUT_DIR, filename)

    # Setup Canvas (Landscape mode for certificate look)
    c = canvas.Canvas(file_path, pagesize=landscape(letter))
    width, height = landscape(letter)

    # 1. Background Pattern / Border
    c.setStrokeColor(colors.HexColor("#0A0A0A"))
    c.setLineWidth(4)
    # Draw simple double border
    c.rect(0.5 * inch, 0.5 * inch, width - 1 * inch, height - 1 * inch)
    c.setLineWidth(1)
    c.rect(0.6 * inch, 0.6 * inch, width - 1.2 * inch, height - 1.2 * inch)

    # 2. Header and Branding
    c.setFillColor(colors.HexColor("#0A0A0A"))
    c.setFont("Helvetica-Bold", 40)
    c.drawCentredString(width / 2.0, height - 2 * inch, "Dárboles")
    
    c.setFont("Helvetica-Oblique", 14)
    c.setFillColor(colors.HexColor("#666666"))
    c.drawCentredString(width / 2.0, height - 2.5 * inch, "Infraestructura Tecnológica de Reconexión Ambiental")

    # 3. Main Title
    c.setFillColor(colors.HexColor("#0A0A0A"))
    c.setFont("Helvetica-Bold", 28)
    c.drawCentredString(width / 2.0, height / 2.0 + 1 * inch, "CERTIFICADO DE CONSERVACIÓN")

    # 4. Body Text
    c.setFont("Helvetica", 14)
    c.drawCentredString(width / 2.0, height / 2.0 + 0 * inch, "Este documento certifica con carácter perpetuo que:")

    # 5. Recipient Name
    c.setFont("Helvetica-Bold", 32)
    c.setFillColor(colors.HexColor("#1e293b"))
    c.drawCentredString(width / 2.0, height / 2.0 - 0.7 * inch, f"{gift.recipient_name} {gift.recipient_last_name}")

    # 6. Description Text
    c.setFillColor(colors.HexColor("#0A0A0A"))
    c.setFont("Helvetica", 14)
    
    qty = gift.quantity
    tree_text = f"{qty} árbol" if qty == 1 else f"{qty} árboles"
    body_1 = f"Es titular y guardián de {tree_text} de la especie"
    body_2 = f"{tree_species.name} ({tree_species.scientific_name})"
    body_3 = f"Un regalo otorgado por {gift.buyer_name} como legado de impacto climático."
    
    c.drawCentredString(width / 2.0, height / 2.0 - 1.4 * inch, body_1)
    c.setFont("Helvetica-Bold", 16)
    c.drawCentredString(width / 2.0, height / 2.0 - 1.8 * inch, body_2)
    
    c.setFont("Helvetica", 12)
    c.setFillColor(colors.HexColor("#475569"))
    c.drawCentredString(width / 2.0, height / 2.0 - 2.2 * inch, body_3)

    # 7. Signature and Date
    c.setFont("Helvetica", 10)
    c.drawString(1.5 * inch, 1.5 * inch, f"Fecha de Envío: {gift.send_date or datetime.now().strftime('%Y-%m-%d')}")
    c.drawString(1.5 * inch, 1.3 * inch, f"ID de Transacción: {gift.transaction_ref}")
    
    c.drawRightString(width - 1.5 * inch, 1.5 * inch, "Plataforma Dárboles Costa Rica")
    c.drawRightString(width - 1.5 * inch, 1.3 * inch, "Operaciones Net-Zero")

    c.showPage()
    c.save()

    return file_path
