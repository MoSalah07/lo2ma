"""Add the catalog: foods and their nutrition, restaurants and their place, dishes, recipe lines.

Revision ID: 012fa5d94df6
Revises: aaadd874c02f
Create Date: 2026-10-18 09:57:32.719568+00:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from geoalchemy2 import Geography
from sqlalchemy.dialects import postgresql

# Revision identifiers, used by Alembic.
revision: str = "012fa5d94df6"
down_revision: str | Sequence[str] | None = "aaadd874c02f"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "foods",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("name_ar", sa.String(), nullable=False),
        sa.Column("name_en", sa.String(), nullable=False),
        sa.Column("kcal", sa.Double(), nullable=False),
        sa.Column("protein", sa.Double(), nullable=False),
        sa.Column("carbs", sa.Double(), nullable=False),
        sa.Column("fat", sa.Double(), nullable=False),
        sa.Column("spread", sa.Double(), nullable=False),
        sa.CheckConstraint(
            "kcal >= 0 AND protein >= 0 AND carbs >= 0 AND fat >= 0",
            name=op.f("ck_foods_nutrition"),
        ),
        sa.CheckConstraint("spread >= 0 AND spread < 1", name=op.f("ck_foods_spread")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_foods")),
    )
    op.create_table(
        "restaurants",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("name_ar", sa.String(), nullable=False),
        sa.Column("name_en", sa.String(), nullable=False),
        sa.Column("lat", sa.Double(), nullable=False),
        sa.Column("lng", sa.Double(), nullable=False),
        sa.Column(
            "location",
            Geography(
                geometry_type="POINT",
                srid=4326,
                dimension=2,
                spatial_index=False,
                from_text="ST_GeogFromText",
                name="geography",
                nullable=False,
            ),
            sa.Computed("ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography", persisted=True),
            nullable=False,
        ),
        sa.Column("eta_minutes", sa.Integer(), nullable=False),
        sa.Column("delivery_fee", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.CheckConstraint("delivery_fee >= 0", name=op.f("ck_restaurants_delivery_fee")),
        sa.CheckConstraint("eta_minutes > 0", name=op.f("ck_restaurants_eta_minutes")),
        sa.CheckConstraint("lat BETWEEN -90 AND 90", name=op.f("ck_restaurants_lat")),
        sa.CheckConstraint("lng BETWEEN -180 AND 180", name=op.f("ck_restaurants_lng")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_restaurants")),
    )
    op.create_index(
        "ix_restaurants_location",
        "restaurants",
        ["location"],
        unique=False,
        postgresql_using="gist",
    )
    op.create_table(
        "dishes",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("restaurant_id", sa.String(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("name_ar", sa.String(), nullable=False),
        sa.Column("name_en", sa.String(), nullable=False),
        sa.Column("role", sa.String(), nullable=False),
        sa.Column("price", sa.Integer(), nullable=False),
        sa.Column("kcal", sa.Integer(), nullable=False),
        sa.Column("kcal_source", sa.String(), nullable=False),
        sa.Column("kcal_low", sa.Integer(), nullable=True),
        sa.Column("kcal_high", sa.Integer(), nullable=True),
        sa.Column("protein", sa.Integer(), nullable=False),
        sa.Column("carbs", sa.Integer(), nullable=False),
        sa.Column("fat", sa.Integer(), nullable=False),
        sa.Column("contains", postgresql.ARRAY(sa.Text()), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.CheckConstraint(
            "(kcal_source = 'ai') = (kcal_low IS NOT NULL AND kcal_high IS NOT NULL)",
            name=op.f("ck_dishes_kcal_range"),
        ),
        sa.CheckConstraint(
            "contains <@ ARRAY['chicken', 'beef', 'fish', 'nuts', 'dairy']::text[]",
            name=op.f("ck_dishes_contains"),
        ),
        sa.CheckConstraint(
            "kcal_source IN ('restaurant', 'ai')", name=op.f("ck_dishes_kcal_source")
        ),
        sa.CheckConstraint("role IN ('main', 'side')", name=op.f("ck_dishes_role")),
        sa.CheckConstraint("kcal > 0", name=op.f("ck_dishes_kcal")),
        sa.CheckConstraint("kcal_low <= kcal_high", name=op.f("ck_dishes_kcal_range_order")),
        sa.CheckConstraint("price > 0", name=op.f("ck_dishes_price")),
        sa.CheckConstraint(
            "protein >= 0 AND carbs >= 0 AND fat >= 0", name=op.f("ck_dishes_macros")
        ),
        sa.ForeignKeyConstraint(
            ["restaurant_id"], ["restaurants.id"], name=op.f("fk_dishes_restaurant_id_restaurants")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_dishes")),
        sa.UniqueConstraint("restaurant_id", "position", name="uq_dishes_restaurant_id_position"),
    )
    op.create_index(
        "ix_dishes_contains", "dishes", ["contains"], unique=False, postgresql_using="gin"
    )
    op.create_index(op.f("ix_dishes_restaurant_id"), "dishes", ["restaurant_id"], unique=False)
    op.create_table(
        "recipe_lines",
        sa.Column("dish_id", sa.String(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("food_id", sa.String(), nullable=False),
        sa.Column("grams", sa.Integer(), nullable=False),
        sa.Column("kcal", sa.Integer(), nullable=False),
        sa.Column("protein", sa.Integer(), nullable=False),
        sa.CheckConstraint("grams > 0", name=op.f("ck_recipe_lines_grams")),
        sa.CheckConstraint("kcal >= 0 AND protein >= 0", name=op.f("ck_recipe_lines_nutrition")),
        sa.ForeignKeyConstraint(
            ["dish_id"],
            ["dishes.id"],
            name=op.f("fk_recipe_lines_dish_id_dishes"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["food_id"], ["foods.id"], name=op.f("fk_recipe_lines_food_id_foods")
        ),
        sa.PrimaryKeyConstraint("dish_id", "position", name=op.f("pk_recipe_lines")),
    )
    op.create_index(op.f("ix_recipe_lines_food_id"), "recipe_lines", ["food_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_recipe_lines_food_id"), table_name="recipe_lines")
    op.drop_table("recipe_lines")
    op.drop_index(op.f("ix_dishes_restaurant_id"), table_name="dishes")
    op.drop_index("ix_dishes_contains", table_name="dishes", postgresql_using="gin")
    op.drop_table("dishes")
    op.drop_index("ix_restaurants_location", table_name="restaurants", postgresql_using="gist")
    op.drop_table("restaurants")
    op.drop_table("foods")
