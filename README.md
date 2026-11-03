# Our Next Bite

![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/krake747/next-bite?utm_source=oss&utm_medium=github&utm_campaign=krake747%2Fnext-bite&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)

A fun web app for friends to share and discover restaurant recommendations. Never wonder where to
eat next! Built with React, TypeScript, Tailwind CSS, TanStack Router, TanStack Query, Convex, and
Valibot.

[Our next bite](https://next-bite.kraemer-kevin747.workers.dev)

## Getting Started

### Prerequisites

- Node.js 26+ (pinned by `.node-version`)
- pnpm 12 (pinned by `packageManager`)
- Convex account and project (see [Convex docs](https://docs.convex.dev/quickstart))
- `.env.local` file configured (see Environment Setup below)

### Installation

Clone the repository

```bash
git clone git@github.com:krake747/next-bite.git
cd next-bite
```

Install dependencies

```bash
pnpm install
```

### Environment Setup

Copy the example environment file and configure your Convex deployment:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Convex deployment details (get these from your Convex dashboard):

```env
# Used by Convex CLI for development/deployment
CONVEX_DEPLOYMENT=your-deployment-name

# Used by the application at runtime
VITE_CONVEX_URL=https://your-deployment.convex.cloud
VITE_CONVEX_SITE_URL=https://your-deployment.convex.site
```

For production deploys, put the same keys in `.env.production.local` (gitignored, never committed)
and export them before deploying:

```bash
set -a; . ./.env.production.local; set +a; pnpm deploy
```

Set the required Convex environment variables for authentication:

```bash
# Required for backend authentication (convex/auth.ts)
npx convex env set CONVEX_SITE_URL "https://your-deployment.convex.site"

# Required for Better Auth
npx convex env set BETTER_AUTH_SECRET "$(openssl rand -base64 32)"
```

### Google Maps Setup

Create a Google Cloud project and enable the following APIs:

- **Maps JavaScript API** - Required for displaying maps
- **Places API** - Required for restaurant autocomplete

Create an API key and add it to your `.env.local`:

```env
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

**Note:** For Advanced Markers to work, you need a Map ID. For testing, you can use `DEMO_MAP_ID`.
For production, create a Map ID in Google Cloud Console (Maps Management).

The app includes a Luxembourg location bias for autocomplete suggestions.

Start Convex backend dev server (syncs to your cloud dev project)

```bash
pnpm run convex:dev
```

In another terminal, start the frontend development server

```bash
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Available Scripts

- `pnpm dev` - Start frontend development server (`vp dev`)
- `pnpm convex:dev` - Start local Convex dev server (syncs to cloud dev)
- `pnpm convex:deploy` - Deploy Convex to production
- `pnpm build` - Build for production
- `pnpm deploy` - Deploy the frontend to Cloudflare Workers (needs `cf auth login`)
- `pnpm preview` - Preview production build
- `pnpm test` - Run all Vitest tiers (`test:pure`, `test:unit`, `test:browser`, `test:integration`)
- `pnpm check:full` - Full local gate (format, lint, types, tests, boundaries, build)
- `pnpm fmt` - Format code
- `pnpm lint` - Lint code

## License

This project is licensed under the GNU Affero General Public License v3.0 - see the
[LICENSE](LICENSE) file for details.

## Contributing

Feel free to open issues and pull requests to contribute to this project. Any contributions you make
are greatly appreciated!

## Acknowledgments

Made with ❤️ for food lovers who love trying new bites 🍝. Built with React.
