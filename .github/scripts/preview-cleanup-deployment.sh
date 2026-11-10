#!/usr/bin/env bash
# Delete the PR's Convex preview deployment. No `convex deployment delete`
# exists, so deletion stays on the management REST API. A missing deployment
# (already expired) exits 0.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=preview-common.sh
source "${SCRIPT_DIR}/preview-common.sh"

preview_team_project() {
    python3 "${SCRIPT_DIR}/lib/convex_preview.py" parse-key "${CONVEX_DEPLOY_TOKEN}"
}

find_deployment() {
    local team="$1" project="$2" work_dir="$3" identifier="$4" ref code
    # Preview deployments are addressed by reference preview/<identifier>.
    for ref in "preview/${identifier}" "${identifier}"; do
        code="$(curl -sS -o "${work_dir}/deployment.json" -w "%{http_code}" \
            -H "Authorization: Bearer ${CONVEX_DEPLOY_TOKEN}" \
            "https://api.convex.dev/v1/teams/${team}/projects/${project}/deployment?reference=${ref}")"
        if [ "${code}" = "200" ]; then
            printf '%s' "${ref}"
            return 0
        fi
        echo "No deployment at reference ${ref} (HTTP ${code})."
    done
    return 1
}

deployment_name() {
    python3 "${SCRIPT_DIR}/lib/convex_preview.py" deployment-name "$1"
}

delete_deployment() {
    curl -sS -o "$2" -w "%{http_code}" -X POST \
        -H "Authorization: Bearer ${CONVEX_DEPLOY_TOKEN}" \
        "https://api.convex.dev/v1/deployments/$1/delete"
}

remove_deployment() {
    local name="$1" work_dir="$2" identifier="$3" code
    code="$(delete_deployment "${name}" "${work_dir}/delete.json")"
    if [ "${code}" = "404" ]; then
        echo "Preview deployment ${name} is already gone."
        return 0
    fi
    if [ "${code}" != "200" ]; then
        cat "${work_dir}/delete.json"
        echo "Deleting preview deployment ${name} failed (HTTP ${code})." >&2
        return 1
    fi
    echo "Deleted ${identifier} preview deployment ${name}."
}

main() {
    require_env PR_NUMBER CONVEX_DEPLOY_TOKEN
    local identifier team project work_dir ref name
    identifier="$(preview_name)"
    read -r team project <<< "$(preview_team_project)"
    work_dir="$(new_workdir)"
    trap "rm -rf '${work_dir}'" EXIT
    if ! ref="$(find_deployment "${team}" "${project}" "${work_dir}" "${identifier}")"; then
        echo "No ${identifier} preview deployment to delete; it may have expired already."
        exit 0
    fi
    name="$(deployment_name "${work_dir}/deployment.json")"
    if [ -z "${name}" ]; then
        echo "Deployment lookup returned no name; nothing to delete."
        exit 0
    fi
    remove_deployment "${name}" "${work_dir}" "${identifier}"
}

main "$@"
