#!/usr/bin/env bash
# Upload the Worker version and publish its preview alias URL.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=preview-common.sh
source "${SCRIPT_DIR}/preview-common.sh"

upload_version() {
    vp exec cf workers versions create --preview-alias "$1" --tag "$1" 2>&1 | tee cf-upload.log
}

alias_url() {
    grep "Version Preview Alias URL" cf-upload.log | grep -oE 'https://[^[:space:]]+'
}

publish_alias_env() {
    test -n "$1"
    echo "PREVIEW_URL=$1" >> "${GITHUB_ENV:?GITHUB_ENV is not set}"
}

main() {
    require_env PR_NUMBER GITHUB_ENV
    local name
    name="$(preview_name)"
    upload_version "${name}"
    publish_alias_env "$(alias_url)"
}

main "$@"
