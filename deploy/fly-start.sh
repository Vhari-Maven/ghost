#!/bin/sh
# Fly entrypoint: join the tailnet (so /cameras can reach the camera gateway on kitten), then start Ghost.
# Tailscale is optional: without TS_AUTHKEY and without saved state, Ghost starts as before and
# /cameras shows the cameras as offline. A Tailscale failure never blocks Ghost from starting.
#
# State lives on the /data volume, so the auth key is only used on the very first boot; after that the
# node re-uses its identity (tagged nodes don't expire). Expected tailnet policy: this node is tag:ghost
# and may reach only kitten:8787.
TS_STATE_DIR=/data/tailscale

if [ -n "${TS_AUTHKEY:-}" ] || [ -f "$TS_STATE_DIR/tailscaled.state" ]; then
  mkdir -p "$TS_STATE_DIR" /var/run/tailscale
  tailscaled --state="$TS_STATE_DIR/tailscaled.state" --statedir="$TS_STATE_DIR" \
    --socket=/var/run/tailscale/tailscaled.sock >/tmp/tailscaled.log 2>&1 &

  i=0
  while [ ! -S /var/run/tailscale/tailscaled.sock ] && [ $i -lt 50 ]; do sleep 0.2; i=$((i + 1)); done

  if tailscale up ${TS_AUTHKEY:+--auth-key="$TS_AUTHKEY"} --hostname="${TS_HOSTNAME:-ghost-fly}" \
       --advertise-tags=tag:ghost --accept-dns=false --accept-routes=false --netfilter-mode=off --timeout=45s; then
    echo "[tailscale] up as $(tailscale ip -4 2>/dev/null)"
  else
    echo "[tailscale] failed to come up; cameras will be offline. Log tail:"
    tail -n 20 /tmp/tailscaled.log
  fi
fi

exec bun ./build
