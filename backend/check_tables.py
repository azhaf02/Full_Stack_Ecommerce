from sqlalchemy import text
from app.database import engine

with engine.connect() as conn:
    result = conn.execute(text("""
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name;
    """))

    tables = [row[0] for row in result]

print("DATABASE:", engine.dialect.name)
print("\nTABLES:")
for table in tables:
    print("-", table)

print("\nCART TABLES:")
print("carts:", "carts" in tables)
print("cart_items:", "cart_items" in tables)
print("coupons:", "coupons" in tables)