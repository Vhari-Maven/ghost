#!/usr/bin/env bash
# load-secrets.sh — host-side helper that creates podman secrets from
# GPG-encrypted files in ~/.secrets-enc/ based on a project-supplied list.
#
# Runs on the HOST via devcontainer.json's `initializeCommand`, before the
# container is built. The first argument is the project workspace path; the
# script reads <workspace>/.devcontainer/secrets.list for which secrets to load.
#
# secrets.list format (one entry per line; blank lines and # comments OK):
#   <podman-secret-name>:<source-stem>
#   github_token:github-token
#   openrouter_key:openrouter-api-key
#
# For each entry, decrypts ~/.secrets-enc/<source-stem>.gpg into a podman
# secret named <podman-secret-name>. devcontainer.json must also mount the
# secret into the container via a matching --secret=...,type=mount run arg.
#
# Adding/rotating a key:
#   gpg -r jimmybdavis@gmail.com -o ~/.secrets-enc/<name>.gpg --encrypt <plaintext>
#   (then remove the plaintext)
set -uo pipefail

WORKSPACE="${1:-$PWD}"
LIST_FILE="${WORKSPACE}/.devcontainer/secrets.list"
ENC_DIR="${HOME}/.secrets-enc"

if [ ! -r "$LIST_FILE" ]; then
    echo "load-secrets: no $LIST_FILE — skipping"
    exit 0
fi

while IFS= read -r line; do
    line="${line%%#*}"                        # strip comments
    line="$(echo "$line" | tr -d '[:space:]')" # strip whitespace
    [ -z "$line" ] && continue

    name="${line%%:*}"
    stem="${line##*:}"
    enc="${ENC_DIR}/${stem}.gpg"

    if [ ! -r "$enc" ]; then
        echo "load-secrets: $enc not found — skipping $name" >&2
        continue
    fi

    if gpg --batch -q -d "$enc" 2>/dev/null \
         | podman secret create --replace "$name" - >/dev/null; then
        echo "load-secrets: $name <- $enc"
    else
        echo "load-secrets: failed to load $name from $enc" >&2
    fi
done < "$LIST_FILE"
