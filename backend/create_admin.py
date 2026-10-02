"""Create the first admin account.

Run from the backend folder:  python create_admin.py
"""
import getpass

from dotenv import load_dotenv
load_dotenv()

import app.models  # noqa: F401  (loads all models)
from app.core.security import hash_password
from app.database import SessionLocal
from app.models.role import Role
from app.models.user import User


def get_or_create_role(db, name: str) -> Role:
    role = db.query(Role).filter(Role.name == name).first()
    if role is None:
        role = Role(name=name)
        db.add(role)
        db.flush()
    return role


def main():
    name = input("Admin name: ").strip()
    email = input("Admin email: ").strip().lower()
    password = getpass.getpass("Admin password (min 8 chars): ")
    if len(password) < 8:
        print("Password too short.")
        return

    db = SessionLocal()
    try:
        get_or_create_role(db, "customer")
        admin_role = get_or_create_role(db, "admin")
        if db.query(User).filter(User.email == email).first():
            print("A user with this email already exists.")
            return
        db.add(User(name=name, email=email, password_hash=hash_password(password), role=admin_role))
        db.commit()
        print(f"Admin '{email}' created.")
    finally:
        db.close()


if __name__ == "__main__":
    main()