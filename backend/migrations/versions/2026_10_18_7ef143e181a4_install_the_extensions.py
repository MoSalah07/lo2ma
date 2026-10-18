"""Install the extensions: PostGIS (distances), pgvector (search by meaning), pg_trgm (fuzzy text).

Autogenerate never sees extensions, so this one is written by hand. No version is pinned here: the
database image pins them locally, and a hosted database offers its own.

Revision ID: 7ef143e181a4
Revises:
Create Date: 2026-10-18 04:14:44.084311+00:00
"""

from collections.abc import Sequence

from alembic import op

# Revision identifiers, used by Alembic.
revision: str = "7ef143e181a4"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")


def downgrade() -> None:
    op.execute("DROP EXTENSION IF EXISTS pg_trgm")
    op.execute("DROP EXTENSION IF EXISTS vector")
    op.execute("DROP EXTENSION IF EXISTS postgis")
