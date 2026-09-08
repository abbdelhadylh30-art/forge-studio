#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# run-turso-e2e — all-in-one launcher for the dual-instance Turso E2E.
#
# The sandbox reaps any process that outlives the command that spawned it,
# so the two production instances must live INSIDE one command: launch A+B,
# wait for health, run scripts/e2e-turso.sh, then tear both down (trap).
#
# Required env (inline, never committed):
#   DATABASE_URL=libsql://…  DATABASE_AUTH_TOKEN=…  STUDIO_PASSCODE=…
# Usage: DATABASE_URL=… DATABASE_AUTH_TOKEN=… STUDIO_PASSCODE=… bash scripts/run-turso-e2e.sh
# ─────────────────────────────────────────────────────────────────────────────
set -uo pipefail
cd "$(dirname "$0")/.."

: "${DATABASE_URL:?DATABASE_URL env is required}"
: "${DATABASE_AUTH_TOKEN:?DATABASE_AUTH_TOKEN env is required}"
: "${STUDIO_PASSCODE:?STUDIO_PASSCODE env is required}"

A_PID=""; B_PID=""
cleanup() {
  [ -n "$A_PID" ] && kill "$A_PID" 2>/dev/null
  [ -n "$B_PID" ] && kill "$B_PID" 2>/dev/null
}
trap cleanup EXIT

env DATABASE_URL="$DATABASE_URL" DATABASE_AUTH_TOKEN="$DATABASE_AUTH_TOKEN" \
  STUDIO_PASSCODE="$STUDIO_PASSCODE" PORT=3001 HOSTNAME=127.0.0.1 \
  node .next/standalone/server.js > scripts/e2e-a.log 2>&1 &
A_PID=$!

env DATABASE_URL="$DATABASE_URL" DATABASE_AUTH_TOKEN="$DATABASE_AUTH_TOKEN" \
  STUDIO_PASSCODE="$STUDIO_PASSCODE" PORT=3002 HOSTNAME=127.0.0.1 \
  node .next/standalone/server.js > scripts/e2e-b.log 2>&1 &
B_PID=$!

HA=""; HB=""
for _ in $(seq 1 40); do
  HA=$(curl -s -o /dev/null -w '%{http_code}' -m 3 http://127.0.0.1:3001/api/health 2>/dev/null)
  HB=$(curl -s -o /dev/null -w '%{http_code}' -m 3 http://127.0.0.1:3002/api/health 2>/dev/null)
  [ "$HA" = "200" ] && [ "$HB" = "200" ] && break
  kill -0 "$A_PID" 2>/dev/null || { echo "INSTANCE A DIED — log tail:"; tail -n 15 scripts/e2e-a.log; exit 1; }
  kill -0 "$B_PID" 2>/dev/null || { echo "INSTANCE B DIED — log tail:"; tail -n 15 scripts/e2e-b.log; exit 1; }
  sleep 2
done
[ "$HA" = "200" ] && [ "$HB" = "200" ] || { echo "health never turned 200 (A=$HA B=$HB)"; tail -n 15 scripts/e2e-a.log; exit 1; }
echo "» dual production instances up — A:3001 (pid $A_PID), B:3002 (pid $B_PID), shared DB: ${DATABASE_URL%%.*}"

bash scripts/e2e-turso.sh
