"""Add accounts, sessions and sign-in codes; preferences now belong to a user or a guest.

Revision ID: aaadd874c02f
Revises: 787bcca4c0e2
Create Date: 2026-10-18 05:38:32.615953+00:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# Revision identifiers, used by Alembic.
revision: str = "aaadd874c02f"
down_revision: str | Sequence[str] | None = "787bcca4c0e2"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "otp_codes",
        sa.Column("id", sa.Uuid(), server_default=sa.text("uuidv7()"), nullable=False),
        sa.Column("channel", sa.String(), nullable=False),
        sa.Column("destination", sa.String(), nullable=False),
        sa.Column("code_hash", sa.String(), nullable=False),
        sa.Column("attempts", sa.Integer(), server_default="0", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("channel IN ('phone', 'email')", name=op.f("ck_otp_codes_channel")),
        sa.CheckConstraint("attempts >= 0", name=op.f("ck_otp_codes_attempts")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_otp_codes")),
    )
    op.create_index(
        "ix_otp_codes_destination_created_at",
        "otp_codes",
        ["destination", "created_at"],
        unique=False,
    )
    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), server_default=sa.text("uuidv7()"), nullable=False),
        sa.Column("phone", sa.String(), nullable=True),
        sa.Column("email", sa.String(), nullable=True),
        sa.Column("name", sa.String(), server_default="", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint("num_nonnulls(phone, email) >= 1", name=op.f("ck_users_reachable")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_users")),
        sa.UniqueConstraint("email", name=op.f("uq_users_email")),
        sa.UniqueConstraint("phone", name=op.f("uq_users_phone")),
    )
    op.create_table(
        "sessions",
        sa.Column("id", sa.Uuid(), server_default=sa.text("uuidv7()"), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("token_hash", sa.String(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], name=op.f("fk_sessions_user_id_users"), ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_sessions")),
        sa.UniqueConstraint("token_hash", name=op.f("uq_sessions_token_hash")),
    )
    op.create_index(op.f("ix_sessions_user_id"), "sessions", ["user_id"], unique=False)
    op.add_column("prefs", sa.Column("user_id", sa.Uuid(), nullable=True))
    op.alter_column("prefs", "guest_id", existing_type=sa.UUID(), nullable=True)
    op.create_unique_constraint(op.f("uq_prefs_user_id"), "prefs", ["user_id"])
    op.create_foreign_key(
        op.f("fk_prefs_user_id_users"), "prefs", "users", ["user_id"], ["id"], ondelete="CASCADE"
    )
    # Autogenerate never sees a new CHECK constraint, so this one is written by hand.
    op.create_check_constraint(
        op.f("ck_prefs_one_owner"), "prefs", "num_nonnulls(user_id, guest_id) = 1"
    )


def downgrade() -> None:
    op.drop_constraint(op.f("ck_prefs_one_owner"), "prefs", type_="check")
    # Accounts' preferences have no guest to go back to.
    op.execute("DELETE FROM prefs WHERE guest_id IS NULL")
    op.drop_constraint(op.f("fk_prefs_user_id_users"), "prefs", type_="foreignkey")
    op.drop_constraint(op.f("uq_prefs_user_id"), "prefs", type_="unique")
    op.alter_column("prefs", "guest_id", existing_type=sa.UUID(), nullable=False)
    op.drop_column("prefs", "user_id")
    op.drop_index(op.f("ix_sessions_user_id"), table_name="sessions")
    op.drop_table("sessions")
    op.drop_table("users")
    op.drop_index("ix_otp_codes_destination_created_at", table_name="otp_codes")
    op.drop_table("otp_codes")
