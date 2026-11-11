#!/usr/bin/env bash
# Run the Convex data migrations in order against the deployment that
# CONVEX_DEPLOY_KEY targets. Every listed migration must be idempotent.
set -euo pipefail

# The profiles legacy-key backfill below runs first; keep entries idempotent.
MIGRATIONS=("model/identity/profiles:stripProfilesCreatedAt")

main() {
    : "${CONVEX_DEPLOY_KEY:?CONVEX_DEPLOY_KEY is not set}"
    local migration
    for migration in "${MIGRATIONS[@]}"; do
        echo "Running ${migration}"
        npx convex run "${migration}"
    done
}

main "$@"
