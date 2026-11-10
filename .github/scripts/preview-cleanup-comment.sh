#!/usr/bin/env bash
# Comment on the PR that its preview is gone.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=preview-common.sh
source "${SCRIPT_DIR}/preview-common.sh"

gone_body() {
    printf 'The preview for this pull request is gone. Worker versions tagged `%s` that were not deployed were deleted, and the `%s` Convex preview deployment was removed if it still existed.' \
        "$1" "$1"
}

main() {
    require_env PR_NUMBER GH_TOKEN GITHUB_REPOSITORY
    local tag
    tag="$(preview_name)"
    gh pr comment "${PR_NUMBER}" --repo "${GITHUB_REPOSITORY}" --body "$(gone_body "${tag}")"
}

main "$@"
