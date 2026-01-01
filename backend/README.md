# Lomnia Backend

## Setup

### Prerequisites

- Node.js
- pnpm

### Quick Start

1. Install dependencies:

```bash
pnpm install
```

2. Set up local database:

```bash
docker compose up -d db
```

3. Copy environment variables:

```bash
cp .env.example .env
```

4. Run database migrations:

```bash
pnpm migration:up
```

5. Start development server:

```bash
pnpm dev:server
```

### Environment Variables

See [`.env.example`](./.env.example) for all available configuration options.

## Available Scripts

### Development

| Script                    | Description                          |
| ------------------------- | ------------------------------------ |
| `pnpm dev:server`         | Start API server with hot reload     |
| `pnpm dev:importer`       | Run data importer once               |
| `pnpm dev:importer:watch` | Run data importer with file watching |
| `pnpm dev:ingester`       | Start queue listener                 |
| `pnpm dev:ingester:watch` | Start queue listener with hot reload |
| `pnpm dev:ingester:file`  | Ingest a specific file               |

### Production

| Script          | Description                            |
| --------------- | -------------------------------------- |
| `pnpm build`    | Build TypeScript to `build/` directory |
| `pnpm server`   | Start production server                |
| `pnpm importer` | Run production importer                |

### Database

| Script                      | Description             |
| --------------------------- | ----------------------- |
| `pnpm migration:new <name>` | Create new migration    |
| `pnpm migration:up`         | Run pending migrations  |
| `pnpm migration:rollback`   | Rollback last migration |

### Code Quality

| Script          | Description                 |
| --------------- | --------------------------- |
| `pnpm lint`     | Run Biome linter            |
| `pnpm format`   | Format code with Biome      |
| `pnpm ts:check` | Type check without emitting |

### Utilities

| Script                  | Description                    |
| ----------------------- | ------------------------------ |
| `pnpm add-poi`          | Format points of interest data |
| `pnpm schemas:generate` | Generate ingestion schemas     |

## Database

### Local Development

```bash
# Start database with PGAdmin
docker compose up

# Access PGAdmin at http://localhost:8888
# Email: lomnia@lomnia.com, Password: lomnia
```

### Connection Details

| Property | Value                                 |
| -------- | ------------------------------------- |
| Host     | localhost (or `db` when using Docker) |
| Port     | 5433                                  |
| Username | lomnia                                |
| Password | lomnia                                |
| Database | lomnia                                |

## Docker Development

For testing the production build locally:

```bash
docker compose up --build --force-recreate
```

This will build and start:

- Backend API server on port 3010
- PostgreSQL database on port 5433
- PGAdmin on port 8888
