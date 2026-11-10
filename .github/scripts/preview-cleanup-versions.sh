#!/usr/bin/env bash
# Delete the PR's Worker versions that no deployment references. Pages through
# both lists: a PR's versions are recent by construction, but the account holds
# every worker's versions, so the tag match must see past the first page.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=preview-common.sh
source "${SCRIPT_DIR}/preview-common.sh"

# Must match worker.name in cloudflare.config.ts.
WORKER_ID="next-bite"

cf_api_base() {
    printf 'https://api.cloudflare.com/client/v4/accounts/%s/workers' "${CLOUDFLARE_ACCOUNT_ID}"
}

fetch_pages() {
    local path="$1" work_dir="$2" page=1 count
    while true; do
        curl -sS --fail-with-body -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
            "$(cf_api_base)/${path}?per_page=100&page=${page}" \
            -o "${work_dir}/${path##*/}_page_${page}.json"
        count="$(python3 -c "import json; print(len(json.load(open('${work_dir}/${path##*/}_page_${page}.json')).get('result') or []))")"
        if [ "${count}" -lt 100 ]; then
            break
        fi
        page=$((page + 1))
    done
}

stale_version_ids() {
    python3 "${SCRIPT_DIR}/lib/cloudflare_versions.py" "$1" "$2"
}

delete_versions() {
    local version_id
    while IFS= read -r version_id; do
        [ -n "${version_id}" ] || continue
        vp exec cf workers versions delete "${version_id}" --worker-id "${WORKER_ID}" --force
    done < "$1"
}

main() {
    require_env PR_NUMBER CLOUDFLARE_API_TOKEN CLOUDFLARE_ACCOUNT_ID
    local tag work_dir ids_file
    tag="$(preview_name)"
    work_dir="$(new_workdir)"
    trap "rm -rf '${work_dir}'" EXIT
    fetch_pages "scripts/${WORKER_ID}/deployments" "${work_dir}"
    fetch_pages "workers/${WORKER_ID}/versions" "${work_dir}"
    ids_file="${work_dir}/ids.txt"
    stale_version_ids "${work_dir}" "${tag}" > "${ids_file}"
    if [ ! -s "${ids_file}" ]; then
        echo "No undeployed versions tagged ${tag} to delete."
        exit 0
    fi
    delete_versions "${ids_file}"
}

main "$@"
