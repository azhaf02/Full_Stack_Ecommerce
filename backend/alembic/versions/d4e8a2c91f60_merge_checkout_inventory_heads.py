"""Merge checkout/cart and inventory/catalog migration heads."""

from typing import Sequence, Union

revision: str = "d4e8a2c91f60"
down_revision: Union[str, Sequence[str], None] = (
    "0013_merge_checkout_cart_heads",
    "c91f6a2e7d14",
)
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
