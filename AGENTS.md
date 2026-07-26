<!-- intent-skills:start -->

## Skill Loading

Before editing files for a substantial task:

- Run `pnpm dlx @tanstack/intent@latest list` from the workspace root to see available local skills.
- If a listed skill matches the task, run `pnpm dlx @tanstack/intent@latest load <package>#<skill>` before changing files.
- Use the loaded `SKILL.md` guidance while making the change.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.
<!-- intent-skills:end -->

# Project Context & Stack Architecture

## Overview

This application is a 3D Model Technical Geometry & Shading Inspector for downloadable Sketchfab models. It has been converted to a **TanStack Start** SSR web application targeting **Cloudflare Workers / Pages**.

## Key Commands Used

1. **Scaffolding**:

   ```bash
   npx @tanstack/cli@latest create my-tanstack-app --agent --package-manager pnpm --tailwind --deployment cloudflare
   ```

   _Scaffolded into a scratch directory `./scratch/my-tanstack-app` and merged into the main project._

2. **TanStack Intent Skill Installation**:

   ```bash
   npx @tanstack/intent@latest install
   npx @tanstack/intent@latest list
   ```

3. **Toolchain & Verification Commands**:
   ```bash
   pnpm run generate-routes   # Generates TanStack Router tree (src/routeTree.gen.ts)
   pnpm run check             # Runs Biome linting and formatting checks
   pnpm run build             # Builds client assets and Cloudflare SSR worker bundle
   pnpm run dev               # Starts local Vite development server
   pnpm run deploy            # Builds and deploys worker via Wrangler
   ```

## Tech Stack & Integrations

- **Framework**: TanStack Start (React 19 + TanStack Router)
- **Deployment/Hosting Target**: Cloudflare Workers / Pages (`@cloudflare/vite-plugin` with `nodejs_compat` flag and `wrangler.jsonc`)
- **Package Manager**: `pnpm`
- **Project Toolchain**: Biome (`@biomejs/biome` for linting & formatting via `biome.json`)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`) + Lucide icons
- **Data Fetching / Backend**: Server functions (`createServerFn` in `src/lib/sketchfabServerFns.ts`) and API routes (`src/routes/api.*.ts`)

## Server Logic & API Proxying

The Express backend (`server.ts`) was refactored into modular TanStack Start Server Functions and API handlers:

- `fetchSketchfabCategories` (`/api/sketchfab/categories`)
- `searchSketchfabModels` (`/api/sketchfab/search`)
- `fetchSketchfabModelDetails` (`/api/sketchfab/models/$uid`)
- `fetchModelMetadata` (`/api/sketchfab/metadata/$uid`): Remote HTTP Range `.gltf` manifest ZIP parsing via `unzipit`.
- `verifySketchfabToken` (`/api/sketchfab/verify-token`)
- `fetchSketchfabDownloadUrl` (`/api/sketchfab/download/$uid`)
- `api.auth.sketchfab.url` & `api.auth.sketchfab.exchange` (`/auth/callback`): Sketchfab OAuth2 flow and API key verification.

## Environment Variables

- `SKETCHFAB_CLIENT_ID`: (Optional) Custom Sketchfab OAuth Client ID.
- `SKETCHFAB_CLIENT_SECRET`: (Optional) Custom Sketchfab OAuth Client Secret.
- `SKETCHFAB_OAUTH_TOKEN`: (Optional) Server-level fallback token for Sketchfab API queries.
- `APP_URL`: (Optional) Base URL for OAuth callback redirection (e.g. `https://your-domain.workers.dev`).

## Deployment Notes (Cloudflare)

To deploy the application to Cloudflare Workers / Pages:

1. Ensure Wrangler is authenticated (`pnpm wrangler login`).
2. Run `pnpm run deploy` (executes `pnpm run build && wrangler deploy`).

## Gotchas & Solutions

- **Chokidar ESM vs CJS in `@tanstack/router-cli`**: Resolved by specifying a pnpm override `"chokidar": "^3.6.0"` in `package.json`.
- **OXC Parser Bindings**: Added `@oxc-parser/binding-darwin-arm64` to `optionalDependencies` and `pnpm.onlyBuiltDependencies`.
- **CSS Import for Tailwind v4**: Removed missing `@import "shadcn/tailwind.css";` from `src/index.css`.

## API Contract

Refer to https://docs.sketchfab.com/data-api/v3/index.html
