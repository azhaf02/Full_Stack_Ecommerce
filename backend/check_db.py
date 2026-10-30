from app.database import engine

print("DATABASE URL:")
print(engine.url)

print("\nDATABASE DIALECT:")
print(engine.dialect.name)