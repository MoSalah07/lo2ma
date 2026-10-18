"""Add companies, and the coupons the dashboard makes.

Revision ID: f8216f7a3be9
Revises: 21841d175e47
Create Date: 2026-10-18 10:45:32.236446+00:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# Revision identifiers, used by Alembic.
revision: str = "f8216f7a3be9"
down_revision: str | Sequence[str] | None = "21841d175e47"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "companies",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("name_ar", sa.String(), nullable=False),
        sa.Column("name_en", sa.String(), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_companies")),
    )
    op.create_table(
        "coupons",
        sa.Column("id", sa.Uuid(), server_default=sa.text("uuidv7()"), nullable=False),
        sa.Column("code", sa.String(), nullable=False),
        sa.Column("discount_type", sa.String(), nullable=False),
        sa.Column("discount_value", sa.Integer(), nullable=False),
        sa.Column("discount_cap", sa.Integer(), nullable=True),
        sa.Column("min_order", sa.Integer(), nullable=False),
        sa.Column("audience", sa.String(), nullable=False),
        sa.Column("company_id", sa.String(), nullable=True),
        sa.Column("usage_limit", sa.Integer(), nullable=True),
        sa.Column("per_customer", sa.Integer(), nullable=False),
        sa.Column("ends_on", sa.Date(), nullable=False),
        sa.Column("used", sa.Integer(), server_default="0", nullable=False),
        sa.Column("paused", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("created_by", sa.Uuid(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "(audience = 'company') = (company_id IS NOT NULL)", name=op.f("ck_coupons_company")
        ),
        sa.CheckConstraint(
            "(discount_type = 'percent') = (discount_cap IS NOT NULL)",
            name=op.f("ck_coupons_discount_cap"),
        ),
        sa.CheckConstraint(
            "audience IN ('all', 'new', 'company')", name=op.f("ck_coupons_audience")
        ),
        sa.CheckConstraint(
            "discount_type <> 'percent' OR discount_value <= 100",
            name=op.f("ck_coupons_percent_off"),
        ),
        sa.CheckConstraint(
            "discount_type IN ('percent', 'amount')", name=op.f("ck_coupons_discount_type")
        ),
        sa.CheckConstraint("code = upper(code)", name=op.f("ck_coupons_code_upper")),
        sa.CheckConstraint("discount_cap > 0", name=op.f("ck_coupons_discount_cap_positive")),
        sa.CheckConstraint("discount_value > 0", name=op.f("ck_coupons_discount_value")),
        sa.CheckConstraint("min_order > 0", name=op.f("ck_coupons_min_order")),
        sa.CheckConstraint("per_customer > 0", name=op.f("ck_coupons_per_customer")),
        sa.CheckConstraint("usage_limit > 0", name=op.f("ck_coupons_usage_limit")),
        sa.CheckConstraint("used >= 0", name=op.f("ck_coupons_used")),
        sa.ForeignKeyConstraint(
            ["company_id"], ["companies.id"], name=op.f("fk_coupons_company_id_companies")
        ),
        sa.ForeignKeyConstraint(
            ["created_by"],
            ["admins.id"],
            name=op.f("fk_coupons_created_by_admins"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_coupons")),
        sa.UniqueConstraint("code", name=op.f("uq_coupons_code")),
    )
    op.create_index(op.f("ix_coupons_company_id"), "coupons", ["company_id"], unique=False)
    op.create_index(op.f("ix_coupons_created_by"), "coupons", ["created_by"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_coupons_created_by"), table_name="coupons")
    op.drop_index(op.f("ix_coupons_company_id"), table_name="coupons")
    op.drop_table("coupons")
    op.drop_table("companies")
