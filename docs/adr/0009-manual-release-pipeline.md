# Manual release pipeline with semver tags

Releases ship from `main` through a manual `workflow_dispatch` pipeline
(`.github/workflows/release.yaml`). Dispatching with `patch`, `minor`, or `major` computes the next
`vX.Y.Z` tag from the latest tag, waits for PR CI green on the dispatched SHA, builds, deploys the
Worker with `cf`, then pushes the tag and publishes a GitHub Release. A dry run builds and dry-runs
the deploy without tagging or releasing.

**Considered Options**

- **Release on every push**: Rejected because deploys stamp public URLs and bake production env;
  they stay a deliberate act until the v2 line stabilizes on `main`.
- **Manual dispatch with semver tags**: Chosen for explicit versioning, a CI gate per release, and
  one-click dry runs.

**Consequences**

- `package.json` stays unversioned; git tags plus GitHub Releases own the version history.
- The pipeline needs repository secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`,
  `VITE_CONVEX_URL`, `VITE_CONVEX_SITE_URL`, and `VITE_GOOGLE_MAPS_API_KEY`.
- Runs only when dispatched; nothing deploys automatically.
