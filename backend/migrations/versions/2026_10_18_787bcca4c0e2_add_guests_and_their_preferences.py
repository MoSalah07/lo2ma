"""Add guests and their preferences: the browser before sign-in, and what onboarding saved.

Revision ID: 787bcca4c0e2
Revises: bd4f81ff3fac
Create Date: 2026-10-18 05:21:48.597962+00:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# Revision identifiers, used by Alembic.
revision: str = "787bcca4c0e2"
down_revision: str | Sequence[str] | None = "bd4f81ff3fac"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "guests",
        sa.Column("id", sa.Uuid(), server_default=sa.text("uuidv7()"), nullable=False),
        sa.Column("token_hash", sa.String(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_guests")),
        sa.UniqueConstraint("token_hash", name=op.f("uq_guests_token_hash")),
    )
    op.create_table(
        "prefs",
        sa.Column("id", sa.Uuid(), server_default=sa.text("uuidv7()"), nullable=False),
        sa.Column("guest_id", sa.Uuid(), nullable=False),
        sa.Column("workplace_name_ar", sa.String(), nullable=False),
        sa.Column("workplace_name_en", sa.String(), nullable=False),
        sa.Column("workplace_area_ar", sa.String(), nullable=False),
        sa.Column("workplace_area_en", sa.String(), nullable=False),
        sa.Column("workplace_lat", sa.Double(), nullable=False),
        sa.Column("workplace_lng", sa.Double(), nullable=False),
        sa.Column("workplace_details", sa.String(), nullable=False),
        sa.Column("break_time", sa.Time(), nullable=False),
        sa.Column("budget", sa.Integer(), nullable=False),
        sa.Column("calorie_mode", sa.String(), nullable=False),
        sa.Column("calorie_kcal", sa.Integer(), nullable=True),
        sa.Column("fit_protein", sa.Integer(), nullable=True),
        sa.Column("fit_goal", sa.String(), nullable=True),
        sa.Column("exclusions", sa.ARRAY(sa.Text()), nullable=False),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "(calorie_mode = 'any') = (calorie_kcal IS NULL)", name=op.f("ck_prefs_calorie_kcal")
        ),
        sa.CheckConstraint(
            "(calorie_mode = 'fit') = (fit_protein IS NOT NULL)", name=op.f("ck_prefs_fit_protein")
        ),
        sa.CheckConstraint(
            "calorie_mode IN ('any', 'around', 'under', 'fit')", name=op.f("ck_prefs_calorie_mode")
        ),
        sa.CheckConstraint(
            "exclusions <@ ARRAY['chicken', 'beef', 'fish', 'nuts', 'dairy']::text[]",
            name=op.f("ck_prefs_exclusions"),
        ),
        sa.CheckConstraint(
            "fit_goal IS NULL OR (calorie_mode = 'fit' AND fit_goal IN ('cut', 'keep', 'bulk'))",
            name=op.f("ck_prefs_fit_goal"),
        ),
        sa.CheckConstraint("budget >= 0", name=op.f("ck_prefs_budget")),
        sa.CheckConstraint(
            "char_length(workplace_details) <= 120", name=op.f("ck_prefs_workplace_details")
        ),
        sa.CheckConstraint("workplace_lat BETWEEN -90 AND 90", name=op.f("ck_prefs_workplace_lat")),
        sa.CheckConstraint(
            "workplace_lng BETWEEN -180 AND 180", name=op.f("ck_prefs_workplace_lng")
        ),
        sa.ForeignKeyConstraint(
            ["guest_id"], ["guests.id"], name=op.f("fk_prefs_guest_id_guests"), ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_prefs")),
        sa.UniqueConstraint("guest_id", name=op.f("uq_prefs_guest_id")),
    )


def downgrade() -> None:
    op.drop_table("prefs")
    op.drop_table("guests")
