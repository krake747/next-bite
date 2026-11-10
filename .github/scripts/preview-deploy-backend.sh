#!/usr/bin/env bash
# Deploy the PR's Convex preview backend. Creates the preview deployment on the
# first push, reuses it with data intact after that. Never --preview-create here:
# it deletes and recreates every time, wiping preview data on each push.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=preview-common.sh
source "${SCRIPT_DIR}/preview-common.sh"

deploy_backend() {
    npx convex deploy --preview-name="$1" 2>&1 | tee convex-deploy.log
}

deployed_convex_url() {
    grep -oE 'https://[a-zA-Z0-9.-]+\.convex\.cloud' convex-deploy.log | head -1
}

publish_backend_env() {
    local convex_url="$1"
    test -n "${convex_url}"
    {
        echo "VITE_CONVEX_URL=${convex_url}"
        echo "VITE_CONVEX_SITE_URL=${convex_url/.convex.cloud/.convex.site}"
    } >> "${GITHUB_ENV:?GITHUB_ENV is not set}"
}

main() {
    require_env PR_NUMBER CONVEX_DEPLOY_KEY GITHUB_ENV
    local name
    name="$(preview_name)"
    deploy_backend "${name}"
    publish_backend_env "$(deployed_convex_url)"
}

main "$@"
