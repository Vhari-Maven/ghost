# Ghost

A personal dashboard for tracking fitness, habits, and more. Built with SvelteKit, SQLite, and Tailwind CSS.

## Features

### Morning Tracker (`/morning`)
- Track daily weight, walk distance, and incline
- Habit checkboxes: breakfast, brush, floss, shower, protein shake
- ±5 day view centered on today
- Inline editing with auto-save
- Streak indicators for habits
- One-click copy of yesterday's walk data

### Exercise Tracker (`/exercise`)
- 7-day workout rotation (Upper Push, Lower, Upper Pull, Recovery)
- Machine-focused exercises for beginners with detailed instructions
- Set logging with reps/weight tracking
- Historical comparison for progressive overload
- Always-Do Stack: daily cardio, core, and mobility
- Glossary tooltips for exercise terminology

### Task Tracker (`/tasks`)
- Kanban board with Todo, In Progress, and Done columns
- Drag-and-drop tasks between columns
- Color-coded labels for categorization
- Rapid task entry (Enter to add, stay in form for more)
- Inline editing with label management

### Shopping List (`/shopping`)
- Kanban-style with To Buy and Ordered columns
- Drag-and-drop reordering

### Video Games (`/games`)
- Tier-ranking system (S through C tiers)
- Steam library integration
- Drag-and-drop reordering within tiers

### Meal Prep (`/meal-prep`)
- Meal planning guide with nutrition tracking
- Toggleable meal sections (breakfast, salmon dinners, bean soup, mediterranean bowl)
- Batch prep instructions and grocery lists
- Calorie and macro breakdowns

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
| `npm run db:seed-games` | Seed video games database |

## Project Structure

```
ghost/
├── src/
│   ├── lib/
│   │   ├── db/           # Database connection, schema, migrations
│   │   ├── components/   # Shared UI components
│   │   ├── services/     # Business logic and DB operations
│   │   └── data/         # Static data (exercises, glossary, equipment)
│   ├── routes/
│   │   ├── +layout.svelte    # App shell with navigation
│   │   ├── +page.svelte      # Dashboard home
│   │   ├── morning/          # Morning tracker
│   │   ├── exercise/         # Exercise tracker
│   │   ├── tasks/            # Task tracker
│   │   ├── shopping/         # Shopping list
│   │   ├── games/            # Video games tier list
│   │   └── meal-prep/        # Meal prep guide
│   ├── app.css           # Global styles
│   └── app.html          # HTML template
├── tests/                # E2E tests (Playwright)
│   └── helpers/          # Page Object Model helpers
├── drizzle/              # Generated SQL migrations
├── data/                 # SQLite database (gitignored)
└── drizzle.config.ts     # Drizzle configuration
```

## Architecture

Ghost uses a **micro-app architecture** where each feature (morning tracker, exercise, tasks, shopping, games, meal prep) is a self-contained module with its own routes and logic, but they all share:

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
