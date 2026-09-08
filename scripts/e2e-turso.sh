#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# e2e-turso — simulated-serverless E2E against the hosted Turso DB.
#
# Two INDEPENDENT production server processes (A and B) share one durable
# database — the exact topology Vercel has (traffic lands on random instances).
# Proves the v2.0 "instance B never saw the create → 404" bug is dead, that
# the passcode gate locks the studio but not the published pages, and that
# visitor analytics / leads written via B are readable via A.
#
# Required env (passed inline, never committed):
#   STUDIO_PASSCODE, plus instances already running on $A and $B.
# Usage: STUDIO_PASSCODE=... bash scripts/e2e-turso.sh
# ─────────────────────────────────────────────────────────────────────────────
set -uo pipefail
A="${A:-http://127.0.0.1:3001}"
B="${B:-http://127.0.0.1:3002}"
PASSCODE="${STUDIO_PASSCODE:?STUDIO_PASSCODE env is required}"
JAR="$(mktemp)"
PASS=0; FAIL=0; CREATED_ID=""; CREATED_SLUG=""

step() { printf '\n── %s\n' "$1"; }
ok()   { PASS=$((PASS+1)); printf '  ✓ %s\n' "$1"; }
bad()  { FAIL=$((FAIL+1)); printf '  ✗ FAIL: %s\n' "$1"; }
code() { curl -s -o /dev/null -w '%{http_code}' "$@"; }

# 1. both instances alive
step "1. instance health"
[ "$(code "$A/api/health")" = "200" ] && ok "A /api/health 200" || bad "A /api/health"
[ "$(code "$B/api/health")" = "200" ] && ok "B /api/health 200" || bad "B /api/health"

# 2. passcode gate: studio locked, unlock works
step "2. passcode gate"
LOC=$(curl -s -o /dev/null -w '%{redirect_url}' "$A/")
case "$LOC" in *"/unlock"*) ok "A / redirects to /unlock ($LOC)";; *) bad "A / did not redirect to /unlock ($LOC)";; esac
[ "$(code -X POST "$A/api/unlock" -H 'Content-Type: application/json' -d '{"passcode":"wrong"}')" = "401" ] \
  && ok "wrong passcode → 401" || bad "wrong passcode not rejected"
[ "$(code -X POST "$A/api/unlock" -H 'Content-Type: application/json' -d "{\"passcode\":\"$PASSCODE\"}")" = "200" ] \
  && ok "correct passcode → 200" || bad "correct passcode failed"
curl -s -c "$JAR" -X POST "$A/api/unlock" -H 'Content-Type: application/json' -d "{\"passcode\":\"$PASSCODE\"}" >/dev/null
[ "$(code -b "$JAR" "$A/")" = "200" ] && ok "A / with cookie → 200" || bad "A / with cookie"
[ "$(code "$B/api/analytics?projectId=x")" = "401" ] \
  && ok "studio API without cookie → 401 (locked)" || bad "studio API not gated on B"

# 3. cross-instance durability (the old killer bug)
step "3. create on A → read on B"
CREATE=$(curl -s -b "$JAR" -X POST "$A/api/sites" -H 'Content-Type: application/json' -d '{"name":"Turso E2E Verify"}')
CREATED_ID=$(printf '%s' "$CREATE" | python3 -c 'import json,sys; print(json.load(sys.stdin)["id"])' 2>/dev/null)
CREATED_SLUG=$(printf '%s' "$CREATE" | python3 -c 'import json,sys; print(json.load(sys.stdin)["slug"])' 2>/dev/null)
[ -n "$CREATED_ID" ] && ok "A created site $CREATED_ID (slug $CREATED_SLUG)" || bad "create on A returned no id: $CREATE"
[ "$(code "$B/api/sites/$CREATED_ID")" = "200" ] \
  && ok "B (other process!) GET /api/sites/<id> → 200 — instance scattering DEAD" \
  || bad "B could not read what A created"
LIST=$(curl -s "$B/api/sites")
printf '%s' "$LIST" | grep -q "$CREATED_ID" && ok "B list contains the new site" || bad "B list missing the new site"

# 4. published page + visitor writes via B
step "4. published page + visitor events on B"
PCODE=$(code "$B/p/$CREATED_SLUG")
[ "$PCODE" = "200" ] && ok "B /p/$CREATED_SLUG renders (anonymous, no cookie)" || bad "B /p/$CREATED_SLUG → $PCODE"
[ "$(code -X POST "$B/api/analytics/track" -H 'Content-Type: application/json' \
     -d "{\"projectId\":\"$CREATED_ID\",\"type\":\"pageview\",\"duration\":42}")" = "200" ] \
  && ok "visitor pageview tracked via B" || bad "track via B failed"
[ "$(code -X POST "$B/api/leads" -H 'Content-Type: application/json' \
     -d "{\"projectId\":\"$CREATED_ID\",\"fields\":{\"Name\":\"Visitor\",\"Email\":\"v@test.io\",\"Message\":\"hi\"}}")" = "200" ] \
  && ok "visitor lead captured via B" || bad "lead via B failed"

# 5. cross-instance read-back (written via B, read via A)
step "5. read-back on A (written on B)"
ANALYTICS=$(curl -s -b "$JAR" "$A/api/analytics?projectId=$CREATED_ID")
PV=$(printf '%s' "$ANALYTICS" | python3 -c 'import json,sys; print(json.load(sys.stdin)["stats"]["pageviews"])' 2>/dev/null)
[ "${PV:-0}" -ge 1 ] && ok "A sees B's pageview (stats.pageviews=$PV — shared durable DB)" || bad "A analytics missing pageview ($ANALYTICS)"
LEADS=$(curl -s -b "$JAR" "$A/api/leads?projectId=$CREATED_ID")
printf '%s' "$LEADS" | grep -q 'v@test.io' && ok "A sees B's lead" || bad "A leads missing the lead"

# 6. cross-instance delete + demo seeding
step "6. delete on A → 404 on B"
DCODE=$(code -b "$JAR" -X DELETE "$A/api/sites/$CREATED_ID")
[ "$DCODE" = "200" ] || [ "$DCODE" = "204" ] && ok "A deleted the site" || bad "delete → $DCODE"
[ "$(code "$B/api/sites/$CREATED_ID")" = "404" ] && ok "B now 404s the deleted id (consistency)" || bad "B still serves deleted id"
DEMOS=$(curl -s "$B/api/sites")
DCOUNT=$(printf '%s' "$DEMOS" | python3 -c 'import json,sys; print(len(json.load(sys.stdin)))' 2>/dev/null)
printf '%s' "$DEMOS" | grep -q 'g-shock-ga-b2100-noir' \
  && ok "G-SHOCK showcase demo seeded in hosted DB ($DCOUNT site(s))" \
  || bad "demo showcase not seeded (${DCOUNT:-?} sites)"

rm -f "$JAR"
printf '\n══════════════════════════════════\nRESULT: %d passed, %d failed\n' "$PASS" "$FAIL"
[ "$FAIL" = "0" ]
