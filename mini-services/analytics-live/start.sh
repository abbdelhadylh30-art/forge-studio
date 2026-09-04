#!/usr/bin/env bash
# Start (or restart) the analytics-live mini-service as a detached daemon.
# The wrapper bash exits immediately; bun is reparented to init (PPID 1) in its
# own session, so it survives tool-command teardown like agent-browser does.
DIR="$(cd "$(dirname "$0")" && pwd)"
# [b]racket trick: match the service process without matching this script itself
pkill -f "analytics-live/index[.]ts" 2>/dev/null
pkill -f "bun --hot index[.]ts" 2>/dev/null
sleep 0.5
cd "$DIR" || exit 1
: > live.log
setsid bash -c 'cd "'"$DIR"'" && bun run dev >> live.log 2>&1 < /dev/null & exit 0'
for i in $(seq 1 20); do
  if curl -sf http://127.0.0.1:3004/health > /dev/null 2>&1; then
    echo "analytics-live up (ws :3003 · http :3004)"
    curl -s http://127.0.0.1:3004/health
    echo
    exit 0
  fi
  sleep 0.5
done
echo "FAILED to start analytics-live:" >&2
cat live.log >&2
exit 1
