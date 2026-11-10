#!/usr/bin/env bash
# Maintain the single sticky preview comment on the PR, updating it in place.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=preview-common.sh
source "${SCRIPT_DIR}/preview-common.sh"

MARKER="<!-- preview-environment -->"

comment_body() {
    printf '%s\nPreview: %s\nBackend: per-PR Convex preview deployment `%s` with the seeded baseline.' \
        "${MARKER}" "$1" "$2"
}

find_comment() {
    gh api "repos/$1/issues/$2/comments" --paginate \
        --jq '[.[] | select(.body | contains("'"${MARKER}"'")) | .id] | first // empty'
}

post_comment() {
    gh api -X POST "repos/$1/issues/$2/comments" -f body="$3" >/dev/null
}

update_comment() {
    gh api -X PATCH "repos/$1/issues/comments/$2" -f body="$3" >/dev/null
}

upsert_comment() {
    local repo="$1" pr="$2" body="$3" comment_id
    comment_id="$(find_comment "${repo}" "${pr}")"
    if [ -z "${comment_id}" ]; then
        post_comment "${repo}" "${pr}" "${body}"
    else
        update_comment "${repo}" "${comment_id}" "${body}"
    fi
}

main() {
    require_env PR_NUMBER PREVIEW_URL GH_TOKEN GITHUB_REPOSITORY
    local name
    name="$(preview_name)"
    upsert_comment "${GITHUB_REPOSITORY}" "${PR_NUMBER}" "$(comment_body "${PREVIEW_URL}" "${name}")"
}

main "$@"
