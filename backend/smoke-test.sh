#!/usr/bin/env bash
# curl-based smoke test for the Hono API. Works against a local dev server
# or a deployed API Gateway URL — pass the base URL as $1.
set -uo pipefail

BASE_URL="${1:-http://localhost:8787}"
BASE_URL="${BASE_URL%/}"

pass=0
fail=0

check() {
  local desc="$1" method="$2" path="$3" expected_status="$4" data="${5:-}"
  local args=(-s -o /tmp/smoke-test-body -w '%{http_code}' -X "$method")
  [[ -n "$data" ]] && args+=(-H 'content-type: application/json' -d "$data")

  local status
  status=$(curl "${args[@]}" "$BASE_URL$path")

  if [[ "$status" == "$expected_status" ]]; then
    echo "PASS  $desc ($status)"
    pass=$((pass + 1))
  else
    echo "FAIL  $desc (expected $expected_status, got $status)"
    echo "      body: $(cat /tmp/smoke-test-body)"
    fail=$((fail + 1))
  fi
}

check_body() {
  local desc="$1" method="$2" path="$3" expected_status="$4" data="${5:-}"
  local args=(-s -o /tmp/smoke-test-body -w '%{http_code}' -X "$method")
  [[ -n "$data" ]] && args+=(-H 'content-type: application/json' -d "$data")

  local status
  status=$(curl "${args[@]}" "$BASE_URL$path")

  if [[ "$status" == "$expected_status" ]]; then
    echo "PASS  $desc ($status)"
    pass=$((pass + 1))
    cat /tmp/smoke-test-body
  else
    echo "FAIL  $desc (expected $expected_status, got $status)"
    echo "      body: $(cat /tmp/smoke-test-body)"
    fail=$((fail + 1))
    echo ""
  fi
}

echo "Smoke testing $BASE_URL"
echo

check "GET  /health"                        GET   "/health"                  200
check "GET  /positions"                     GET   "/positions"               200

positions_count=$(curl -s "$BASE_URL/positions" | grep -o '"id"' | wc -l | tr -d ' ')
if [[ "$positions_count" -ge 6 ]]; then
  echo "PASS  GET /positions returns at least 6 seeded rows ($positions_count)"
  pass=$((pass + 1))
else
  echo "FAIL  GET /positions expected at least 6 rows, got $positions_count"
  fail=$((fail + 1))
fi

committee_id=$(curl -s "$BASE_URL/positions" | grep -o '"committee_id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [[ -n "$committee_id" ]]; then
  created_id=$(check_body "POST /positions" POST "/positions" 201 \
    "{\"title\":\"Smoke Test Role\",\"committee_id\":\"$committee_id\",\"description\":\"Test\",\"responsibilities\":\"Test duties\"}" \
    | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

  if [[ -n "$created_id" ]]; then
    check "PATCH /positions/:id" PATCH "/positions/$created_id" 200 \
      '{"title":"Smoke Test Role Updated"}'
    check "DELETE /positions/:id" DELETE "/positions/$created_id" 204
  else
    echo "FAIL  POST /positions did not return an id"
    fail=$((fail + 1))
  fi

  check "POST /positions bad committee_id" POST "/positions" 404 \
    '{"title":"Bad Committee","committee_id":"00000000-0000-0000-0000-000000000000"}'
  check "PATCH /positions/:id unknown id" PATCH "/positions/00000000-0000-0000-0000-000000000000" 404 \
    '{"title":"Ghost"}'
  check "DELETE /positions/:id unknown id" DELETE "/positions/00000000-0000-0000-0000-000000000000" 404
else
  echo "FAIL  Could not read committee_id from GET /positions"
  fail=$((fail + 1))
fi

check "GET  /applications"                  GET   "/applications"            200
check "GET  /applications/:id"              GET   "/applications/test-id"    200
check "POST /applications"                  POST  "/applications"            201 '{"name":"Test Applicant"}'
check "PATCH /applications/:id/status"      PATCH "/applications/test-id/status" 200 '{"status":"approved"}'
check "POST /uploads/presign (stubbed)"     POST  "/uploads/presign"         501

rm -f /tmp/smoke-test-body

echo
echo "$pass passed, $fail failed"
[[ "$fail" -eq 0 ]]
