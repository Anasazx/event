#!/usr/bin/env bash
# Drops and recreates the experimental "event_demo" database.
# The next start with the "demo" profile regenerates the whole dataset.
#   usage: scripts/reset-demo-db.sh   (PGUSER/PGHOST/PGPASSWORD are honoured)
set -euo pipefail
export PGUSER="${PGUSER:-postgres}"
export PGHOST="${PGHOST:-localhost}"
DB="${DEMO_DB:-event_demo}"

dropdb --if-exists "$DB"
createdb "$DB"
echo "Database $DB recreated. Start the backend with the demo profile:"
echo "  ./mvnw spring-boot:run -Dspring-boot.run.profiles=demo"
