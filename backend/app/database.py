
import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker


# Project folders
BACKEND_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BACKEND_DIR.parent

# Load shared project settings first, then backend-specific settings.
# Existing environment variables are not overwritten by default.
load_dotenv(PROJECT_ROOT / ".env")
load_dotenv(BACKEND_DIR / ".env")

ENVIRONMENT = os.getenv("ENVIRONMENT", "development").lower()

# Prefer DATABASE_URL, then SUPABASE_DB_URL.
DATABASE_URL = os.getenv("DATABASE_URL") or os.getenv("SUPABASE_DB_URL")

# Fail explicitly in production if no database URL is configured.
if not DATABASE_URL:
    if ENVIRONMENT in ["production", "prod"]:
        raise RuntimeError(
            "DATABASE_URL must be set in production environment!"
        )
    DATABASE_URL = "sqlite:///./sql_app.db"

is_sqlite = DATABASE_URL.startswith("sqlite")

connect_args = {"check_same_thread": False} if is_sqlite else {}
engine_kwargs = {"connect_args": connect_args}

if not is_sqlite:
    engine_kwargs["pool_pre_ping"] = True

engine = create_engine(DATABASE_URL, **engine_kwargs)
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
