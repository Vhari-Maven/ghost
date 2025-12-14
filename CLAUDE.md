# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/claude-code) when working with this codebase.

## Project Overview

Ghost is a personal dashboard application with a micro-app architecture. Each feature (fitness tracker, shopping list, media queue, tasks) is a self-contained module that shares a common database and UI framework.

## Tech Stack

- **SvelteKit 5** with TypeScript - uses runes (`$state`, `$props`, `$derived`) and `{@render}` for snippets
- **Tailwind CSS 4** - utility-first styling via `@tailwindcss/vite` plugin
- **SQLite** via `better-sqlite3` - local database stored at `data/ghost.db`
- **Drizzle ORM** - type-safe database queries and migrations

## Common Commands

```bash
npm run dev          # Start dev server on localhost:5173
npm run db:generate  # Generate migrations after schema changes
npm run db:migrate   # Apply pending migrations
npm run db:seed      # Seed database with sample data
```

## Architecture Patterns

### Micro-App Structure
Each feature lives in its own route directory with:
- `+page.svelte` - UI component
- `+page.server.ts` - Server-side data loading and form actions

For complex features, extract reusable components and services:
- `src/lib/components/{feature}/` - Feature-specific components
- `src/lib/services/{feature}.ts` - Database operations and business logic

### Database Schema
All tables are defined in `src/lib/db/schema.ts` using Drizzle's SQLite schema builder. After changes:
1. Run `npm run db:generate` to create migration
2. Run `npm run db:migrate` to apply it

### Form Handling
Uses SvelteKit's `use:enhance` for progressive enhancement with optimistic updates. Pattern:
```svelte
<form method="POST" action="?/actionName" use:enhance={() => {
  // Optimistic update here
  return async ({ update }) => {
    await update({ reset: false });
  };
}}>
```

### Styling Conventions
- CSS variables defined in `src/app.css` for theming (`--color-bg`, `--color-surface`, `--color-accent`, etc.)
- Dark theme with cyan "ghost in the machine" aesthetic
- Use Tailwind utilities with CSS variables: `class="bg-[var(--color-surface)]"`
- See `DESIGN.md` for full visual design guide (colors, icons, effects)

## Key Files

- `src/lib/db/schema.ts` - Database schema definitions
- `src/lib/db/index.ts` - Database connection
- `src/lib/services/` - Service layer for database operations
- `src/lib/components/` - Reusable UI components
- `src/routes/+layout.svelte` - App shell with navigation
- `src/app.css` - Global styles and CSS variables
- `drizzle.config.ts` - Drizzle ORM configuration

## Adding a New Micro-App

1. Create route directory: `src/routes/{app-name}/`
2. Add `+page.svelte` and `+page.server.ts`
3. Add database tables to `src/lib/db/schema.ts`
4. Run `npm run db:generate && npm run db:migrate`
5. Enable nav link in `src/routes/+layout.svelte` (set `enabled: true`)

## Current Micro-Apps

### Fitness Tracker (`/fitness`)
Tracks daily metrics and habits:
- **Numeric fields**: weight, walkDistance, walkIncline
- **Boolean habits**: breakfast, brush, floss, shower, shake
- **Features**: ±5 day view, streak calculation, copy yesterday's walk data

### Task Tracker (`/tasks`)
Kanban-style task management with three columns (Todo, In Progress, Done):
- **Drag-and-drop**: Uses `svelte-dnd-action` for reordering and moving between columns
- **Labels**: Color-coded tags that can be assigned to tasks
- **Features**: Rapid task entry (Enter to add, stay in form), inline editing, delete confirmation modal
- **Architecture**: Extracted components in `src/lib/components/tasks/`, service layer in `src/lib/services/tasks.ts`

## Testing

```bash
npm test            # Run unit tests (Vitest)
npm run test:e2e    # Run E2E tests (Playwright)
```

E2E tests use Page Object Model pattern - see `tests/helpers/` for reusable test utilities.

## Deployment

The app is deployed on **Fly.io** with **Cloudflare Access** for authentication.

- **Production URL**: `https://ghostdash.dev`
- **Fly app**: `ghost-dashboard`
- **Region**: `iad` (Virginia)

### Key deployment files:
- `Dockerfile` - Multi-stage Node.js build with better-sqlite3
- `fly.toml` - Fly.io configuration
- `src/hooks.server.ts` - Blocks direct access to fly.dev (requires Cloudflare proxy)
- `DEPLOY.md` - Full deployment guide

### Deploy changes:
```bash
fly deploy
```

### Database is on a persistent volume:
- Path in production: `/data/ghost.db`
- Configured via `DATABASE_PATH` env var
- Backup: `fly sftp shell` → `get /data/ghost.db ./backup.db`

## Future Plans

- Shopping list micro-app
- Media queue micro-app
