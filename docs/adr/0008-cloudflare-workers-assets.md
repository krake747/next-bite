# Cloudflare Workers static assets via the cf CLI

Next Bite deployed to Netlify with a `_redirects` SPA fallback. We moved hosting to an asset-only
Cloudflare Worker named `next-bite` with `single-page-application` fallback, driven by the `cf` CLI
(1.0.0-beta.27). `cf migrate` converted the initial `wrangler.jsonc` into a typed
`cloudflare.config.ts`; we then adopted the Cloudflare Vite plugin (`@beta`, v2) so `cf` builds with
Vite delegation, and removed the Wrangler files and dependency entirely. Observability stays off.
The plugin is skipped under Vitest because its workerd runner cannot load in the test worker.

**Considered Options**

- **Stay on Netlify**: Rejected because the project standardizes on Cloudflare for hosting alongside
  the reference setup.
- **Cloudflare Pages**: Rejected because Pages is in maintenance and Workers Static Assets is the
  current path.
- **Wrangler bundler**: Rejected because `cf` is the single CLI for project, account, and resource
  tasks, and the typed config gives editors and agents autocomplete.

**Consequences**

- `pnpm deploy` runs `cf deploy`, which builds with Vite then uploads `dist/` as Worker assets.
- `VITE_*` values bake in at build time. The `cf` build does not read `.env.production.local`, so
  export the values in your shell first. No Worker bindings or secrets are needed: Convex remains
  the backend.
- Deploying needs `cf auth login` (interactive) or `CLOUDFLARE_API_TOKEN` in automation.
- `cf` cannot stream live logs yet; use the global `wrangler tail next-bite` for that.
