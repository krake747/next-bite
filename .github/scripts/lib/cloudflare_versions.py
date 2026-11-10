"""Undeployed Worker versions tagged for a PR preview.

Reads paged Cloudflare list responses from a directory and prints the ids of
versions carrying the tag that no deployment still references.
"""

import glob
import json
import sys


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


def main(argv):
    work_dir, tag = argv[1], argv[2]
    ids = stale_tagged_ids(
        load_pages(f"{work_dir}/deployments_page_*.json"),
        load_pages(f"{work_dir}/versions_page_*.json"),
        tag,
    )
    print("\n".join(ids))


if __name__ == "__main__":
    main(sys.argv)
