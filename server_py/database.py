"""
Database Engine & Session Management (server_py/database.py)
Supports SQLite (Local Dev) and PostgreSQL (Production Neon/Supabase) via SQLAlchemy ORM.
"""

import os
import logging
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from server_py.config import DATABASE_URL, SQLITE_PATH, DATA_DIR

logger = logging.getLogger("folioblox.database")

# Ensure DATA_DIR exists for SQLite file storage
DATA_DIR.mkdir(parents=True, exist_ok=True)


def get_connection_url() -> tuple[str, str]:
    """
    Determines database connection URL.
    Returns: (normalized_url, engine_type)
    """
    raw_url = DATABASE_URL
    if raw_url:
        # Standardize postgres:// to postgresql:// for SQLAlchemy 2.0
        if raw_url.startswith("postgres://"):
            raw_url = raw_url.replace("postgres://", "postgresql://", 1)
        return raw_url, "postgresql"

    # Default to local SQLite
    sqlite_url = f"sqlite:///{SQLITE_PATH.as_posix()}"
    return sqlite_url, "sqlite"


DB_URL, DB_TYPE = get_connection_url()

# Engine creation with dialect-specific options
if DB_TYPE == "sqlite":
    engine = create_engine(
        DB_URL,
        connect_args={"check_same_thread": False},
        echo=False
    )
else:
    # PostgreSQL connection pooling for cloud production
    engine = create_engine(
        DB_URL,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
        echo=False
    )

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative Base for models
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that yields a database session and safely closes it afterwards.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_connection() -> dict:
    """
    Verifies database connectivity by executing a lightweight ping query.
    """
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {
            "status": "connected",
            "engine": DB_TYPE,
            "target": str(SQLITE_PATH.name) if DB_TYPE == "sqlite" else "remote_postgresql"
        }
    except Exception as exc:
        logger.error(f"Database connection ping failed: {exc}")
        return {
            "status": "error",
            "engine": DB_TYPE,
            "error": str(exc)
        }

