from geoalchemy2 import Geography, WKBElement
from sqlalchemy import CheckConstraint, Computed, Index
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class PlaceRecord(Base):
    """A place the location search knows.

    A building or business park is what people search for. A district names a pin that isn't on a
    building. The rows come from the seed, so the id is the seed's readable one ("sv-b7"), not
    a UUID.
    """

    __tablename__ = "places"

    id: Mapped[str] = mapped_column(primary_key=True)
    kind: Mapped[str]
    name_ar: Mapped[str]
    name_en: Mapped[str]
    area_ar: Mapped[str]
    area_en: Mapped[str]
    lat: Mapped[float]
    lng: Mapped[float]
    # Made by Postgres from lat and lng, so they never disagree. A geography measures in meters on
    # the earth's surface, which is what "the nearest building" and "within 150 m" need.
    location: Mapped[WKBElement] = mapped_column(
        Geography("POINT", srid=4326, spatial_index=False),
        Computed("ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography", persisted=True),
    )
    # The names and areas in both languages, folded for search (app/domain/search.py).
    search_text: Mapped[str]
    # Its place in /places/suggested; empty for the rest.
    suggested_rank: Mapped[int | None]

    __table_args__ = (
        CheckConstraint("kind IN ('building', 'district')", name="kind"),
        CheckConstraint("lat BETWEEN -90 AND 90", name="lat"),
        CheckConstraint("lng BETWEEN -180 AND 180", name="lng"),
        CheckConstraint("suggested_rank > 0", name="suggested_rank"),
        Index("ix_places_location", "location", postgresql_using="gist"),
        # Trigrams let LIKE '%word%' use an index.
        Index(
            "ix_places_search_text",
            "search_text",
            postgresql_using="gin",
            postgresql_ops={"search_text": "gin_trgm_ops"},
        ),
    )
