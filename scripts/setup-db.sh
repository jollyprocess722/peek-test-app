#!/bin/bash
# Boots a local PostgreSQL cluster and seeds the demo database.
# Runs during npm postinstall (best-effort) and again before server start.
set -u
export DEBIAN_FRONTEND=noninteractive

if ! command -v psql >/dev/null 2>&1 || ! command -v ss >/dev/null 2>&1; then
  apt-get update -qq
  apt-get install -y -qq postgresql postgresql-client iproute2
fi

PGV=$(ls /usr/lib/postgresql/ 2>/dev/null | head -1 || true)
[ -n "$PGV" ] || { echo "no postgres installed"; exit 0; }
PGBIN=/usr/lib/postgresql/$PGV/bin
PGDATA=/var/lib/postgresql/$PGV/main

if [ ! -f "$PGDATA/PG_VERSION" ]; then
  mkdir -p "$PGDATA" /var/run/postgresql
  chown -R postgres:postgres /var/lib/postgresql /var/run/postgresql
  su postgres -c "$PGBIN/initdb -D $PGDATA"
fi

if ! pg_isready -h 127.0.0.1 -p 5432 >/dev/null 2>&1; then
  su postgres -c "$PGBIN/pg_ctl -D $PGDATA -l /tmp/pg.log -o '-c listen_addresses=127.0.0.1 -p 5432' start"
fi
sleep 1

su postgres -c "$PGBIN/psql -h 127.0.0.1 -p 5432 -c \"CREATE USER demo WITH PASSWORD 'demo' CREATEDB;\"" 2>/dev/null || true
su postgres -c "$PGBIN/createdb -h 127.0.0.1 -p 5432 -O demo demoapp" 2>/dev/null || true
su postgres -c "$PGBIN/psql -h 127.0.0.1 -p 5432 -d demoapp -c \"CREATE TABLE IF NOT EXISTS notes (id serial primary key, body text, created_at timestamptz default now());\""
su postgres -c "$PGBIN/psql -h 127.0.0.1 -p 5432 -d demoapp -c \"INSERT INTO notes (body) SELECT md5(random()::text) FROM generate_series(1,25) WHERE NOT EXISTS (SELECT 1 FROM notes);\""
echo "setup-db done"
