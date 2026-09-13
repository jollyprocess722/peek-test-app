#!/bin/bash
# Ensures PostgreSQL is up, exports DATABASE_URL, then starts the app.
DIR="$(cd "$(dirname "$0")" && pwd)"
bash "$DIR/setup-db.sh" >/tmp/setup-db-start.log 2>&1 || true
export DATABASE_URL="postgres://demo:demo@127.0.0.1:5432/demoapp"
exec node "$(dirname "$DIR")/server.js"
