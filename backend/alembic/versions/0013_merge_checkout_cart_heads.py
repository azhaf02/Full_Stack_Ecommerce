"""Merge checkout snapshot and cart/inventory migration heads."""

revision = "0013_merge_checkout_cart_heads"
down_revision = ("0012_checkout_session_snapshot", "merge_cart_inventory_heads")
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
