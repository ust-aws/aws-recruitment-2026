#!/usr/bin/env bash
# curl-based smoke test for the Hono API. Works against a local dev server
# or a deployed API Gateway URL — pass the base URL as $1.
set -uo pipefail

BASE_URL="${1:-http://localhost:8787}"
BASE_URL="${BASE_URL%/}"
UNKNOWN_ID="00000000-0000-4000-8000-000000000000"

pass=0
fail=0
LAST_STATUS=""
LAST_BODY=""

request() {
  local method="$1" path="$2" data="${3:-}"
  local args=(-s -o /tmp/smoke-test-body -w '%{http_code}' -X "$method")
  [[ -n "$data" ]] && args+=(-H 'content-type: application/json' -d "$data")

  LAST_STATUS=$(curl "${args[@]}" "$BASE_URL$path")
  LAST_BODY=$(cat /tmp/smoke-test-body 2>/dev/null || true)
}

expect() {
  local desc="$1" expected="$2"
  if [[ "$LAST_STATUS" == "$expected" ]]; then
    echo "PASS  $desc ($LAST_STATUS)"
    pass=$((pass + 1))
  else
    echo "FAIL  $desc (expected $expected, got $LAST_STATUS)"
    echo "      body: $LAST_BODY"
    fail=$((fail + 1))
  fi
}

json_field() {
  local field="$1"
  printf '%s' "$LAST_BODY" | node -e "
    const fs = require('fs');
    const data = JSON.parse(fs.readFileSync(0, 'utf8'));
    const value = data[process.argv[1]];
    if (value === undefined || value === null) process.exit(1);
    process.stdout.write(String(value));
  " "$field"
}

contains_id() {
  local id="$1"
  printf '%s' "$LAST_BODY" | node -e "
    const fs = require('fs');
    const id = process.argv[1];
    const data = JSON.parse(fs.readFileSync(0, 'utf8'));
    const apps = Array.isArray(data.applications) ? data.applications : [];
    process.exit(apps.some((app) => app.id === id) ? 0 : 1);
  " "$id"
}

echo "Smoke testing $BASE_URL"
echo

request GET "/health"
expect "GET  /health" 200

request GET "/positions"
expect "GET  /positions" 200

