#!/bin/bash
# init-firewall.sh — egress firewall for the devcontainer.
#
# PROJECT OVERLAY: this is a patched copy of dev-base's init-firewall.sh,
# installed over the baked one by .devcontainer/Dockerfile. Sole change:
# firewall-extra lines may also be raw IPv4 addresses or CIDR blocks
# (e.g. 149.248.192.0/19), added to the egress ipset directly — needed for
# fly deploy's depot builder, which flyctl dials by raw IP so domain-based
# (dnsmasq) allowlisting never sees it. Upstream candidate for dev-images;
# until then, dev-base updates to this script won't reach this project.
#
# Drops all outbound traffic except:
#   - DNS, localhost, SSH, established connections, host LAN
#   - GitHub IP ranges (fetched from api.github.com/meta)
#   - A default allowlist of common dev domains
#   - Any extra domains, IPs, or CIDR blocks listed in
#     /workspace/.devcontainer/firewall-extra
#     (one per line; blank lines and # comments OK)
#
# Run by the dev user via sudoers entry; expects NET_ADMIN + NET_RAW caps.
set -euo pipefail
IFS=$'\n\t'

EXTRA_FILE=/workspace/.devcontainer/firewall-extra

# Preserve Docker DNS rules before flushing
DOCKER_DNS_RULES=$(iptables-save -t nat | grep "127\.0\.0\.11" || true)

iptables -F; iptables -X
iptables -t nat -F; iptables -t nat -X
iptables -t mangle -F; iptables -t mangle -X
ipset destroy allowed-domains 2>/dev/null || true

# Flushing does not reset chain policies, so a re-run inside an already
# firewalled container would start from OUTPUT DROP with every allow rule gone
# — blocking the GitHub-ranges fetch below and aborting the script under
# `set -e`, leaving the container with no egress at all. Reset to the same
# state a fresh container boots in; the DROP policies go back on at the end.
iptables -P INPUT ACCEPT; iptables -P FORWARD ACCEPT; iptables -P OUTPUT ACCEPT

# Resolver bookkeeping, before anything below needs to resolve a name. The
# dnsmasq block further down points /etc/resolv.conf at 127.0.0.1, so on a
# re-run we must recover the real upstream and put it back *now*: every step
# below then resolves against something that works, and any early exit leaves a
# usable resolver rather than a dnsmasq we were about to restart.
UPSTREAM_FILE=/run/firewall-upstream-dns
UPSTREAM_DNS=$(awk '/^nameserver/ && $2 != "127.0.0.1" {print $2; exit}' /etc/resolv.conf)
if [ -n "$UPSTREAM_DNS" ]; then
    printf '%s\n' "$UPSTREAM_DNS" > "$UPSTREAM_FILE"   # first run: stash it
else
    UPSTREAM_DNS=$(cat "$UPSTREAM_FILE" 2>/dev/null || true)
    [ -n "$UPSTREAM_DNS" ] || UPSTREAM_DNS=127.0.0.11  # Docker's embedded DNS
    printf 'nameserver %s\n' "$UPSTREAM_DNS" > /etc/resolv.conf
fi

if [ -n "$DOCKER_DNS_RULES" ]; then
    echo "Restoring Docker DNS rules..."
    iptables -t nat -N DOCKER_OUTPUT 2>/dev/null || true
    iptables -t nat -N DOCKER_POSTROUTING 2>/dev/null || true
    echo "$DOCKER_DNS_RULES" | xargs -L 1 iptables -t nat
fi

# Always-allowed: DNS, SSH, localhost
iptables -A OUTPUT -p udp --dport 53 -j ACCEPT
iptables -A INPUT  -p udp --sport 53 -j ACCEPT
iptables -A OUTPUT -p tcp --dport 22 -j ACCEPT
iptables -A INPUT  -p tcp --sport 22 -m state --state ESTABLISHED -j ACCEPT
iptables -A INPUT  -i lo -j ACCEPT
iptables -A OUTPUT -o lo -j ACCEPT

