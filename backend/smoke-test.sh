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

check_positions_contract() {
  if node -e 'const fs = require("fs"); const rows = JSON.parse(fs.readFileSync(process.argv[1], "utf8")); const stringFields = ["id", "title", "office", "committee", "committeeDescription", "description"]; const valid = Array.isArray(rows) && rows.length > 0 && rows.every((row) => stringFields.every((field) => typeof row[field] === "string") && Array.isArray(row.responsibilities) && row.responsibilities.every((item) => typeof item === "string") && row.isOpen === true); if (!valid) process.exit(1);' /tmp/smoke-test-body; then
    echo "PASS  GET  /positions contract"
    pass=$((pass + 1))
  else
    echo "FAIL  GET  /positions contract"
    echo "      body: $(cat /tmp/smoke-test-body)"
    fail=$((fail + 1))
  fi
}

echo "Smoke testing $BASE_URL"
echo

check "GET  /health"                        GET   "/health"                  200
check "GET  /positions"                     GET   "/positions"               200
check_positions_contract
check "GET  /applications"                  GET   "/applications"            200
check "GET  /applications/:id"              GET   "/applications/test-id"    200
check "POST /applications"                  POST  "/applications"            201 '{"name":"Test Applicant"}'
check "PATCH /applications/:id/status"      PATCH "/applications/test-id/status" 200 '{"status":"approved"}'
check "POST /uploads/presign (stubbed)"     POST  "/uploads/presign"         501

rm -f /tmp/smoke-test-body

echo
echo "$pass passed, $fail failed"
[[ "$fail" -eq 0 ]]
