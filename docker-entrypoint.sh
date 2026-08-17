#!/bin/sh
set -e

# Syncs the schema onto the persistent volume — a no-op if it's already
# up to date, and a plain (non-destructive) push on first boot against an
# empty database file. Deliberately does NOT pass --accept-data-loss: if a
# future schema change would actually be destructive, this should fail
# loudly and stop the deploy rather than silently apply it.
npx --yes prisma@7.9.1 db push --skip-generate

exec node server.js
