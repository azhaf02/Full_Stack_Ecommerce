import os
import sys

from sqlalchemy import text

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import engine


def seed_catalog():
    print("🌱 Seeding Catalog demo data into Supabase PostgreSQL...")

    category_statements = [
        """
        INSERT INTO categories (name, description, is_active, created_at, updated_at)
        VALUES (
            'Clothing',
            'Everyday clothing and fashion products',
            TRUE,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        )
        ON CONFLICT (name) DO NOTHING;
        """,
        """
        INSERT INTO categories (name, description, is_active, created_at, updated_at)
        VALUES (
            'Home & Kitchen',
            'Useful products for home and kitchen',
            TRUE,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        )
        ON CONFLICT (name) DO NOTHING;
        """,
        """
        INSERT INTO categories (name, description, is_active, created_at, updated_at)
        VALUES (
            'Accessories',
            'Everyday personal and tech accessories',
            TRUE,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        )
        ON CONFLICT (name) DO NOTHING;
        """,
    ]

    product_statements = [
        """
        INSERT INTO products
            (category_id, name, description, price, stock_quantity, status,
             created_at, updated_at)
        SELECT
            c.id,
            'Classic Cotton T-Shirt',
            'Comfortable everyday cotton t-shirt',
            599.00,
            25,
            'ACTIVE',
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        FROM categories c
        WHERE c.name = 'Clothing'
          AND NOT EXISTS (
              SELECT 1
              FROM products
              WHERE name = 'Classic Cotton T-Shirt'
          );
        """,
        """
        INSERT INTO products
            (category_id, name, description, price, stock_quantity, status,
             created_at, updated_at)
        SELECT
            c.id,
            'Stainless Steel Water Bottle',
            'Reusable stainless steel bottle for everyday use',
            799.00,
            20,
            'ACTIVE',
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        FROM categories c
        WHERE c.name = 'Home & Kitchen'
          AND NOT EXISTS (
              SELECT 1
              FROM products
              WHERE name = 'Stainless Steel Water Bottle'
          );
        """,
        """
        INSERT INTO products
            (category_id, name, description, price, stock_quantity, status,
             created_at, updated_at)
        SELECT
            c.id,
            'Wireless Mouse',
            'Ergonomic wireless mouse for work and study',
            999.00,
            30,
            'ACTIVE',
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        FROM categories c
        WHERE c.name = 'Accessories'
          AND NOT EXISTS (
              SELECT 1
              FROM products
              WHERE name = 'Wireless Mouse'
          );
        """,
    ]

    with engine.begin() as connection:
        for statement in category_statements:
            connection.execute(text(statement.strip()))

        print("✅ Demo categories inserted/verified.")

        for statement in product_statements:
            connection.execute(text(statement.strip()))

        print("✅ Demo products inserted/verified.")

        categories = connection.execute(
            text("""
                SELECT id, name, is_active
                FROM categories
                WHERE name IN ('Clothing', 'Home & Kitchen', 'Accessories')
                ORDER BY id;
            """)
        ).fetchall()

        products = connection.execute(
            text("""
                SELECT id, name, price, stock_quantity, status
                FROM products
                WHERE name IN (
                    'Classic Cotton T-Shirt',
                    'Stainless Steel Water Bottle',
                    'Wireless Mouse'
                )
                ORDER BY id;
            """)
        ).fetchall()

    print("\n📦 Categories:")
    for category in categories:
        print(category)

    print("\n🛍️ Products:")
    for product in products:
        print(product)

    print("\n🎉 Catalog seed completed successfully!")


if __name__ == "__main__":
    seed_catalog()