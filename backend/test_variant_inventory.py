from app.database.connection import engine
from sqlalchemy import text
from sqlalchemy.orm import Session

db = Session(engine)

db.execute(text("""
INSERT INTO inventory
(product_id, variant_id, quantity, low_stock_threshold, location, status)
VALUES
(2, 1, 5, 2, NULL, 'IN_STOCK'),
(2, 2, 10, 2, NULL, 'IN_STOCK'),
(2, 3, 0, 2, NULL, 'OUT_OF_STOCK')
"""))

db.commit()

print(
    db.execute(
        text("""
        SELECT id, product_id, variant_id, quantity,
               low_stock_threshold, location, status
        FROM inventory
        WHERE product_id = 2
        AND variant_id IS NOT NULL
        """)
    ).fetchall()
)

db.close()
