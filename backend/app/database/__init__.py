import importlib.util
from pathlib import Path

# Load database.py directly to export Base, get_db, engine, SessionLocal
_file_path = Path(__file__).resolve().parent.parent / "database.py"
_spec = importlib.util.spec_from_file_location("app._legacy_database", _file_path)
_mod = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_mod)

Base = getattr(_mod, "Base")
get_db = getattr(_mod, "get_db")
engine = getattr(_mod, "engine")
SessionLocal = getattr(_mod, "SessionLocal")

__all__ = ["Base", "get_db", "engine", "SessionLocal"]