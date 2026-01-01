# Lomnia

**My life, in data**

Find out more about the data I collected in 2024: https://lorenzomodolo.com/posts/2024-tracking-recap/

## Screenshots

<div align="center">
  <table>
    <tr>
      <td colspan="2">
        <img src="https://github.com/user-attachments/assets/f12e3332-b0e6-4f2c-9979-2ee69dc595ac" alt="General dashboard" width="100%"/>
        <p align="center"><em>General dashboard</em></p>
      </td>
    </tr>
    <tr>
      <td width="50%">
        <img src="https://github.com/user-attachments/assets/e2d7c25d-c569-41d5-a9ad-59f0cc7d7088" alt="Creating a new chart" width="100%"/>
        <p align="center"><em>Creating a new chart</em></p>
      </td>
      <td width="50%">
        <img src="https://github.com/user-attachments/assets/d81a6928-a591-4b9c-a244-e174b51e8b22" alt="Habit Feature rules" width="100%"/>
        <p align="center"><em>Creating Habit Feature rules to report on habits</em></p>
      </td>
    </tr>
    <tr>
      <td colspan="2">
        <img src="https://github.com/user-attachments/assets/5f9537f0-88a3-4151-98fe-411746979f42" alt="Trip to Toronto" width="100%"/>
        <p align="center"><em>Trip to Toronto, with diary entries and weather information (blurred by turning on private mode)</em></p>
      </td>
    </tr>
  </table>
</div>

## Overview

Lomnia aggregates data from multiple sources like smart watches, self-hosted software, and various APIs into a single database to answer questions about your life that would otherwise be impossible to track:

- Where was I exactly one year ago?
- How much did I fly in the last 5 years?
- How many times have I woken up to see fresh snow outside?
- How does the weather impact the genre of music I listen to?
- How many cities have I visited?

## Features

### Data Sources

Lomnia integrates with a wide variety of data sources:

- ✅ **Location Tracking**: Owntracks for GPS data
- ✅ **Health & Activity**: Samsung Health
- ⬜ **Music**: Spotify API
- ✅ **Weather**: OpenWeather API
- ✅ **Location Details**: Nominatim
- ✅ **Location Details**: User defined points of interest
- ✅ **Obsidian**: Integration with Obsidian daily notes and files
- ✅ **[Hares](https://github.com/lorenzopicoli/hares)**: Integration with Hares for habit tracking
- ⬜ **Finance**: Beancount double-entry bookkeeping with custom importers
- ⬜ **Browser History**

## Project Status

**Can I use it?**

No, you probably cannot use it. Lomnia is currently in active development and the first goal is to have something that I can use on a daily basis before thinking of how other people can use it.

## Privacy

Your data belongs to you. Lomnia is designed to be self-hosted, keeping all your personal information under your control.

## Development

### Quick Start

1. Install dependencies:
```bash
pnpm install
```

2. Set up environment variables:
```bash
# Backend
cp backend/.env.example backend/.env

# Frontend has no environment variables
```

3. Start local database:
```bash
cd backend && docker compose up -d db
```

4. Run development servers:
```bash
pnpm dev:backend  # Terminal 1: API server on port 3010
pnpm dev:frontend # Terminal 2: Frontend on port 5173
```

### Environment Variables

- **Backend:** See [`backend/.env.example`](./backend/.env.example)
- **Frontend:** No environment variables required

### Docker Development

For testing production builds locally:

```bash
# Backend with database (runs on port 3010)
cd backend && docker compose up --build --force-recreate

# Frontend (runs on port 3000)
cd frontend && docker compose up --build --force-recreate
```

### Available Scripts

From the root directory:

| Script | Description |
|--------|-------------|
| `pnpm dev:frontend` | Start frontend development server |
| `pnpm dev:backend` | Start backend development server |
| `pnpm build:frontend` | Build frontend for production |
| `pnpm build:backend` | Build backend for production |
| `pnpm docker:frontend` | Build frontend Docker image |
| `pnpm docker:backend` | Build backend Docker image |

For more detailed backend setup instructions, see [`backend/README.md`](./backend/README.md).
