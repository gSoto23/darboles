import logging
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.gift import Gift
from app.models.tree import TreeSpecies
from app.services.pdf_generator import generate_gift_certificate
from app.core.mailer import send_certificate_email

logger = logging.getLogger(__name__)

def process_pending_gifts():
    """
    Looks for pending gifts where send_date is today or in the past,
    generates their certificate, and sends the email.
    """
    logger.info("Starting scheduled job: process_pending_gifts")
    db: Session = SessionLocal()
    try:
        today = datetime.now().date()
        # Find pending gifts due today or before today
        # Treat None send_date as immediate
        pending_gifts = db.query(Gift).filter(Gift.status == "pending").all()
        
        for gift in pending_gifts:
            if gift.send_date and gift.send_date > today:
                continue # not due yet
                
            tree = db.query(TreeSpecies).filter(TreeSpecies.id == gift.tree_id).first()
            if not tree:
                logger.error(f"Tree ID {gift.tree_id} not found for Gift ID {gift.id}")
                continue

            logger.info(f"Processing Gift ID {gift.id} for {gift.recipient_email}")
            
            # 1. Generate PDF
            pdf_path = generate_gift_certificate(gift, tree)
            
            # 2. Send Email
            subject = f"Tu regalo botánico de {gift.buyer_name} ha llegado"
            email_sent = send_certificate_email(
                to_email=gift.recipient_email,
                subject=subject,
                gift=gift,
                tree_name=tree.name,
                attachment_path=pdf_path
            )
            
            # 3. Update DB state
            if email_sent:
                gift.status = "sent"
                gift.certificate_url = pdf_path # we store the local path or s3 URL in production
                db.commit()
                logger.info(f"Gift {gift.id} processed and marked as sent.")
            else:
                logger.error(f"Failed to send email for Gift {gift.id}")

    except Exception as e:
        logger.error(f"Error processing pending gifts: {e}")
    finally:
        db.close()

def start_scheduler():
    scheduler = BackgroundScheduler()
    # Runs every day at 06:00 AM
    scheduler.add_job(
        process_pending_gifts,
        CronTrigger(hour=6, minute=0),
        id="daily_gift_processor",
        replace_existing=True
    )
    
    # For testing right now, let's also trigger it once right away
    scheduler.add_job(process_pending_gifts)
    
    scheduler.start()
    logger.info("Background scheduler started.")
