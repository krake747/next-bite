#!/usr/bin/env bash
# Run the Convex data migrations in order against the deployment that
# CONVEX_DEPLOY_KEY targets. Extend the list as migrations land in
# convex/migrate.ts.
set -euo pipefail

MIGRATIONS=(
    migrate:cleanupOrphanedStorage
)

main() {
    : "${CONVEX_DEPLOY_KEY:?CONVEX_DEPLOY_KEY is not set}"
    local migration
    for migration in "${MIGRATIONS[@]}"; do
        echo "Running ${migration}"
        npx convex run "${migration}"
    done
}

main "$@"
