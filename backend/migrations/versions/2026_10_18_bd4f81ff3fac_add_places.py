"""Add places: the buildings people search for and the districts that name a pin.

Revision ID: bd4f81ff3fac
Revises: 7ef143e181a4
Create Date: 2026-10-18 04:50:52.671694+00:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from geoalchemy2 import Geography

# Revision identifiers, used by Alembic.
revision: str = "bd4f81ff3fac"
down_revision: str | Sequence[str] | None = "7ef143e181a4"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "places",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("kind", sa.String(), nullable=False),
        sa.Column("name_ar", sa.String(), nullable=False),
        sa.Column("name_en", sa.String(), nullable=False),
        sa.Column("area_ar", sa.String(), nullable=False),
        sa.Column("area_en", sa.String(), nullable=False),
        sa.Column("lat", sa.Double(), nullable=False),
        sa.Column("lng", sa.Double(), nullable=False),
        sa.Column(
            "location",
            Geography(geometry_type="POINT", srid=4326, spatial_index=False),
            sa.Computed("ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography", persisted=True),
            nullable=False,
        ),
        sa.Column("search_text", sa.String(), nullable=False),
        sa.Column("suggested_rank", sa.Integer(), nullable=True),
        sa.CheckConstraint("kind IN ('building', 'district')", name=op.f("ck_places_kind")),
        sa.CheckConstraint("lat BETWEEN -90 AND 90", name=op.f("ck_places_lat")),
        sa.CheckConstraint("lng BETWEEN -180 AND 180", name=op.f("ck_places_lng")),
        sa.CheckConstraint("suggested_rank > 0", name=op.f("ck_places_suggested_rank")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_places")),
    )
    op.create_index(
        "ix_places_location", "places", ["location"], unique=False, postgresql_using="gist"
    )
    op.create_index(
        "ix_places_search_text",
        "places",
        ["search_text"],
        unique=False,
        postgresql_using="gin",
        postgresql_ops={"search_text": "gin_trgm_ops"},
    )


def downgrade() -> None:
    op.drop_index(
        "ix_places_search_text",
        table_name="places",
        postgresql_using="gin",
        postgresql_ops={"search_text": "gin_trgm_ops"},
    )
    op.drop_index("ix_places_location", table_name="places", postgresql_using="gist")
    op.drop_table("places")
