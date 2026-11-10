#!/usr/bin/env bash
# Shared helpers for the preview workflows. Source this file, do not execute it.
set -euo pipefail

require_env() {
    local missing=0
    for name in "$@"; do
        if [ -z "${!name:-}" ]; then
            echo "Missing required environment variable: ${name}." >&2
            missing=1
        fi
    done
    return "${missing}"
}

preview_name() {
    printf 'pr-%s' "${PR_NUMBER:?PR_NUMBER is not set}"
}

preview_ref() {
    printf 'preview/%s' "$(preview_name)"
}

new_workdir() {
    mktemp -d
}
