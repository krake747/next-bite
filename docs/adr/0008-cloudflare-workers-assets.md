# Cloudflare Workers static assets via the cf CLI

Next Bite deployed to Netlify with a `_redirects` SPA fallback. We moved hosting to an asset-only
Cloudflare Worker named `next-bite` with `single-page-application` fallback, driven by the `cf` CLI
(1.0.0-beta.27) instead of Wrangler directly. `cf migrate` converted the `wrangler.jsonc` into a
typed `cloudflare.config.ts`; the project keeps the Wrangler bundler (no Cloudflare Vite plugin) and
keeps `wrangler.jsonc` for Wrangler-only commands such as `tail`.

**Considered Options**

- **Stay on Netlify**: Rejected because the project standardizes on Cloudflare for hosting alongside
  the reference setup.
- **Cloudflare Pages**: Rejected because Pages is in maintenance and Workers Static Assets is the
  current path.
- **Wrangler only**: Rejected because `cf` is the single CLI for project, account, and resource
  tasks, and the typed config gives editors and agents autocomplete.

**Consequences**

- `pnpm deploy` runs `cf deploy`, which builds then uploads `dist/` as Worker assets.
- `VITE_*` values bake in at build time from the shell environment; CI must provide them. No Worker
  bindings or secrets are needed: Convex remains the backend.
- Deploying needs `cf auth login` (interactive) or `CLOUDFLARE_API_TOKEN` in automation. DNS, the
  zone, and first-time worker creation stay manual steps in the Cloudflare dashboard.
