import { test } from "node:test";
import assert from "node:assert/strict";
import {
  pointerSteps,
  structLayout,
  cacheTrace,
  transformations,
} from "../dist/model.js";

test("reference assignment updates x without following a reseated pointer", () => {
  assert.equal(pointerSteps[4].x, 99);
  assert.equal(pointerSteps[5].p, "y");
  assert.equal(pointerSteps[5].x, 99);
  assert.equal(pointerSteps[6].x, 7);
  assert.equal(pointerSteps[6].ref, true);
  assert.equal(pointerSteps[7].p, null);
});
test("layout accounts for interior and trailing padding", () => {
  const a = structLayout(["tag", "value", "count"]);
  const b = structLayout(["value", "count", "tag"]);
  assert.deepEqual(
    a.members.map((m) => m.offset),
    [0, 8, 16],
  );
  assert.deepEqual(
    b.members.map((m) => m.offset),
    [0, 8, 12],
  );
  assert.equal(a.size, 24);
  assert.equal(a.padding, 11);
  assert.equal(b.size, 16);
  assert.equal(b.padding, 3);
  for (const s of [a, b]) {
    assert.equal(s.size % s.alignment, 0);
    assert.equal(s.size - s.padding, 13);
    assert(s.members.every((m) => m.offset % m.align === 0));
  }
  assert.throws(() => structLayout(["tag", "tag", "value"]));
});
test("cache traversal reuses rows and evicts columns under explicit LRU capacity", () => {
  const row = cacheTrace("row"),
    column = cacheTrace("column");
  assert.equal(row.at(-1).misses, 16);
  assert.equal(row[60].evicted, 11);
  assert.deepEqual(row[60].cache, [12, 13, 14, 15]);
  assert.equal(row[61].evicted, null);
  assert.equal(row[0].evicted, null);
  assert.equal(row.at(-1).hits, 48);
  assert.equal(column.at(-1).misses, 64);
  assert.equal(column.at(-1).hits, 0);
  assert.deepEqual(
    row.slice(0, 5).map((s) => s.hit),
    [false, true, true, true, false],
  );
  for (const trace of [row, column]) {
    assert.equal(new Set(trace.map((s) => s.index)).size, 64);
    assert(trace.every((s) => s.cache.length <= 4 && s.cache.includes(s.line)));
  }
  assert.throws(() => cacheTrace("diagonal"));
});
test("rewrites preserve unsigned results including wraparound boundaries", () => {
  for (const name of ["fold", "dead", "strength"]) {
    const t = transformations[name];
    for (const x of [
      0, 1, 24, 100, 0x1fffffff, 0x20000000, 0x7fffffff, 0xfffffffe, 0xffffffff,
    ]) {
      assert.equal(t.run(x), t.rewritten(x), `${name}: ${x}`);
    }
  }
  assert.equal(transformations.strength.run(0xffffffff), 4294967288);
  assert.equal(transformations.alias.run(0, true), 2);
  assert.equal(transformations.alias.run(0, false), 1);
});
