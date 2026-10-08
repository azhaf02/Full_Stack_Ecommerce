from sqlalchemy import Column, ForeignKey, Integer, Numeric, String, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database import Base


class ProductVariant(Base):
    __tablename__ = "product_variants"

    id = Column(Integer, primary_key=True, index=True)

    product_id = Column(
        Integer,
        ForeignKey("products.id"),
        nullable=False,
        index=True
    )

    attribute_name = Column(String(50), nullable=False)
    attribute_value = Column(String(100), nullable=False)

    price_delta = Column(
        Numeric(10, 2),
        default=0,
        nullable=False
    )

    stock = Column(
        Integer,
        default=0,
        nullable=False
    )

    product = relationship(
        "Product",
        back_populates="variants"
    )

    __table_args__ = (
        UniqueConstraint(
            "product_id",
            "attribute_name",
            "attribute_value",
            name="uq_product_variant_attribute"
        ),
    )
