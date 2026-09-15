import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parseHTML } from "linkedom";

test("all four experiment controls update their rendered results", async () => {
  const { document, window } = parseHTML(
    await readFile(new URL("../dist/advanced.html", import.meta.url), "utf8"),
  );
  globalThis.document = document;
  globalThis.location = { hash: "" };
  globalThis.addEventListener = window.addEventListener.bind(window);
  await import("../dist/app.js");
  const $ = (s) => document.querySelector(s);
  const go = (id) => {
    location.hash = "#" + id;
    window.dispatchEvent(new window.Event("hashchange"));
  };
  assert.match($("#object-map").getAttribute("aria-label"), /x equals 42/);
  for (let i = 0; i < 6; i++) $("#next").onclick();
  assert.match($("#object-map").getAttribute("aria-label"), /x equals 7/);
  assert.match($("#object-map").getAttribute("aria-label"), /r aliases x/);
  $("#next").onclick();
  assert.match($("#object-map").getAttribute("aria-label"), /p is null/);
  assert($("#next").disabled);
  $("#reset").onclick();
  assert($("#back").disabled);

  go("layout");
  assert.equal(document.querySelectorAll(".byte").length, 24);
  $("#reorder").onclick();
  assert.equal(document.querySelectorAll(".byte").length, 16);
  $("#count").value = "100000";
  $("#count").oninput();
  assert.match($("#explanation").textContent, /800,000/);
  $("#layout-reset").onclick();
  assert.equal(document.querySelectorAll(".byte").length, 24);

  go("cache");
  $("#cache-example").onclick();
  assert.match($("#explanation").textContent, /OUT: 44–47 → IN: 60–63/);
  assert.equal(document.querySelectorAll(".cache-cell.evicted").length, 4);
  assert.equal(document.querySelectorAll(".cache-cell.loaded").length, 16);
  assert.match($("#cache-tray").textContent, /48–51/);
  assert.doesNotMatch($("#cache-tray").textContent, /44–47/);
  $("#cache-next").onclick();
  assert.match($("#explanation").textContent, /Nothing is removed/);
  assert.equal(document.querySelectorAll(".cache-cell.evicted").length, 0);
  $("#cache-finish").onclick();
  assert.match($("#cache-metrics").textContent, /48Hits16Misses75%/);
  $("#column").onclick();
  $("#cache-finish").onclick();
  assert.match($("#cache-metrics").textContent, /0Hits64Misses0%/);
  $("#cache-reset").onclick();
  assert.equal($("#cache-step").textContent, "READ 0 / 64");

  go("compiler");
  assert.equal($("#result-original").textContent, "36");
  for (const name of ["strength", "dead", "alias"]) {
    for (const option of $("#transformation").options)
      option.removeAttribute("selected");
    $(`#transformation option[value="${name}"]`).setAttribute("selected", "");
    $("#transformation").onchange();
    assert.equal(
      $("#result-original").textContent,
      $("#result-rewritten").textContent,
    );
  }
  $("#alias-input").checked = true;
  $("#alias-input").onchange();
  assert.equal($("#result-original").textContent, "2");
  go("unknown");
  assert.match($("#lab-title").textContent, /Follow/);
});