positions_count=$(printf '%s' "$LAST_BODY" | node -e "
  const fs = require('fs');
  const rows = JSON.parse(fs.readFileSync(0, 'utf8'));
  process.stdout.write(Array.isArray(rows) ? String(rows.length) : '0');
" 2>/dev/null || echo "0")
if [[ "$positions_count" -ge 6 ]]; then
  echo "PASS  GET /positions returns at least 6 seeded rows ($positions_count)"
  pass=$((pass + 1))
else
  echo "FAIL  GET /positions expected at least 6 rows, got $positions_count"
  fail=$((fail + 1))
fi

POS1=""
POS2=""
committee_id=""
if [[ "$LAST_STATUS" == "200" ]]; then
  POS_IDS=$(printf '%s' "$LAST_BODY" | node -e "
    const fs = require('fs');
    const rows = JSON.parse(fs.readFileSync(0, 'utf8'));
    if (!Array.isArray(rows) || rows.length < 2) process.exit(1);
    console.log(rows[0].id);
    console.log(rows[1].id);
    console.log(rows[0].committee_id);
  ") || true
  POS1=$(printf '%s\n' "$POS_IDS" | sed -n '1p')
  POS2=$(printf '%s\n' "$POS_IDS" | sed -n '2p')
  committee_id=$(printf '%s\n' "$POS_IDS" | sed -n '3p')
fi

if [[ -n "$committee_id" ]]; then
  request POST "/positions" "{\"title\":\"Smoke Test Role\",\"committee_id\":\"$committee_id\",\"description\":\"Test\",\"responsibilities\":\"Test duties\"}"
  expect "POST /positions" 201
  created_id=""
  if [[ "$LAST_STATUS" == "201" ]]; then
    created_id=$(json_field id || true)
  fi

  if [[ -n "$created_id" ]]; then
    request PATCH "/positions/$created_id" '{"title":"Smoke Test Role Updated"}'
    expect "PATCH /positions/:id" 200
    request DELETE "/positions/$created_id"
    expect "DELETE /positions/:id" 204
  else
    echo "FAIL  POST /positions did not return an id"
    fail=$((fail + 1))
  fi

  request POST "/positions" '{"title":"Bad Committee","committee_id":"00000000-0000-0000-0000-000000000000"}'
  expect "POST /positions bad committee_id" 404
  request PATCH "/positions/00000000-0000-0000-0000-000000000000" '{"title":"Ghost"}'
  expect "PATCH /positions/:id unknown id" 404
  request DELETE "/positions/00000000-0000-0000-0000-000000000000"
  expect "DELETE /positions/:id unknown id" 404
else
  echo "FAIL  Could not read committee_id from GET /positions"
  fail=$((fail + 1))
fi

if [[ -z "$POS1" || -z "$POS2" ]]; then
  echo "FAIL  need two positions from GET /positions to exercise applications"
  echo "      body: $LAST_BODY"
  fail=$((fail + 1))
else
  SECTION="SMOKE-$(date +%s)"
  EMAIL="smoke.$SECTION@example.com"
  CREATE_BODY=$(cat <<EOF
{"firstName":"Smoke","lastName":"Test","email":"$EMAIL","age":21,"section":"$SECTION","motivation":"Smoke test why join.","choices":[{"positionId":"$POS1","preferenceRank":1},{"positionId":"$POS2","preferenceRank":2}],"documents":[{"documentType":"resume","fileName":"resume.pdf","s3Key":"dev/resume.pdf"},{"documentType":"transcript","fileName":"tor.pdf","s3Key":"dev/transcript.pdf"}]}
EOF
)

  request POST "/applications" "$CREATE_BODY"
  expect "POST /applications" 201
  APP_ID=""
  if [[ "$LAST_STATUS" == "201" ]]; then
    APP_ID=$(json_field id || true)
  fi

  request POST "/applications" '{"name":"Test Applicant"}'
  expect "POST /applications invalid body" 400

  request GET "/applications"
  expect "GET  /applications" 200
  if [[ -n "$APP_ID" ]] && contains_id "$APP_ID"; then
    echo "PASS  GET  /applications contains created row"
    pass=$((pass + 1))
  else
    echo "FAIL  GET  /applications contains created row"
    echo "      body: $LAST_BODY"
    fail=$((fail + 1))
  fi

  request GET "/applications?section=$SECTION"
  expect "GET  /applications?section" 200
  if [[ -n "$APP_ID" ]] && contains_id "$APP_ID"; then
    echo "PASS  GET  /applications?section contains created row"
    pass=$((pass + 1))
  else
    echo "FAIL  GET  /applications?section contains created row"
    echo "      body: $LAST_BODY"
    fail=$((fail + 1))
  fi

  if [[ -n "$APP_ID" ]]; then
    request GET "/applications/$APP_ID"
    expect "GET  /applications/:id" 200
  else
    echo "FAIL  GET  /applications/:id (no created id)"
    fail=$((fail + 1))
  fi

  request GET "/applications/$UNKNOWN_ID"
  expect "GET  /applications/:id unknown" 404

  if [[ -n "$APP_ID" ]]; then
    request PATCH "/applications/$APP_ID/status" '{"status":"approved"}'
    expect "PATCH /applications/:id/status" 200
  else
    echo "FAIL  PATCH /applications/:id/status (no created id)"
    fail=$((fail + 1))
  fi

  request PATCH "/applications/$UNKNOWN_ID/status" '{"status":"approved"}'
  expect "PATCH /applications/:id/status unknown" 404

  if [[ -n "$APP_ID" ]]; then
    request DELETE "/applications/$APP_ID"
    expect "DELETE /applications/:id" 204
    request GET "/applications/$APP_ID"
    expect "GET  /applications/:id after delete" 404
  else
    echo "FAIL  DELETE /applications/:id (no created id)"
    fail=$((fail + 1))
  fi

  request DELETE "/applications/$UNKNOWN_ID"
  expect "DELETE /applications/:id unknown" 404
fi

request POST "/uploads/presign"
expect "POST /uploads/presign (stubbed)" 501

rm -f /tmp/smoke-test-body

echo
echo "$pass passed, $fail failed"
[[ "$fail" -eq 0 ]]
