"""Create the missing payments rows for COD orders.

    python scripts/backfill_cod_payments.py          # dry run: shows what would change, writes nothing
    python scripts/backfill_cod_payments.py --apply  # does it

Uses DATABASE_URL from backend/.env. Run it from the backend folder. Safe to run twice: orders that already have
a payments row are skipped.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dotenv import load_dotenv  # noqa: E402

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from app.database import SessionLocal  # noqa: E402
import app.models  # noqa: E402,F401
from app.services.cod_payment_hook import backfill_cod_payments  # noqa: E402


def main(apply: bool) -> None:
    with SessionLocal() as db:
        created = backfill_cod_payments(db)
        for order_id, status in created:
            print(f"order {order_id}: payments row {status}")
        print(f"{len(created)} order(s) {'fixed' if apply else 'would be fixed'}")
        if apply:
            db.commit()
        else:
            db.rollback()
            print("Dry run only. Run again with --apply to save.")


if __name__ == "__main__":
    main("--apply" in sys.argv)
