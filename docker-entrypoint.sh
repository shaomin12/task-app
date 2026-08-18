#!/bin/sh
set -e

# When running against Turso (TURSO_DATABASE_URL set), the schema already
# lives there and Prisma's CLI can't target a libsql:// URL anyway (no
# adapter-factory hook for `db push`). Only sync schema here for the local
# SQLite file case (self-hosted with a persistent volume).
if [ -z "$TURSO_DATABASE_URL" ]; then
  # A no-op if already up to date, a plain (non-destructive) push on first
  # boot against an empty database file. Deliberately does NOT pass
  # --accept-data-loss: a destructive schema change should fail loudly and
  # stop the deploy rather than silently apply it.
  npx --yes prisma@7.9.1 db push --skip-generate
fi

exec node server.js
