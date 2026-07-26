# Better Sketchfab 🎨📦

**Better Sketchfab** is an enhanced technical geometry & shading inspector web application for downloadable Sketchfab 3D models. Built with **TanStack Start** (React 19 + TanStack Router SSR) targeting **Cloudflare Workers / Pages**.

## Key Features

- **Extended Filtering & Sorting**: Filter 3D models by face count (polycount range slider), PBR materials, animations, rigging, sound, licenses, staff picks, and downloadable status.
- **Dual View Modes**: Switch between responsive Grid card layout and detailed Matrix table view.
- **3D Geometry & Shading Inspector**: Interactive model detail view with embedded 3D viewer, polygon counts, vertex counts, texture sizes, and ZIP manifest inspection.
- **Dark / Light Theme System**: Instant theme toggling with zero-flash pre-hydration theme resolution.
- **Personal API Key Support**: Connect your personal Sketchfab API token for S3 GLTF manifest inspection and direct downloads.

## Tech Stack

- **Framework**: TanStack Start (React 19 + TanStack Router)
- **Deployment**: Cloudflare Workers / Pages (`wrangler`)
- **Styling**: Tailwind CSS v4 + Base UI / Shadcn primitives + Lucide Icons
- **Toolchain**: Biome (`biome check`) & `pnpm`

## Getting Started

### Prerequisites

- Node.js (v18+)
- `pnpm`

### Installation

```bash
pnpm install
```

### Local Development

```bash
pnpm run dev
```

### Verification & Linting

```bash
pnpm run check
pnpm run build
```

### Deployment

```bash
pnpm run deploy
```
