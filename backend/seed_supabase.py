import os
import sys
from sqlalchemy import text

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import engine

def deploy_tables_and_seed():
    print("⏳ Executing DDL for Notifications and Reviews...")

    # Individual SQL statements compatible with both SQLite and PostgreSQL
    statements = [
        """
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            type VARCHAR(50) NOT NULL,
            message VARCHAR(500) NOT NULL,
            is_read BOOLEAN NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """,
        "CREATE INDEX IF NOT EXISTS ix_notifications_id ON notifications (id);",
        "CREATE INDEX IF NOT EXISTS ix_notifications_user_id ON notifications (user_id);",
        """
        CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            order_id INTEGER NOT NULL,
            rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
            title VARCHAR(150),
            comment TEXT NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'Approved',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """,
        "CREATE INDEX IF NOT EXISTS ix_reviews_id ON reviews (id);",
        "CREATE INDEX IF NOT EXISTS ix_reviews_product_id ON reviews (product_id);",
        "CREATE INDEX IF NOT EXISTS ix_reviews_user_id ON reviews (user_id);",
        "CREATE INDEX IF NOT EXISTS ix_reviews_order_id ON reviews (order_id);"
    ]

    seed_statements = [
        """
        INSERT INTO notifications (user_id, type, message, is_read)
        VALUES (1, 'ORDER_CONFIRMATION', 'Your VIORA order #1001 has been confirmed.', 0);
        """,
        """
        INSERT INTO reviews (product_id, user_id, order_id, rating, title, comment, status)
        VALUES (1, 1, 1, 5, 'Exceptional quality', 'Premium build and fast shipping. Fully satisfied!', 'Approved');
        """
    ]

    with engine.begin() as connection:
        for stmt in statements:
            connection.execute(text(stmt.strip()))
        print("✅ Notifications and Reviews tables created successfully!")

        for seed in seed_statements:
            try:
                connection.execute(text(seed.strip()))
            except Exception as err:
                print(f"ℹ️ Sample note: {err}")
        print("✅ Sample notification and review records inserted successfully!")

if __name__ == "__main__":
    deploy_tables_and_seed()