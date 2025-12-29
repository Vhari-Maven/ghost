# Deploying Ghost to Fly.io

## Prerequisites

1. Install the Fly CLI: https://fly.io/docs/flyctl/install/
2. Create an account: `fly auth signup` (or `fly auth login` if you have one)

## Initial Setup

### 1. Launch the app (first time only)

```bash
fly launch --no-deploy
```

This will:
- Detect the Dockerfile
- Use the existing `fly.toml` config
- Ask you to confirm settings (app name, region)

**Change the app name** if `ghost-dashboard` is taken.

### 2. Create the persistent volume

```bash
fly volumes create ghost_data --size 1 --region iad
```

> Replace `sea` with your region from `fly.toml` if you changed it.

### 3. Upload your existing database

```bash
# Open SFTP shell to the volume
fly sftp shell

# Once connected:
put data/ghost.db /data/ghost.db
exit
```

### 4. Deploy

```bash
fly deploy
```

Your app will be live at `https://ghost-dashboard.fly.dev` (or whatever name you chose).

## Subsequent Deploys

Just run:

```bash
fly deploy
```

## Useful Commands

```bash
fly status          # Check app status
fly logs            # Stream logs
fly ssh console     # SSH into the running container
fly sftp shell      # Transfer files to/from volumes
fly open            # Open app in browser
```

## Database Backups

Download your database:

```bash
fly sftp shell
get /data/ghost.db ./backup-ghost.db
exit
```

## Running Migrations on Deploy

If you need to run migrations after deploying schema changes, SSH in and run:

```bash
fly ssh console
cd /app
bun src/lib/db/migrate.ts
```

Or add a release command to `fly.toml`:

```toml
[deploy]
  release_command = "bun src/lib/db/migrate.ts"
```

## Adding Cloudflare Access (Optional)

To protect your dashboard with Google login via Cloudflare:

1. Add your Fly app's domain to Cloudflare (or use a custom domain)
2. Go to Cloudflare Zero Trust → Access → Applications
3. Create an application with your app's URL
4. Add a policy requiring your Google email
5. Done - Cloudflare handles auth before requests reach your app

## Regions

Change `primary_region` in `fly.toml` to your nearest:
- `sea` - Seattle
- `sjc` - San Jose
- `lax` - Los Angeles
- `ord` - Chicago
- `iad` - Virginia
- `ewr` - New Jersey

Full list: `fly platform regions`
