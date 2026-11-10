"""Resolve a Convex preview deployment from a deploy key.

The key leads with a strict `preview:<team>:<project>` prefix before the first
`|`. Anything else fails closed instead of querying a misparsed address.
"""

import json
import re
import sys

KEY_PATTERN = re.compile(r"^preview:([^:/\s]+):([^:/\s]+)$")


def parse_preview_key(token):
    """Split a preview deploy key into (team, project). Raise ValueError when the shape is wrong."""
    prefix = token.split("|", 1)[0]
    match = KEY_PATTERN.match(prefix)
    if not match:
        raise ValueError("CONVEX_DEPLOY_TOKEN does not look like a preview deploy key.")
    return match.group(1), match.group(2)


def deployment_name(lookup_payload):
    """Extract the deployment name from a reference-lookup response, or "" when absent."""
    return lookup_payload.get("name", "")


def main(argv):
    command, *rest = argv[1:]
    if command == "parse-key":
        team, project = parse_preview_key(rest[0])
        print(f"{team} {project}")
    elif command == "deployment-name":
        with open(rest[0]) as handle:
            print(deployment_name(json.load(handle)))


if __name__ == "__main__":
    main(sys.argv)
