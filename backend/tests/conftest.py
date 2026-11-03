import importlib
import os
import pkgutil

os.environ.setdefault(
    "SECRET_KEY",
    "inventory-audit-test-only-secret-key-2026-strong"
)

# Register all SQLAlchemy models before tests initialise the database.
import app.models as _models_pkg

for _module in pkgutil.iter_modules(_models_pkg.__path__):
    importlib.import_module(f"app.models.{_module.name}")
