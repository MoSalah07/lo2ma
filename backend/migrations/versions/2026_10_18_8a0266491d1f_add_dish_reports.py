"""Add the reports that a dish came different from its estimate.

Revision ID: 8a0266491d1f
Revises: f8216f7a3be9
Create Date: 2026-10-18 12:22:17.588426+00:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# Revision identifiers, used by Alembic.
revision: str = "8a0266491d1f"
down_revision: str | Sequence[str] | None = "f8216f7a3be9"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "dish_reports",
        sa.Column("id", sa.Uuid(), server_default=sa.text("uuidv7()"), nullable=False),
        sa.Column("dish_id", sa.String(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=True),
        sa.Column("guest_id", sa.Uuid(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["dish_id"], ["dishes.id"], name=op.f("fk_dish_reports_dish_id_dishes")
        ),
        sa.ForeignKeyConstraint(
            ["guest_id"],
            ["guests.id"],
            name=op.f("fk_dish_reports_guest_id_guests"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name=op.f("fk_dish_reports_user_id_users"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_dish_reports")),
    )
    op.create_index(op.f("ix_dish_reports_dish_id"), "dish_reports", ["dish_id"], unique=False)
    op.create_index(op.f("ix_dish_reports_guest_id"), "dish_reports", ["guest_id"], unique=False)
    op.create_index(op.f("ix_dish_reports_user_id"), "dish_reports", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_dish_reports_user_id"), table_name="dish_reports")
    op.drop_index(op.f("ix_dish_reports_guest_id"), table_name="dish_reports")
    op.drop_index(op.f("ix_dish_reports_dish_id"), table_name="dish_reports")
    op.drop_table("dish_reports")
