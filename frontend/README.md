# Lomnia Frontend

## Setup

### Prerequisites

- Node
- pnpm

### Quick Start

1. Install dependencies:

```bash
pnpm install
```

2. Start development server:

```bash
pnpm dev
```

3. Open http://localhost:5173 in your browser

## Available Scripts

### Development

| Script          | Description                           |
| --------------- | ------------------------------------- |
| `pnpm dev`      | Start Vite dev server with hot reload |
| `pnpm ts:check` | Type check without emitting           |

### Production

| Script         | Description                      |
| -------------- | -------------------------------- |
| `pnpm build`   | Build for production             |
| `pnpm preview` | Preview production build locally |

### Code Quality

| Script        | Description            |
| ------------- | ---------------------- |
| `pnpm lint`   | Run Biome linter       |
| `pnpm format` | Format code with Biome |

## Docker Development

For testing the production build locally:

```bash
docker compose up --build --force-recreate
```

This will build and start the frontend on port 3000.
