import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parseHTML } from "linkedom";

test("stories animate semantic states, replay, pause and preserve detailed links", async () => {
  const { document, window } = parseHTML(
    await readFile(new URL("../dist/index.html", import.meta.url), "utf8"),
  );
  globalThis.document = document;
  globalThis.location = { hash: "" };
  globalThis.addEventListener = window.addEventListener.bind(window);
  let tick;
  const realSet = globalThis.setInterval,
    realClear = globalThis.clearInterval;
  globalThis.setInterval = (fn) => {
    tick = fn;
    return 1;
  };
  globalThis.clearInterval = () => {
    tick = null;
  };
  try {
    await import("../dist/story.js");
    const $ = (s) => document.querySelector(s);
    assert.equal($("#alex").textContent, "42");
    for (let i = 0; i < 4; i++) $("#next").onclick();
    assert.equal($("#alex").textContent, "99");
    assert($("#friend").classList.contains("to-y"));
    $("#next").onclick();
    assert.equal($("#alex").textContent, "7");
    $("#next").onclick();
    assert($("#friend").classList.contains("parked"));
    assert($("#next").disabled);
    $("#replay").onclick();
    assert.equal($("#alex").textContent, "42");
    $("#play").onclick();
    assert(tick);
    tick();
    assert.equal($("#step-count").textContent, "2 / 7");
    $("#play").onclick();
    assert.equal(tick, null);
    for (const name of ["layout", "cache", "compiler"]) {
      $(`[data-story="${name}"]`).onclick();
      assert.equal(
        $("#deep-link").getAttribute("href"),
        `advanced.html#${name}`,
      );
      for (let i = 0; i < 3; i++) $("#next").onclick();
      assert($("#next").disabled);
      assert($("#stage").getAttribute("aria-label"));
    }
    assert.equal($("#answer").textContent, "25 🎉");
  } finally {
    globalThis.setInterval = realSet;
    globalThis.clearInterval = realClear;
  }
});
