"""
Database Initialization & Initial Seeder (server_py/seed_db.py)
Creates tables and migrates existing portfolio.json & backups into the database safely.
Zero data loss guarantee.
"""

import json
import sys
import logging
from datetime import datetime, timezone
from pathlib import Path

# Ensure workspace root is in python path
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from sqlalchemy.orm import Session
from server_py.config import PORTFOLIO_PATH, BACKUPS_DIR
from server_py.database import engine, Base, SessionLocal
from server_py.models import Portfolio, PortfolioVersion, ContactMessage, AuditLog, User, EmailOTP

logger = logging.getLogger("folioblox.seed")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")


def get_utc_now():
    return datetime.now(timezone.utc)


def init_database():
    """Create all database tables if they do not exist."""
    logger.info("Initializing database schema...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database schema initialized successfully.")


def seed_initial_data(db: Session = None) -> dict:
    """
    Seeds existing data/portfolio.json into the database if the table is empty.
    Also migrates any historical backups from data/backups/ directory.
    """
    should_close = False
    if db is None:
        db = SessionLocal()
        should_close = True

    stats = {
        "portfolio_seeded": False,
        "backups_migrated": 0,
        "existing_active_version": None
    }

    try:
        init_database()

        # 1. Check if active portfolio already exists
        active_portfolio = db.query(Portfolio).filter(Portfolio.is_active == True).first()
        if active_portfolio:
            stats["existing_active_version"] = active_portfolio.version
            logger.info(f"Active portfolio already exists in database (Version: {active_portfolio.version}).")
        else:
            # Load from portfolio.json if available
            if PORTFOLIO_PATH.exists():
                with open(PORTFOLIO_PATH, "r", encoding="utf-8") as f:
                    portfolio_content = json.load(f)

                new_portfolio = Portfolio(
                    version="v1.0.0-initial-seed",
                    content=portfolio_content,
                    is_active=True,
                    created_at=get_utc_now(),
                    updated_at=get_utc_now()
                )
                db.add(new_portfolio)
                db.commit()
                db.refresh(new_portfolio)
                stats["portfolio_seeded"] = True
                stats["existing_active_version"] = new_portfolio.version
                logger.info(f"Seeded active portfolio into database from {PORTFOLIO_PATH.name} (ID: {new_portfolio.id}).")
            else:
                logger.warning(f"File {PORTFOLIO_PATH} not found; skipping portfolio seed.")

        # 2. Check and migrate historical backups from data/backups/
        if BACKUPS_DIR.exists():
            backup_files = list(BACKUPS_DIR.glob("*.json"))
            for backup_file in backup_files:
                backup_id = backup_file.stem
                existing_version = db.query(PortfolioVersion).filter(PortfolioVersion.backup_id == backup_id).first()
                if not existing_version:
                    try:
                        with open(backup_file, "r", encoding="utf-8") as bf:
                            backup_data = json.load(bf)

                        # File modification time
                        file_mtime = datetime.fromtimestamp(backup_file.stat().st_mtime, timezone.utc)

                        db_backup = PortfolioVersion(
                            backup_id=backup_id,
                            reason="Migrated from file storage",
                            content=backup_data,
                            created_at=file_mtime
                        )

                        db.add(db_backup)
                        stats["backups_migrated"] += 1
                    except Exception as err:
                        logger.error(f"Failed to migrate backup file {backup_file.name}: {err}")

            if stats["backups_migrated"] > 0:
                db.commit()
                logger.info(f"Migrated {stats['backups_migrated']} backup snapshots into portfolio_versions table.")

        return stats

    except Exception as exc:
        db.rollback()
        logger.error(f"Error during database seed: {exc}")
        raise exc
    finally:
        if should_close:
            db.close()


if __name__ == "__main__":
    result = seed_initial_data()
    print("Seed result:", json.dumps(result, indent=2))
