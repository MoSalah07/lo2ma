# Postgres with the two extensions Lo2ma needs: PostGIS (distances) and pgvector (search by meaning).
# Both come from the PostgreSQL apt repository the official image already uses. Exact versions, so every
# build is the same; that repository keeps the older ones.
FROM postgres:18.6-trixie

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        postgresql-18-postgis-3=3.6.4+dfsg-2.pgdg13+1 \
        postgresql-18-postgis-3-scripts=3.6.4+dfsg-2.pgdg13+1 \
        postgresql-18-pgvector=0.8.7-1.pgdg13+1 \
    && rm -rf /var/lib/apt/lists/*