# maxelem well above the 65536 default: dnsmasq adds every resolved IP of an
# allowlisted domain (see below) and entries never expire, so a long-lived
# container against rotating CDNs would otherwise fill the set, after which
# adds fail silently and egress starts getting REJECTed.
ipset create allowed-domains hash:net maxelem 262144

# GitHub IP ranges (web + api + git)
echo "Fetching GitHub IP ranges..."
gh_ranges=$(curl -sS https://api.github.com/meta)
if ! echo "$gh_ranges" | jq -e '.web and .api and .git' >/dev/null; then
    echo "ERROR: GitHub meta response missing required fields" >&2
    exit 1
fi
while read -r cidr; do
    [[ "$cidr" =~ ^[0-9.]+/[0-9]+$ ]] || { echo "Bad CIDR: $cidr" >&2; exit 1; }
    ipset add allowed-domains "$cidr"
done < <(echo "$gh_ranges" | jq -r '(.web + .api + .git)[]' | aggregate -q)

# Default allowlist: things every project tends to need.
DEFAULT_DOMAINS=(
  api.anthropic.com
  console.anthropic.com
  downloads.claude.ai
  registry.npmjs.org
  pypi.org
  files.pythonhosted.org
  ghcr.io
  pkg-containers.githubusercontent.com
  sentry.io
  statsig.com
  api.statsig.com
  statsigapi.net
  featuregates.org
  marketplace.visualstudio.com
  vscode.blob.core.windows.net
  update.code.visualstudio.com
)

# Baked image extras: domains required by tools baked into the image itself
# (e.g. rust-base drops crates.io here). A derived image extends the allowlist
# by dropping a file in /etc/firewall-extra.d/ — no need to fork this script.
EXTRA_DOMAINS=()
EXTRA_CIDRS=()

# Raw IPv4 address or CIDR block → straight into the ipset; anything else is
# treated as a domain. CIDRs bypass the dnsmasq path entirely (there is no
# name to resolve), which is the point: they admit endpoints that clients
# dial by bare IP.
classify_extra() {
    local entry="$1"
    if [[ "$entry" =~ ^[0-9]{1,3}(\.[0-9]{1,3}){3}(/[0-9]{1,2})?$ ]]; then
        EXTRA_CIDRS+=("$entry")
    else
        EXTRA_DOMAINS+=("$entry")
    fi
}
if [ -d /etc/firewall-extra.d ]; then
    for f in /etc/firewall-extra.d/*; do
        [ -r "$f" ] || continue        # empty dir → unmatched glob, skip
        echo "Reading baked image extras from $f"
        while IFS= read -r line; do
            line="${line%%#*}"             # strip comments
            line="${line//[[:space:]]/}"   # strip whitespace
            [ -n "$line" ] && classify_extra "$line"
        done < "$f"
    done
fi

# Project extras, if present
if [ -r "$EXTRA_FILE" ]; then
    echo "Reading project extras from $EXTRA_FILE"
    while IFS= read -r line; do
        line="${line%%#*}"             # strip comments
        line="${line//[[:space:]]/}"   # strip whitespace
        [ -n "$line" ] && classify_extra "$line"
    done < "$EXTRA_FILE"
fi

for cidr in "${EXTRA_CIDRS[@]}"; do
    echo "Allowing CIDR $cidr"
    ipset add allowed-domains "$cidr" -exist
done

resolve_and_add() {
    local domain="$1"
    local ips
    ips=$(dig +noall +answer A "$domain" | awk '$4 == "A" {print $5}')
    if [ -z "$ips" ]; then
        echo "WARN: failed to resolve $domain — skipping" >&2
        return 0
    fi
    while read -r ip; do
        [[ "$ip" =~ ^[0-9.]+$ ]] || continue
        ipset add allowed-domains "$ip" -exist
    done < <(echo "$ips")
}

# ---------------------------------------------------------------------------
# Dynamic DNS-driven egress: run dnsmasq as the container's resolver and let it
# add every resolved IP of an allowlisted domain to the ipset at query time.
# This is what makes CDN-backed hosts (downloads.claude.ai for Claude Code
# self-update, marketplace/release blobs) reliable — their DNS rotates through
# large IP pools, so the one-shot resolve-and-pin below often pins an address
# the client never connects to, and egress is REJECTed intermittently. dnsmasq
# re-populates the ipset on the fly, a beat before each connect.
#
# Scope note: dnsmasq's ipset matching covers the listed domain AND all its
# subdomains, so each allowlist entry effectively widens from `host` to
# `*.host`. That is a deliberate widening (CDN hosts need it) but it is a real
# change from the exact-hostname pinning below — keep it in mind when adding
# entries to firewall-extra.
#
# Safety: only hand dnsmasq the resolver after confirming it returns a real
# answer. If it fails to come up, /etc/resolv.conf is left on the upstream the
# bookkeeping at the top of the script established and we rely on the one-shot
# pinning below — worst case is the prior behavior, never a DNS blackout. The
# one-shot loop still runs either way, priming the ipset and serving as the
# fallback.
# ---------------------------------------------------------------------------
ALL_DOMAINS=("${DEFAULT_DOMAINS[@]}" "${EXTRA_DOMAINS[@]}")
DNSMASQ_OK=0
# Guard on the absolute path, not PATH: this is the same binary the start below
# invokes, and /usr/sbin is absent from some callers' PATH (the dev user's, for
# one) — a `command -v` guard would silently skip dnsmasq there.
if [ -x /usr/sbin/dnsmasq ] && [ "${#ALL_DOMAINS[@]}" -gt 0 ]; then
    # UPSTREAM_DNS came from the resolver bookkeeping at the top of the script:
    # 127.0.0.11 under Docker's embedded DNS, the network gateway under
    # podman/aardvark-dns — never hardcoded, and never our own 127.0.0.1.
    DNSMASQ_CONF=/etc/dnsmasq-firewall.conf
    {
        echo "# generated by init-firewall.sh — do not edit"
        echo "listen-address=127.0.0.1"
        echo "bind-interfaces"
        echo "no-resolv"           # ignore /etc/resolv.conf (we repoint it here)
        echo "server=$UPSTREAM_DNS"
        echo "user=root"           # keep CAP_NET_ADMIN so ipset writes succeed
        # No cache: a reply served from dnsmasq's own cache does not re-run the
        # ipset add, so a cached name whose IP is missing from the set would be
        # REJECTed. Upstream is a local resolver one hop away; the cache buys
        # nothing worth that failure mode.
        echo "cache-size=0"
        # add resolved IPs of these domains (and subdomains) to the egress ipset
        printf 'ipset=/%s/allowed-domains\n' "$(IFS=/; echo "${ALL_DOMAINS[*]}")"
    } > "$DNSMASQ_CONF"

    # Wait for any prior instance to actually exit — otherwise the new one
    # fails to bind, the old one answers the check below, and we silently keep
    # running with a stale domain list.
    pkill -x dnsmasq 2>/dev/null || true
    for _ in 1 2 3 4 5 6 7 8 9 10; do
        pgrep -x dnsmasq >/dev/null 2>&1 || break
        sleep 0.2
    done

    DNSMASQ_ERR=$(/usr/sbin/dnsmasq --conf-file="$DNSMASQ_CONF" 2>&1) || true

    # Require an actual A record back. Neither weaker test is sufficient on its
    # own: dig exits 0 on SERVFAIL/REFUSED (an upstream that answers but
    # resolves nothing would pass an exit-status check, and we would repoint
    # resolv.conf at a dead end), and `dig +short` prints its "communications
    # error" notice on stdout (so a non-empty-output check passes on timeout).
    for _ in 1 2 3 4 5; do
        answer=$(dig +short +tries=1 +time=1 @127.0.0.1 github.com A 2>/dev/null \
                 | grep -Em1 '^[0-9]+(\.[0-9]+){3}$' || true)
        if [ -n "$answer" ]; then
            DNSMASQ_OK=1
            break
        fi
        sleep 0.3
    done

    if [ "$DNSMASQ_OK" = 1 ]; then
        echo "dnsmasq up (upstream $UPSTREAM_DNS) — dynamic ipset egress for ${#ALL_DOMAINS[@]} domains"
        printf 'nameserver 127.0.0.1\n' > /etc/resolv.conf
    else
        echo "WARN: dnsmasq did not answer — one-shot IP pinning only${DNSMASQ_ERR:+ ($DNSMASQ_ERR)}" >&2
        pkill -x dnsmasq 2>/dev/null || true
        # No resolv.conf restore needed: we only repoint it at 127.0.0.1 on
        # success, and the bookkeeping at the top already put a working
        # upstream back if a previous run had left it pointing here.
    fi
fi

for d in "${DEFAULT_DOMAINS[@]}" "${EXTRA_DOMAINS[@]}"; do
    echo "Resolving $d..."
    resolve_and_add "$d"
done

# Host LAN
HOST_IP=$(ip route | awk '/default/ {print $3; exit}')
if [ -n "$HOST_IP" ]; then
    HOST_NETWORK=$(echo "$HOST_IP" | sed "s/\.[0-9]*$/.0\/24/")
    echo "Host network: $HOST_NETWORK"
    iptables -A INPUT  -s "$HOST_NETWORK" -j ACCEPT
    iptables -A OUTPUT -d "$HOST_NETWORK" -j ACCEPT
fi

# Default policy: drop, then allow established + the allowlist
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT DROP

iptables -A INPUT  -m state --state ESTABLISHED,RELATED -j ACCEPT
iptables -A OUTPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
iptables -A OUTPUT -m set --match-set allowed-domains dst -j ACCEPT
iptables -A OUTPUT -j REJECT --reject-with icmp-admin-prohibited

# IPv6: the allowlist ipset is v4-only, so v6 gets no allowlist — loopback
# only, fast-reject the rest. Without this, v6 egress is governed by kernel
# defaults (ACCEPT) and only blocked today because the container network
# happens to route no v6; this makes deny-by-default explicit. REJECT (not
# silent drop) so AAAA-preferring clients fail fast and fall back to v4.
ip6tables -F; ip6tables -X
ip6tables -P INPUT DROP
ip6tables -P FORWARD DROP
ip6tables -P OUTPUT DROP
ip6tables -A INPUT  -i lo -j ACCEPT
ip6tables -A OUTPUT -o lo -j ACCEPT
ip6tables -A OUTPUT -j REJECT --reject-with icmp6-adm-prohibited

# Smoke test: blocked domain should fail, github should work
if curl --connect-timeout 5 -sf https://example.com >/dev/null 2>&1; then
    echo "ERROR: firewall let https://example.com through" >&2
    exit 1
fi
if ! curl --connect-timeout 5 -sf https://api.github.com/zen >/dev/null 2>&1; then
    echo "ERROR: firewall blocking https://api.github.com" >&2
    exit 1
fi
# Claude Code self-update host — the CDN this whole dnsmasq path exists for.
# No -f: any HTTP status means we connected, which is what is being tested;
# a firewall REJECT fails the connect instead.
if ! curl --connect-timeout 5 -s -o /dev/null https://downloads.claude.ai 2>/dev/null; then
    echo "ERROR: firewall blocking https://downloads.claude.ai (Claude Code self-update)" >&2
    exit 1
fi
echo "Firewall configured (${#DEFAULT_DOMAINS[@]} default + ${#EXTRA_DOMAINS[@]} baked/project domains + ${#EXTRA_CIDRS[@]} CIDRs)"
