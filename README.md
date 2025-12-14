# Ghost

A personal dashboard for tracking fitness, habits, and more. Built with SvelteKit, SQLite, and Tailwind CSS.

## Features

### Fitness & Morning Tracker
- Track daily weight, walk distance, and incline
- Habit checkboxes: breakfast, brush, floss, shower, protein shake
- ±5 day view centered on today
- Inline editing with auto-save
- Keyboard navigation (↑↓ arrows, Enter, Tab)
- Streak indicators for habits
- One-click copy of yesterday's walk data
- Future dates locked until they arrive

### Task Tracker
- Kanban board with Todo, In Progress, and Done columns
- Drag-and-drop tasks between columns
- Color-coded labels for categorization
- Rapid task entry (Enter to add, stay in form for more)
- Inline editing with label management
- Delete confirmation modal

### Coming Soon
- Shopping List
- Media Queue

## Tech Stack

- **Frontend**: SvelteKit 5 + TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: SQLite via better-sqlite3
- **ORM**: Drizzle

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
# Install dependencies
npm install

# Generate database migrations
npm run db:generate

# Run migrations
npm run db:migrate

# (Optional) Seed with sample data
npm run db:seed

# Start dev server
npm run dev
```

The app will be available at `http://localhost:5173`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:e2e` | Run E2E tests (Playwright) |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Apply database migrations |
| `npm run db:seed` | Seed database with sample data |

## Project Structure

```
ghost/
├── src/
│   ├── lib/
│   │   ├── db/           # Database connection, schema, migrations
│   │   ├── components/   # Shared UI components
│   │   └── services/     # Business logic and DB operations
│   ├── routes/
│   │   ├── +layout.svelte    # App shell with navigation
│   │   ├── +page.svelte      # Dashboard home
│   │   ├── fitness/          # Fitness tracker micro-app
│   │   └── tasks/            # Task tracker micro-app
│   ├── app.css           # Global styles
│   └── app.html          # HTML template
├── tests/                # E2E tests (Playwright)
│   └── helpers/          # Page Object Model helpers
├── drizzle/              # Generated SQL migrations
├── data/                 # SQLite database (gitignored)
└── drizzle.config.ts     # Drizzle configuration
```

## Architecture

Ghost uses a **micro-app architecture** where each feature (fitness, shopping, media, tasks) is a self-contained module with its own routes and logic, but they all share:

- Common navigation and layout
- Single SQLite database
- Shared UI components and utilities

This keeps features independent while avoiding duplication.

## Database

The SQLite database is stored at `data/ghost.db`. It's gitignored by default since it contains personal data.

To reset the database:
```bash
rm data/ghost.db
npm run db:migrate
npm run db:seed  # optional
```

## Deployment

Ghost is deployed on [Fly.io](https://fly.io) with [Cloudflare Access](https://www.cloudflare.com/products/zero-trust/access/) for authentication.

See [DEPLOY.md](DEPLOY.md) for setup instructions.

```bash
# Deploy changes
fly deploy

# Backup database
fly sftp shell
# > get /data/ghost.db ./backup.db
```

## License

MIT
