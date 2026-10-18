from geoalchemy2 import Geography, WKBElement
from sqlalchemy import CheckConstraint, Computed, ForeignKey, Index, Text, UniqueConstraint, true
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base

_INGREDIENTS = "ARRAY['chicken', 'beef', 'fish', 'nuts', 'dairy']::text[]"


class FoodRecord(Base):
    """A food the calorie estimate may use, per 100 g, from USDA FoodData Central and Egypt's food
    composition tables. The estimate only picks foods from this list; the numbers are ours."""

    __tablename__ = "foods"

    id: Mapped[str] = mapped_column(primary_key=True)
    name_ar: Mapped[str]
    name_en: Mapped[str]
    kcal: Mapped[float]
    protein: Mapped[float]
    carbs: Mapped[float]
    fat: Mapped[float]
    # How much kitchens' portions of it vary, as a share: oil and sauces vary the most.
    spread: Mapped[float]

    __table_args__ = (
        CheckConstraint("kcal >= 0 AND protein >= 0 AND carbs >= 0 AND fat >= 0", name="nutrition"),
        CheckConstraint("spread >= 0 AND spread < 1", name="spread"),
    )


class RestaurantRecord(Base):
    """A restaurant and where it is. The seed's are fictional, around the Smart Village."""

    __tablename__ = "restaurants"

    id: Mapped[str] = mapped_column(primary_key=True)
    name_ar: Mapped[str]
    name_en: Mapped[str]
    lat: Mapped[float]
    lng: Mapped[float]
    location: Mapped[WKBElement] = mapped_column(
        Geography("POINT", srid=4326, spatial_index=False),
        Computed("ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography", persisted=True),
    )
    # Preparation plus delivery, in minutes.
    eta_minutes: Mapped[int]
    delivery_fee: Mapped[int]
    # Never deleted once orders point at it: switched off instead.
    is_active: Mapped[bool] = mapped_column(server_default=true())

    dishes: Mapped[list[DishRecord]] = relationship(back_populates="restaurant", lazy="raise")

    __table_args__ = (
        CheckConstraint("lat BETWEEN -90 AND 90", name="lat"),
        CheckConstraint("lng BETWEEN -180 AND 180", name="lng"),
        CheckConstraint("eta_minutes > 0", name="eta_minutes"),
        CheckConstraint("delivery_fee >= 0", name="delivery_fee"),
        Index("ix_restaurants_location", "location", postgresql_using="gist"),
    )


class DishRecord(Base):
    """A dish on a restaurant's menu, with its calories and macros and where they come from."""

    __tablename__ = "dishes"

    id: Mapped[str] = mapped_column(primary_key=True)
    restaurant_id: Mapped[str] = mapped_column(ForeignKey("restaurants.id"), index=True)
    # Its place on the menu.
    position: Mapped[int]
    name_ar: Mapped[str]
    name_en: Mapped[str]
    # A main can be ordered alone; a side only next to a main.
    role: Mapped[str]
    price: Mapped[int]
    # The restaurant's own number, or the middle of the estimate.
    kcal: Mapped[int]
    kcal_source: Mapped[str]
    # Only for estimates: a number the restaurant publishes has no range.
    kcal_low: Mapped[int | None]
    kcal_high: Mapped[int | None]
    protein: Mapped[int]
    carbs: Mapped[int]
    fat: Mapped[int]
    # Every ingredient people may avoid that it contains.
    contains: Mapped[list[str]] = mapped_column(ARRAY(Text))
    is_active: Mapped[bool] = mapped_column(server_default=true())

    restaurant: Mapped[RestaurantRecord] = relationship(back_populates="dishes", lazy="raise")
    lines: Mapped[list[RecipeLineRecord]] = relationship(
        order_by="RecipeLineRecord.position", lazy="raise"
    )

    __table_args__ = (
        UniqueConstraint("restaurant_id", "position", name="uq_dishes_restaurant_id_position"),
        CheckConstraint("role IN ('main', 'side')", name="role"),
        CheckConstraint("price > 0", name="price"),
        CheckConstraint("kcal > 0", name="kcal"),
        CheckConstraint("kcal_source IN ('restaurant', 'ai')", name="kcal_source"),
        CheckConstraint(
            "(kcal_source = 'ai') = (kcal_low IS NOT NULL AND kcal_high IS NOT NULL)",
            name="kcal_range",
        ),
        CheckConstraint("kcal_low <= kcal_high", name="kcal_range_order"),
        CheckConstraint("protein >= 0 AND carbs >= 0 AND fat >= 0", name="macros"),
        CheckConstraint(f"contains <@ {_INGREDIENTS}", name="contains"),
        Index("ix_dishes_contains", "contains", postgresql_using="gin"),
    )


class RecipeLineRecord(Base):
    """One food of an estimated dish, as «حسبناها ازاي» lists it."""

    __tablename__ = "recipe_lines"

    dish_id: Mapped[str] = mapped_column(
        ForeignKey("dishes.id", ondelete="CASCADE"), primary_key=True
    )
    position: Mapped[int] = mapped_column(primary_key=True)
    food_id: Mapped[str] = mapped_column(ForeignKey("foods.id"), index=True)
    grams: Mapped[int]
    kcal: Mapped[int]
    protein: Mapped[int]

    __table_args__ = (
        CheckConstraint("grams > 0", name="grams"),
        CheckConstraint("kcal >= 0 AND protein >= 0", name="nutrition"),
    )
