#!/usr/bin/env bash
# Deploy Convex functions and schema to the deployment that CONVEX_DEPLOY_KEY
# targets, then run the migration list.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

main() {
    : "${CONVEX_DEPLOY_KEY:?CONVEX_DEPLOY_KEY is not set}"
    npx convex deploy
    "${SCRIPT_DIR}/backend-migrate.sh"
}

main "$@"
