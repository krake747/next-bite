#!/usr/bin/env bash
# Fail fast when the baked backend URLs are not absolute HTTPS URLs. A bad
# value sails through the build and 500s every server-rendered request.
set -euo pipefail

require_env() {
    local missing=0
    for name in "$@"; do
        if [ -z "${!name:-}" ]; then
            echo "Missing environment variable: ${name}." >&2
            missing=1
        fi
    done
    return "${missing}"
}

require_env VITE_CONVEX_URL VITE_CONVEX_SITE_URL

node <<'EOF'
const names = ["VITE_CONVEX_URL", "VITE_CONVEX_SITE_URL"]
let ok = true
for (const name of names) {
    try {
        const url = new URL(process.env[name] ?? "")
        if (url.protocol !== "https:") {
            throw new Error("wrong protocol")
        }
    } catch {
        console.error(`${name} must be an absolute HTTPS URL`)
        ok = false
    }
}
process.exit(ok ? 0 : 1)
EOF
