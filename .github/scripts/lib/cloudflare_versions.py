"""Undeployed Worker versions tagged for a PR preview.

Reads paged Cloudflare list responses from a directory and prints the ids of
versions carrying the tag that no deployment still references.
"""

import glob
import json
import re
import sys

PR_TAG = re.compile(r"^pr-(\d+)$")


def load_pages(pattern):
    payloads = []
    for path in sorted(glob.glob(pattern)):
        with open(path) as handle:
            payloads.append(json.load(handle))
    return payloads


def version_id(version):
    """Version entries are usually objects, but the deployments list returns
    plain id strings. Accept both."""
    if isinstance(version, str):
        return version
    return version.get("version_id") or version.get("id")


def deployed_version_ids(deployment_pages):
    ids = set()
    for payload in deployment_pages:
        for deployment in payload.get("result") or []:
            if isinstance(deployment, str):
                # Unparsed reference: it might be live, so fail safe and treat it as deployed.
                ids.add(deployment)
                continue
            for version in deployment.get("versions") or []:
                vid = version_id(version)
                if vid:
                    ids.add(vid)
    return ids


def stale_tagged_ids(deployment_pages, version_pages, tag):
    deployed = deployed_version_ids(deployment_pages)
    stale = []
    for payload in version_pages:
        for version in payload.get("result") or []:
            annotations = version.get("annotations") or {} if isinstance(version, dict) else {}
            if annotations.get("workers/tag") == tag and version_id(version) not in deployed:
                stale.append(version_id(version))
    return stale


def foreign_tagged_ids(deployment_pages, version_pages, own_tag):
    """Undeployed version ids grouped by foreign pr-<n> tag, as tag<tab>id lines.

    Skips the run's own tag, non-conforming tags, and anything a deployment
    references. Callers decide per tag (e.g. by PR state) and delete with the
    same latest-version tolerance as the own-tag path.
    """
    deployed = deployed_version_ids(deployment_pages)
    lines = []
    for payload in version_pages:
        for version in payload.get("result") or []:
            if not isinstance(version, dict):
                continue
            annotations = version.get("annotations") or {}
            tag = annotations.get("workers/tag")
            vid = version_id(version)
            if not tag or tag == own_tag or not PR_TAG.match(tag):
                continue
            if vid and vid not in deployed:
                lines.append(f"{tag}\t{vid}")
    return lines


def main(argv):
    command = argv[1]
    work_dir = argv[2]
    own_tag = argv[3]
    if command == "own":
        ids = stale_tagged_ids(
            load_pages(f"{work_dir}/deployments_page_*.json"),
            load_pages(f"{work_dir}/versions_page_*.json"),
            own_tag,
        )
        print("\n".join(ids))
    elif command == "foreign":
        lines = foreign_tagged_ids(
            load_pages(f"{work_dir}/deployments_page_*.json"),
            load_pages(f"{work_dir}/versions_page_*.json"),
            own_tag,
        )
        print("\n".join(lines))


if __name__ == "__main__":
    main(sys.argv)
