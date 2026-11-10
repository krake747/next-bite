#!/usr/bin/env bash
# Point the preview deployment at its alias and seed the baseline. The seed is
# idempotent: a no-op when the deployment is reused, a repopulate when it was
# recreated after expiry. It runs here, after SITE_URL is set, because it fails
# closed without it.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=preview-common.sh
source "${SCRIPT_DIR}/preview-common.sh"

set_site_url() {
    npx convex env set SITE_URL "$1" --deployment "$2"
}

run_seed() {
    npx convex run seed:previewBaseline --deployment "$1"
}

main() {
    require_env PR_NUMBER PREVIEW_URL CONVEX_DEPLOY_KEY
    local ref
    ref="$(preview_ref)"
    set_site_url "${PREVIEW_URL}" "${ref}"
    run_seed "${ref}"
}

main "$@"
