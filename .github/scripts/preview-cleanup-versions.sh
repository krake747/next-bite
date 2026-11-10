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
    python3 "${SCRIPT_DIR}/lib/cloudflare_versions.py" own "$1" "$2"
}

foreign_tagged_ids() {
    python3 "${SCRIPT_DIR}/lib/cloudflare_versions.py" foreign "$1" "$2"
}

delete_versions() {
    local version_id output
    while IFS= read -r version_id; do
        [ -n "${version_id}" ] || continue
        # Cloudflare refuses to delete the single latest version (10339/409).
        # That version stops being latest on the next upload; the alias limit
        # evicts it eventually. Tolerate exactly that case, fail on anything else.
        if output="$(vp exec cf workers versions delete "${version_id}" --worker-id "${WORKER_ID}" --force 2>&1)"; then
            echo "Deleted version ${version_id}."
        elif echo "${output}" | grep -q "latest version cannot be deleted"; then
            echo "Kept latest version ${version_id}; a newer upload makes it deletable."
        else
            echo "${output}" >&2
            echo "Deleting version ${version_id} failed." >&2
            return 1
        fi
    done < "$1"
}

pr_state() {
    gh api "repos/$1/pulls/$2" --jq .state 2>/dev/null || echo unknown
}

reap_closed_prs() {
    local work_dir="$1" repo="$2" own_tag="$3" tag ids_file pr state
    foreign_tagged_ids "${work_dir}" "${own_tag}" > "${work_dir}/foreign.txt"
    [ -s "${work_dir}/foreign.txt" ] || return 0
    cut -f1 "${work_dir}/foreign.txt" | sort -u | while IFS= read -r tag; do
        pr="${tag#pr-}"
        state="$(pr_state "${repo}" "${pr}")"
        if [ "${state}" != "closed" ]; then
            echo "Keeping ${tag}: PR is ${state}."
            continue
        fi
        ids_file="${work_dir}/closed-${tag}.txt"
        awk -F '\t' -v t="${tag}" '$1 == t { print $2 }' "${work_dir}/foreign.txt" > "${ids_file}"
        echo "Reaping closed ${tag}: $(wc -l < "${ids_file}") version(s)."
        delete_versions "${ids_file}"
    done
}

main() {
    require_env PR_NUMBER CLOUDFLARE_API_TOKEN CLOUDFLARE_ACCOUNT_ID GH_TOKEN GITHUB_REPOSITORY
    local tag work_dir ids_file
    tag="$(preview_name)"
    work_dir="$(new_workdir)"
    trap "rm -rf '${work_dir}'" EXIT
    fetch_pages "scripts/${WORKER_ID}/deployments" "${work_dir}"
    fetch_pages "workers/${WORKER_ID}/versions" "${work_dir}"
    ids_file="${work_dir}/ids.txt"
    stale_version_ids "${work_dir}" "${tag}" > "${ids_file}"
    if [ -s "${ids_file}" ]; then
        delete_versions "${ids_file}"
    else
        echo "No undeployed versions tagged ${tag} to delete."
    fi
    reap_closed_prs "${work_dir}" "${GITHUB_REPOSITORY}" "${tag}"
}

main "$@"
