#!/usr/bin/env bash
# curl-based smoke test for the Hono API. Works against a local dev server
# or a deployed API Gateway URL — pass the base URL as $1.
set -uo pipefail

BASE_URL="${1:-http://localhost:8787}"
BASE_URL="${BASE_URL%/}"
UNKNOWN_ID="00000000-0000-4000-8000-000000000000"
HR_EMAIL="${HR_EMAIL:-hr@aws-ust.org}"
HR_PASSWORD="${HR_PASSWORD:-changeme}"
EMAIL_ENABLED="${EMAIL_ENABLED:-false}"
export EMAIL_ENABLED

pass=0
fail=0
LAST_STATUS=""
LAST_BODY=""

request() {
  local method="$1" path="$2" data="${3:-}" auth="${4:-}"
  local args=(-s -o /tmp/smoke-test-body -w '%{http_code}' -X "$method")
  [[ -n "$data" ]] && args+=(-H 'content-type: application/json' -d "$data")
  [[ -n "$auth" ]] && args+=(-H "Authorization: Bearer $auth")

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

check_positions_contract() {
  if printf '%s' "$LAST_BODY" | node -e '
    const fs = require("fs");
    const rows = JSON.parse(fs.readFileSync(0, "utf8"));
    const stringFields = [
      "id",
      "title",
      "office",
      "committee_id",
      "committee",
      "committeeDescription",
      "description",
      "responsibilities",
    ];
    const valid =
      Array.isArray(rows) &&
      rows.length > 0 &&
      rows.every(
        (row) =>
          stringFields.every((field) => typeof row[field] === "string") &&
          row.isOpen === true,
      );
    if (!valid) process.exit(1);
  '; then
    echo "PASS  GET /positions contract"
    pass=$((pass + 1))
  else
    echo "FAIL  GET /positions contract"
    echo "      body: $LAST_BODY"
    fail=$((fail + 1))
  fi
}

has_email_notification() {
  local app_id="$1" recipient="$2"
  printf '%s' "$LAST_BODY" | node -e "
    const fs = require('fs');
    const appId = process.argv[1];
    const recipient = process.argv[2];
    const data = JSON.parse(fs.readFileSync(0, 'utf8'));
    const rows = Array.isArray(data.notifications) ? data.notifications : [];
    const ok = rows.some(
      (row) =>
        row.applicationId === appId &&
        row.messageType === 'application_submitted' &&
        row.recipient === recipient,
    );
    process.exit(ok ? 0 : 1);
  " "$app_id" "$recipient"
}

echo "Smoke testing $BASE_URL"
echo

request GET "/health"
expect "GET  /health" 200

request GET "/positions"
expect "GET  /positions" 200
check_positions_contract

positions_count=$(printf '%s' "$LAST_BODY" | node -e "
  const fs = require('fs');
  const rows = JSON.parse(fs.readFileSync(0, 'utf8'));
  process.stdout.write(Array.isArray(rows) ? String(rows.length) : '0');
" 2>/dev/null || echo "0")
if [[ "$positions_count" -ge 21 ]]; then
  echo "PASS  GET /positions returns at least 21 open seeded rows ($positions_count)"
  pass=$((pass + 1))
else
  echo "FAIL  GET /positions expected at least 21 open rows, got $positions_count"
  fail=$((fail + 1))
fi

POS1=""
POS2=""
committee_id=""
smoke_position_id=""
smoke_position_title=""
smoke_position_committee_id=""
if [[ "$LAST_STATUS" == "200" ]]; then
  POS_IDS=$(printf '%s' "$LAST_BODY" | node -e "
    const fs = require('fs');
    const rows = JSON.parse(fs.readFileSync(0, 'utf8'));
    if (!Array.isArray(rows) || rows.length < 2) process.exit(1);
    const smokePosition =
      rows.find((row) => row.title === 'Smoke Test Role Updated') ??
      rows.find((row) => row.title === 'Smoke Test Role');
    console.log(rows[0].id);
    console.log(rows[1].id);
    console.log(rows[0].committee_id);
    console.log(smokePosition?.id ?? '');
    console.log(smokePosition?.title ?? '');
    console.log(smokePosition?.committee_id ?? '');
  ") || true
  POS1=$(printf '%s\n' "$POS_IDS" | sed -n '1p')
  POS2=$(printf '%s\n' "$POS_IDS" | sed -n '2p')
  committee_id=$(printf '%s\n' "$POS_IDS" | sed -n '3p')
  smoke_position_id=$(printf '%s\n' "$POS_IDS" | sed -n '4p')
  smoke_position_title=$(printf '%s\n' "$POS_IDS" | sed -n '5p')
  smoke_position_committee_id=$(printf '%s\n' "$POS_IDS" | sed -n '6p')
fi

request GET "/auth/me"
expect "GET  /auth/me (no token)" 401
request GET "/applications"
expect "GET  /applications (no token)" 401
request POST "/positions" '{"title":"Unauth","committee_id":"00000000-0000-4000-8000-000000000000"}'
expect "POST /positions (no token)" 401
request PATCH "/positions/$UNKNOWN_ID" '{"title":"Ghost"}'
expect "PATCH /positions/:id (no token)" 401
request GET "/interview-slots"
expect "GET  /interview-slots (no token)" 401
request POST "/interview-slots" '{"committeeId":"00000000-0000-4000-8000-000000000000","startsAt":"2099-01-01T00:00:00.000Z"}'
expect "POST /interview-slots (no token)" 401

request GET "/applicant-auth/me"
expect "GET  /applicant-auth/me (no session)" 401
request GET "/applicant/interview-slots"
expect "GET  /applicant/interview-slots (no session)" 401
request PUT "/applicant/interview-booking" '{"slotId":"00000000-0000-4000-8000-000000000000"}'
expect "PUT  /applicant/interview-booking (no session)" 401
request POST "/applicant-auth/request-code" '{"applicationCode":"invalid","email":"invalid"}'
expect "POST /applicant-auth/request-code invalid body" 400
request POST "/applicant-auth/verify-code" '{"applicationCode":"AP-2026-999999","email":"unknown@ust.edu.ph","code":"12"}'
expect "POST /applicant-auth/verify-code invalid code" 400
request POST "/applicant-auth/request-code" '{"applicationCode":"AP-2026-999999","email":"unknown@ust.edu.ph"}'
expect "POST /applicant-auth/request-code unknown details" 202
request POST "/applicant-auth/logout"
expect "POST /applicant-auth/logout" 204

request POST "/auth/login" '{"email":"wrong@example.com","password":"nope"}'
expect "POST /auth/login (bad credentials)" 401
request POST "/auth/logout"
expect "POST /auth/logout (no token)" 401

login_json="{\"email\":\"${HR_EMAIL}\",\"password\":\"${HR_PASSWORD}\"}"
request POST "/auth/login" "$login_json"
expect "POST /auth/login" 200

token=""
if [[ "$LAST_STATUS" == "200" ]]; then
  token=$(json_field token || true)
fi

if [[ -z "$token" ]]; then
  echo "FAIL  extract token from login"
  echo "      body: $LAST_BODY"
  fail=$((fail + 1))
else
  request GET "/auth/me" "" "$token"
  expect "GET  /auth/me" 200
  request GET "/auth/me" "" "not-a-real-jwt"
  expect "GET  /auth/me (fake token)" 401
  request GET "/interview-slots" "" "$token"
  expect "GET  /interview-slots" 200
  request POST "/interview-slots" '{"committeeId":"not-a-uuid","startsAt":"tomorrow"}' "$token"
  expect "POST /interview-slots invalid body" 400
  request PATCH "/interview-slots/not-a-uuid" '{"isOpen":false}' "$token"
  expect "PATCH /interview-slots/:id malformed id" 400
fi

if [[ -n "$committee_id" ]]; then
  created_id="$smoke_position_id"
  if [[ -n "$smoke_position_id" ]]; then
    request POST "/positions" "{\"title\":\"$smoke_position_title\",\"committee_id\":\"$smoke_position_committee_id\",\"description\":\"Test\",\"responsibilities\":\"Test duties\"}" "$token"
    expect "POST /positions duplicate smoke role" 409
  else
    request POST "/positions" "{\"title\":\"Smoke Test Role\",\"committee_id\":\"$committee_id\",\"description\":\"Test\",\"responsibilities\":\"Test duties\"}" "$token"
    expect "POST /positions" 201
  fi
  if [[ -z "$created_id" && "$LAST_STATUS" == "201" ]]; then
    created_id=$(json_field id || true)
  fi

  if [[ -n "$created_id" ]]; then
    request PATCH "/positions/$created_id" '{"title":"Smoke Test Role Updated"}' "$token"
    expect "PATCH /positions/:id" 200
  else
    echo "FAIL  POST /positions did not return an id"
    fail=$((fail + 1))
  fi

  request POST "/positions" '{"title":"Bad Committee","committee_id":"00000000-0000-0000-0000-000000000000"}' "$token"
  expect "POST /positions bad committee_id" 404
  request POST "/positions" '{"title":123,"committee_id":"not-a-uuid"}' "$token"
  expect "POST /positions invalid body" 400
  request PATCH "/positions/not-a-uuid" '{"title":"Ghost"}' "$token"
  expect "PATCH /positions/:id malformed id" 400
  request PATCH "/positions/$UNKNOWN_ID" '{"title":"Ghost"}' "$token"
  expect "PATCH /positions/:id unknown id" 404
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
  APP_CODE=""
  if [[ "$LAST_STATUS" == "201" ]]; then
    APP_ID=$(json_field id || true)
    APP_CODE=$(json_field applicationCode || true)
  fi

  if [[ -n "$APP_CODE" ]]; then
    echo "PASS  POST /applications returns applicationCode"
    pass=$((pass + 1))
  else
    echo "FAIL  POST /applications returns applicationCode"
    echo "      body: $LAST_BODY"
    fail=$((fail + 1))
  fi

  request POST "/applications" "$CREATE_BODY"
  expect "POST /applications duplicate cycle" 409

  request POST "/applications" '{"name":"Test Applicant"}'
  expect "POST /applications invalid body" 400

  request GET "/applications" "" "$token"
  expect "GET  /applications" 200
  if [[ -n "$APP_ID" ]] && contains_id "$APP_ID"; then
    echo "PASS  GET  /applications contains created row"
    pass=$((pass + 1))
  else
    echo "FAIL  GET  /applications contains created row"
    echo "      body: $LAST_BODY"
    fail=$((fail + 1))
  fi

  request GET "/applications?section=$SECTION" "" "$token"
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
    request GET "/applications/$APP_ID" "" "$token"
    expect "GET  /applications/:id" 200
  else
    echo "FAIL  GET  /applications/:id (no created id)"
    fail=$((fail + 1))
  fi

  request GET "/applications/$UNKNOWN_ID" "" "$token"
  expect "GET  /applications/:id unknown" 404

  request GET "/applications/$APP_ID/email-notifications"
  expect "GET  /applications/:id/email-notifications (no token)" 401

  if [[ -n "$APP_ID" ]]; then
    request GET "/applications/$APP_ID/email-notifications" "" "$token"
    expect "GET  /applications/:id/email-notifications" 200
    if has_email_notification "$APP_ID" "$EMAIL"; then
      echo "PASS  GET  /applications/:id/email-notifications logs submission row"
      pass=$((pass + 1))
    else
      echo "FAIL  GET  /applications/:id/email-notifications logs submission row"
      echo "      body: $LAST_BODY"
      fail=$((fail + 1))
    fi
  else
    echo "FAIL  GET  /applications/:id/email-notifications (no created id)"
    fail=$((fail + 1))
  fi

  request GET "/applications/not-a-uuid/email-notifications" "" "$token"
  expect "GET  /applications/:id/email-notifications malformed id" 400

  request GET "/applications/$UNKNOWN_ID/email-notifications" "" "$token"
  expect "GET  /applications/:id/email-notifications unknown app" 404

  if [[ -n "$APP_ID" ]]; then
    request PATCH "/applications/$APP_ID/status" '{"status":"approved"}' "$token"
    expect "PATCH /applications/:id/status" 200
  else
    echo "FAIL  PATCH /applications/:id/status (no created id)"
    fail=$((fail + 1))
  fi

  request PATCH "/applications/$UNKNOWN_ID/status" '{"status":"approved"}' "$token"
  expect "PATCH /applications/:id/status unknown" 404

  if [[ -n "$APP_ID" ]]; then
    request DELETE "/applications/$APP_ID" "" "$token"
    expect "DELETE /applications/:id" 204
    request GET "/applications/$APP_ID" "" "$token"
    expect "GET  /applications/:id after delete" 404
  else
    echo "FAIL  DELETE /applications/:id (no created id)"
    fail=$((fail + 1))
  fi

  request DELETE "/applications/$UNKNOWN_ID" "" "$token"
  expect "DELETE /applications/:id unknown" 404
fi

request POST "/uploads/presign"
expect "POST /uploads/presign (stubbed)" 501

if [[ -z "$token" ]]; then
  echo "FAIL  POST /auth/logout (extract token from login)"
  echo "      body: $LAST_BODY"
  fail=$((fail + 1))
else
  request POST "/auth/logout" "" "$token"
  expect "POST /auth/logout" 204
fi

rm -f /tmp/smoke-test-body

echo
echo "$pass passed, $fail failed"
[[ "$fail" -eq 0 ]]
