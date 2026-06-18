import sys
import os

# Add the backend path so we can import app modules properly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User
from app.models.tree import TreeSpecies
from app.models.gift import Gift
from app.core.security import get_password_hash
from datetime import date

def seed():
    db = SessionLocal()
    try:
        print("Starting seed...")

        # 1. Super User
        admin1 = db.query(User).filter_by(email="darboles@gmail.com").first()
        if not admin1:
            admin1 = User(
                email="darboles@gmail.com", 
                hashed_password=get_password_hash("231287"), 
                is_admin=True, 
                is_superadmin=True, 
                full_name="Super Admin"
            )
            db.add(admin1)
            print("Created Super Admin: darboles@gmail.com")

        # 2. Admin Normal
        test1 = db.query(User).filter_by(email="test@darboles.com").first()
        if not test1:
            test1 = User(
                email="test@darboles.com", 
                hashed_password=get_password_hash("231287"), 
                is_admin=True, 
                is_superadmin=False, 
                full_name="Admin Normal"
            )
            db.add(test1)
            print("Created Admin Normal: test@darboles.com")

        # 3. Comprador Normal
        user1 = db.query(User).filter_by(email="user@darboles.com").first()
        if not user1:
            user1 = User(
                email="user@darboles.com", 
                hashed_password=get_password_hash("123456"), 
                is_admin=False, 
                is_superadmin=False, 
                full_name="Comprador Normal"
            )
            db.add(user1)
            print("Created Comprador: user@darboles.com")

        db.commit()

        # Fetch models to ensure they have an ID
        user1 = db.query(User).filter_by(email="user@darboles.com").first()

        # Seed 12 new species
        species_data = [
            {"name": "Limón Mesino", "scientific_name": "Citrus × aurantiifolia", "description": "Árbol cítrico ideal para patios y macetones.", "co2": 15.0, "price": 15000, "image": "/api/uploads/trees/limon_mesino.png"},
            {"name": "Mandarina Clementina", "scientific_name": "Citrus × clementina", "description": "Cítrico de tamaño manejable y estético, produce fruta dulce.", "co2": 15.0, "price": 15000, "image": "/api/uploads/trees/mandarina_clementina.png"},
            {"name": "Limon Mandarina", "scientific_name": "Citrus × taitensis", "description": "Árbol cítrico con frutos anaranjados, ideal para jardines.", "co2": 15.0, "price": 15000, "image": "/api/uploads/trees/limon_mandarina.png"},
            {"name": "Cas", "scientific_name": "Psidium friedrichsthalianum", "description": "Frutal menor, de porte arbustivo y compacto.", "co2": 14.0, "price": 15000, "image": "/api/uploads/trees/cas.png"},
            {"name": "Guayaba", "scientific_name": "Psidium guajava", "description": "Porte de arbusto o árbol pequeño, muy manejable.", "co2": 14.0, "price": 15000, "image": "/api/uploads/trees/guayaba.png"},
            {"name": "Mango", "scientific_name": "Mangifera indica", "description": "Frutal tropical de hermoso follaje rojizo en hojas jóvenes.", "co2": 25.0, "price": 15000, "image": "/api/uploads/trees/mango.png"},
            {"name": "Manzana de Agua", "scientific_name": "Syzygium malaccense", "description": "Árbol de vistosas flores rojas y frutos en forma de campana.", "co2": 20.0, "price": 15000, "image": "/api/uploads/trees/manzana_agua.png"},
            {"name": "Aguacate", "scientific_name": "Persea americana", "description": "Árbol frutal de hojas grandes y verdes, muy apreciado.", "co2": 20.0, "price": 15000, "image": "/api/uploads/trees/aguacate.png"},
            {"name": "Franjipani", "scientific_name": "Plumeria rubra", "description": "Arbolito de poco follaje pero con flores increíblemente fragantes.", "co2": 10.0, "price": 15000, "image": "/api/uploads/trees/franjipani.png"},
            {"name": "Calistemo", "scientific_name": "Callistemon viminalis", "description": "Árbol pequeño con flores rojas tipo limpiatubos.", "co2": 15.0, "price": 15000, "image": "/api/uploads/trees/calistemo.png"},
            {"name": "Aromo", "scientific_name": "Acacia farnesiana", "description": "Árbol pequeño de flores amarillas muy aromáticas.", "co2": 15.0, "price": 15000, "image": "/api/uploads/trees/aromo.png"},
            {"name": "Naranja", "scientific_name": "Citrus × sinensis", "description": "Árbol cítrico clásico, excelente para producir fruta fresca.", "co2": 15.0, "price": 15000, "image": "/api/uploads/trees/naranja.png"}
        ]

        for s in species_data:
            existing = db.query(TreeSpecies).filter_by(name=s["name"]).first()
            if not existing:
                new_tree = TreeSpecies(
                    name=s["name"],
                    scientific_name=s["scientific_name"],
                    description=s["description"],
                    co2_capture_capacity_kg_per_year=s["co2"],
                    price_crc=s["price"],
                    image_url=s["image"],
                    stock=100
                )
                db.add(new_tree)
        db.commit()
        print("Created 12 Tree Species")

        tree1 = db.query(TreeSpecies).first()

        # Ensure User has 4 trees via Gifts
        gifts = db.query(Gift).filter_by(buyer_email="user@darboles.com").all()
        if len(gifts) < 4:
            needed = 4 - len(gifts)
            for i in range(needed):
                g = Gift(
                    buyer_name=user1.full_name,
                    buyer_email=user1.email,
                    tree_id=tree1.id,
                    quantity=1,
                    recipient_name="Self",
                    recipient_last_name="",
                    recipient_email=user1.email,
                    recipient_whatsapp="",
                    message="Prueba de árbol",
                    send_date=date.today(),
                    status="sent",
                    transaction_ref=f"TEST_TX_{i+len(gifts)}"
                )
                db.add(g)
            db.commit()
            print(f"Added {needed} test trees (gifts) to user@darboles.com")

        print("Seed completed successfully!")

    finally:
        db.close()

if __name__ == "__main__":
    seed()
