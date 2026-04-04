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
        admin1 = db.query(User).filter_by(email="admin@darboles.com").first()
        if not admin1:
            admin1 = User(
                email="admin@darboles.com", 
                hashed_password=get_password_hash("231287"), 
                is_admin=True, 
                is_superadmin=True, 
                full_name="Super Admin"
            )
            db.add(admin1)
            print("Created Super Admin: admin@darboles.com")

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

        # Ensure we have at least one tree species
        tree1 = db.query(TreeSpecies).first()
        if not tree1:
            tree1 = TreeSpecies(
                name="Corteza Amarilla",
                scientific_name="Tabebuia ochracea",
                description="Árbol espectacular que florea en época seca.",
                co2_capture_capacity_kg_per_year=22.5,
                price_usd=25.0,
                image_url="https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?q=80&w=600"
            )
            db.add(tree1)
            db.commit()
            db.refresh(tree1)
            print("Created Tree Species")

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
