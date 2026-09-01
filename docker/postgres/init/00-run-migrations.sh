#!/bin/bash
set -euo pipefail

echo "Running Taleem platform migrations..."

for migration in /docker-entrypoint-initdb.d/migrations/*.sql; do
  echo "Applying $(basename "$migration")..."
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$migration"
done

echo "Migrations completed."
