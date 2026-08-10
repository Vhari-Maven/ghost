# Per-project Dockerfile — only needed when a project requires tools beyond
# what dev-base provides (bun, uv, claude, gh, git, jq, sqlite is NOT in base,
# python3 is, etc.). Delete this file if `image:` in devcontainer.json is enough.

FROM ghcr.io/vhari-maven/dev-base:v1

USER root
RUN apt-get update && apt-get install -y --no-install-recommends \
      sqlite3 \
      # Runtime libs for Playwright's chromium-headless-shell (headless visual
      # checks of the app; the browser itself installs per-user via
      # `bun node_modules/playwright-core/cli.js install chromium-headless-shell`
      # with PLAYWRIGHT_DOWNLOAD_HOST=https://cdn.playwright.dev)
      libasound2 libatk1.0-0 libatk-bridge2.0-0 libatspi2.0-0 libgbm1 \
      libglib2.0-0 libnspr4 libnss3 libx11-6 libxcb1 libxcomposite1 \
      libxdamage1 libxext6 libxfixes3 libxkbcommon0 libxrandr2 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Overlay dev-base's firewall script with a patched copy that accepts raw
# IPv4/CIDR lines in firewall-extra (fly deploy's depot builder is dialed by
# bare IP, invisible to domain-based allowlisting). Same path, so the
# existing sudoers grant still applies. See header comment in the script.
COPY --chmod=755 --chown=root:root init-firewall.sh /usr/local/bin/init-firewall.sh

# flyctl for deploying ghost to Fly.io (app: ghost-dashboard, see fly.toml).
# Installed to /opt/flyctl; `fly`/`flyctl` on PATH are wrappers that inject
# FLY_API_TOKEN from the mounted podman secret (see secrets.list +
# devcontainer.json runArgs), mirroring how github_token is wired.
RUN curl -fsSL https://fly.io/install.sh | FLYCTL_INSTALL=/opt/flyctl sh \
    && printf '%s\n' \
      '#!/bin/sh' \
      'if [ -z "${FLY_API_TOKEN:-}" ] && [ -r /run/secrets/fly-api-token ]; then' \
      '  FLY_API_TOKEN="$(cat /run/secrets/fly-api-token)"; export FLY_API_TOKEN' \
      'fi' \
      'exec /opt/flyctl/bin/flyctl "$@"' \
      > /usr/local/bin/fly \
    && chmod 755 /usr/local/bin/fly \
    && ln -sf fly /usr/local/bin/flyctl

USER dev
# Per-user tool installs (uv/bun/pip --user) go here, e.g.:
# RUN uv tool install ruff
# RUN bun install -g biome
