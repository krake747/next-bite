# Our Next Bite

[![Netlify Status](https://api.netlify.com/api/v1/badges/a733814f-3e1f-4b8f-9dab-87b931715958/deploy-status)](https://app.netlify.com/projects/magnificent-frangollo-7954c2/deploys)

![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/krake747/next-bite?utm_source=oss&utm_medium=github&utm_campaign=krake747%2Fnext-bite&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)

A fun web app for friends to share and discover restaurant recommendations. Never wonder where to eat next!
Built with SolidJS, Vite, Tailwind CSS, Convex, Formisch, and Valibot.

[Our next bite](https://nextbite.kevinkraemer.com)

## Getting Started

### Prerequisites

- Node.js (Latest stable version recommended)
- pnpm (Package manager)
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
```

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

- `pnpm dev` - Start frontend development server
- `pnpm convex:dev` - Start local Convex dev server (syncs to cloud dev)
- `pnpm convex:deploy` - Deploy Convex to production
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm fmt` - Format code
- `pnpm lint` - Lint code

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Feel free to open issues and pull requests to contribute to this project. Any contributions you make are
greatly appreciated!

## Acknowledgments

Made with ❤️ for food lovers who love trying new bites 🍝. Built with SolidJS.
