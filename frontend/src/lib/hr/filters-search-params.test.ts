import assert from "node:assert/strict"
import test from "node:test"
import { hrPageFromListSearch } from "@/lib/hr/filters-search-params"

test("parses only positive integer application-list pages", () => {
  assert.equal(hrPageFromListSearch({ page: "3" }), 3)
  assert.equal(hrPageFromListSearch({ page: "0" }), 1)
  assert.equal(hrPageFromListSearch({ page: "-1" }), 1)
  assert.equal(hrPageFromListSearch({ page: "2.5" }), 1)
  assert.equal(hrPageFromListSearch({ page: "2abc" }), 1)
})
