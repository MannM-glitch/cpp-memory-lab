import {
  pointerSteps,
  fields,
  structLayout,
  cacheTrace,
  transformations,
} from "./model.js";
const $ = (selector) => document.querySelector(selector);
const lab = $("#lab");
const escape = (s) =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
const codeBlock = (lines, active = -1) =>
  `<pre class="code"><code>${lines.map((line, i) => `<span class="code-line ${i === active ? "active" : ""}"><span class="line-number" aria-hidden="true">${i + 1}</span>${escape(line)}</span>`).join("")}</code></pre>`;
const heading = (title, subtitle, tag) =>
  `<div class="lab-heading"><div><h2 id="lab-title">${title}</h2><p>${subtitle}</p></div><span class="tag">${tag}</span></div>`;
const notice = () =>
  '<div class="explanation" role="status" aria-live="polite" id="explanation"></div>';
let cleanup = () => {};
function pointers() {
  let step = 0,
    timer;
  lab.innerHTML =
    heading(
      "Follow the address.",
      "Step through a program and watch its objects change.",
      "SIMULATED MEMORY",
    ) +
    `<div class="workspace"><div class="editor"><div class="pane-title"><strong>pointers.cpp</strong><span>C++20</span></div><div id="pointer-code"></div><p class="editor-note"><code>&x</code> gets an address. <code>*p</code> accesses the object at that address.</p></div><div class="canvas"><div class="pane-title"><strong>Object map</strong><span>int = 4 B · pointer = 8 B model</span></div><div id="object-map" class="memory-area" role="img"></div><div class="legend"><span>Pointer</span><span>Reference alias</span><span>Pointed-to object</span></div></div></div><div class="controls"><button id="back">← Back</button><button class="primary" id="next">Next line →</button><button id="play">Play</button><button id="reset">Reset</button><span class="step-label" id="step-label"></span></div>${notice()}`;
  const cell = (name, value, address, extra = "", alias = false) =>
    `<div class="cell ${extra}"><div class="cell-name"><span>${name}</span><span>int</span></div><div class="cell-value">${value ?? "—"}</div><div class="address">${address}</div>${alias ? '<span class="alias">r aliases x</span>' : ""}</div>`;
  function draw() {
    const s = pointerSteps[step];
    $("#pointer-code").innerHTML = codeBlock(
      pointerSteps.map((s) => s.code),
      step,
    );
    $("#object-map").innerHTML =
      `<div class="memory-column"><div class="cell ${s.p === undefined ? "empty" : "pointer"}"><div class="cell-name"><span>p</span><span>int*</span></div><div class="cell-value" style="font-size:20px">${s.p === undefined ? "—" : s.p === null ? "nullptr" : s.p === "x" ? "0x1000" : "0x1004"}</div><div class="address">${s.p === undefined ? "not declared" : "stored at 0x1010"}</div></div></div><div class="connection">${s.p ? "→<small>to " + s.p + "</small>" : "·"}</div><div class="memory-column">${cell("x", s.x, "0x1000", s.p === "x" ? "target" : "", s.ref)}${cell("y", s.y, "0x1004", s.y === undefined ? "empty" : s.p === "y" ? "target" : "")}</div>`;
    $("#object-map").setAttribute(
      "aria-label",
      `x equals ${s.x}; y ${s.y === undefined ? "not declared" : "equals " + s.y}; p ${s.p === undefined ? "not declared" : s.p === null ? "is null" : "points to " + s.p}; r ${s.ref ? "aliases x" : "not declared"}.`,
    );
    $("#explanation").innerHTML = `<strong>${s.title}</strong>${s.text}`;
    $("#step-label").textContent =
      `LINE ${String(step + 1).padStart(2, "0")} / ${pointerSteps.length}`;
    $("#back").disabled = step === 0;
    $("#next").disabled = step === pointerSteps.length - 1;
  }
  function stop() {
    clearInterval(timer);
    timer = null;
    $("#play").textContent = "Play";
  }
  $("#back").onclick = () => {
    stop();
    step--;
    draw();
  };
  $("#next").onclick = () => {
    stop();
    step++;
    draw();
  };
  $("#reset").onclick = () => {
    stop();
    step = 0;
    draw();
  };
  $("#play").onclick = () => {
    if (timer) return stop();
    if (step === pointerSteps.length - 1) step = 0;
    draw();
    $("#play").textContent = "Pause";
    timer = setInterval(() => {
      step++;
      draw();
      if (step === pointerSteps.length - 1) stop();
    }, 1700);
  };
  cleanup = () => clearInterval(timer);
  draw();
}
function compiler() {
  let example = "fold";
  lab.innerHTML =
    heading(
      "Look through the compiler.",
      "Explore legal rewrites and the assumptions that make them possible.",
      "ILLUSTRATIVE · NOT LIVE COMPILATION",
    ) +
    `<div class="controls" style="padding-top:0"><label class="field">Transformation <select id="transformation">${Object.entries(
      transformations,
    )
      .map(([key, v]) => `<option value="${key}">${v.name}</option>`)
      .join(
        "",
      )}</select></label></div><div class="pipeline"><span>C++ source</span>→<span class="selected">Optimization reasoning</span>→<span>Target machine code</span></div><div class="compiler-panels"><div><div class="pane-title"><strong id="compiler-file"></strong><span>BEFORE</span></div><div id="source-code"></div></div><div><div class="pane-title"><strong>Equivalent behavior</strong><span id="rewrite-label">AFTER · PSEUDO-C++</span></div><div id="optimized-code"></div></div></div><div class="controls"><label class="field" id="numeric-field">Input x <input id="compiler-input" type="range" min="0" max="100" value="24"><output id="input-value">24</output></label><label class="field hidden" id="alias-field"><input id="alias-input" type="checkbox"> a and b point to the same int</label></div><div class="result-row" role="status" aria-live="polite"><p>Original result <output id="result-original"></output></p><p>Preserved result <output id="result-rewritten"></output></p></div><p class="mini-note" style="margin-bottom:20px">32-bit unsigned model for arithmetic examples. Results are calculated locally; no compiler runs in this page. Generate real assembly with the C++ examples in the repo.</p>${notice()}`;
  function draw() {
    const t = transformations[example],
      x = Number($("#compiler-input").value),
      aliases = $("#alias-input").checked;
    $("#compiler-file").textContent = t.file;
    $("#source-code").innerHTML = codeBlock(t.source);
    $("#optimized-code").innerHTML = codeBlock(t.optimized);
    $("#rewrite-label").textContent =
      example === "alias" ? "DEPENDENCY TO PRESERVE" : "AFTER · PSEUDO-C++";
    $("#numeric-field").classList.toggle("hidden", example === "alias");
    $("#alias-field").classList.toggle("hidden", example !== "alias");
    $("#input-value").textContent = x;
    $("#result-original").textContent = t.run(x, aliases);
    $("#result-rewritten").textContent = t.rewritten(x, aliases);
    $("#explanation").innerHTML = `<strong>${t.title}</strong>${t.text}`;
    $("#principle-text").textContent = t.principle;
  }
  $("#transformation").onchange = () => {
    const selected = $("#transformation").value;
    if (Object.hasOwn(transformations, selected)) {
      example = selected;
      draw();
    }
  };
  $("#compiler-input").oninput = draw;
  $("#alias-input").onchange = draw;
  draw();
}
function layout() {
  let order = ["tag", "value", "count"];
  lab.innerHTML =
    heading(
      "Make every byte count.",
      "Reorder the same fields. See alignment and padding change.",
      "ILLUSTRATIVE 64-BIT ABI",
    ) +
    `<div class="workspace"><div class="editor"><div class="pane-title"><strong>layout.cpp</strong><span>sizeof & alignof</span></div><div id="layout-code"></div><div class="controls" style="padding:0 20px 20px"><button id="reorder" class="primary">Pack by alignment →</button><button id="layout-reset">Original order</button></div><p class="editor-note">Members keep their alignment. Reordering removes padding without using packed structs.</p></div><div class="canvas"><div class="pane-title"><strong>Byte map</strong><span>Each tile = 1 byte</span></div><div class="viz-pad"><div id="layout-metrics" class="metrics"></div><div class="byte-label">OFFSET · 8 BYTES PER ROW</div><div id="byte-grid" class="byte-grid" role="img"></div><div class="mini-note">t = tag · v = value · c = count · — = padding</div></div></div></div><div class="controls"><label class="field">Object count <input id="count" type="range" min="1" max="100000" value="10000" step="1"><output id="count-value">10,000</output></label></div>${notice()}`;
  function draw() {
    const s = structLayout(order),
      count = Number($("#count").value);
    $("#layout-code").innerHTML = codeBlock([
      "struct Record {",
      ...order.map((k) => `  ${fields[k].type} ${k};`),
      "};",
      "",
      `// sizeof(Record): ${s.size} bytes`,
      `// alignof(Record): ${s.alignment} bytes`,
    ]);
    $("#layout-metrics").innerHTML =
      `<div class="metric"><b>${s.size}<small> B</small></b><small>Object size</small></div><div class="metric"><b>${s.padding}<small> B</small></b><small>Padding</small></div><div class="metric"><b>${Math.round((13 / s.size) * 100)}<small>%</small></b><small>Payload / size</small></div>`;
    $("#byte-grid").innerHTML = s.bytes
      .map(
        (b) =>
          `<div class="byte ${b.css}" aria-hidden="true">${b.offset}<br>${b.name === "padding" ? "—" : b.name[0]}</div>`,
      )
      .join("");
    $("#byte-grid").setAttribute(
      "aria-label",
      `${s.size}-byte object: ${s.members.map((m) => `${m.name} occupies bytes ${m.offset} to ${m.offset + m.size - 1}`).join("; ")}. ${s.padding} padding bytes total.`,
    );
    $("#count-value").textContent = count.toLocaleString();
    $("#explanation").innerHTML =
      `<strong>${order[0] === "value" ? "Same payload. Eight fewer bytes per object." : "13 bytes of fields occupy 24 bytes."}</strong>${count.toLocaleString()} objects use ${(s.size * count).toLocaleString()} bytes of element storage. Reordering to double → int → char ${s.size === 16 ? "saves" : "would save"} ${(8 * count).toLocaleString()} bytes (33.3%). Sizes exclude allocator overhead and container capacity.`;
    $("#reorder").disabled = order[0] === "value";
    $("#layout-reset").disabled = order[0] === "tag";
  }
  $("#reorder").onclick = () => {
    order = ["value", "count", "tag"];
    draw();
  };
  $("#layout-reset").onclick = () => {
    order = ["tag", "value", "count"];
    draw();
  };
  $("#count").oninput = draw;
  draw();
}
function cache() {
  let mode = "row",
    position = -1,
    timer,
    trace = cacheTrace(mode);
  lab.innerHTML =
    heading(
      "Access order changes the story.",
      "Traverse one matrix in two ways. Watch cache lines fill and leave.",
      "DETERMINISTIC CACHE MODEL",
    ) +
    `<div class="controls" style="padding-top:0"><div class="segmented" aria-label="Traversal"><button id="row" aria-pressed="true">Row first</button><button id="column" aria-pressed="false">Column first</button></div></div><div class="workspace"><div class="editor"><div class="pane-title"><strong>traversal.cpp</strong><span>int matrix[8][8]</span></div><div id="cache-code"></div><p class="editor-note">Model: 16-byte cache lines, 4 lines of capacity, fully associative LRU. Aligned matrix, cold cache, no prefetch. Real hardware differs.</p><div class="viz-pad"><div id="cache-metrics" class="metrics"></div><div id="cache-summary" class="mini-note"></div></div></div><div class="canvas"><div class="pane-title"><strong>8 × 8 row-major matrix</strong><span>Each tile = 4-byte int</span></div><div class="viz-pad"><div class="byte-label">COLUMN → · ROW ↓</div><div class="cache-grid" id="cache-grid" role="img"></div><div class="legend cache-legend" style="padding:0"><span>Resident in cache</span><span>Visited</span></div><p class="mini-note">Numbers are element indices. An outlined cell is the current read. Visited cells can be evicted from cache.</p></div></div></div><div class="controls"><button class="primary" id="cache-next">Read next →</button><button id="cache-play">Play</button><button id="cache-finish">Run to end</button><button id="cache-reset">Reset</button><span class="step-label" id="cache-step"></span></div>${notice()}`;
  function stop() {
    clearInterval(timer);
    timer = null;
    $("#cache-play").textContent = "Play";
  }
  function draw() {
    const s = trace[position],
      visited = new Set(trace.slice(0, position + 1).map((s) => s.index));
    $("#cache-code").innerHTML = codeBlock(
      [
        "int matrix[8][8] = {};",
        "int sum = 0;",
        `for (int ${mode === "row" ? "r" : "c"} = 0; ${mode === "row" ? "r" : "c"} < 8; ++${mode === "row" ? "r" : "c"})`,
        `  for (int ${mode === "row" ? "c" : "r"} = 0; ${mode === "row" ? "c" : "r"} < 8; ++${mode === "row" ? "c" : "r"})`,
        "    sum += matrix[r][c];",
      ],
      s ? 4 : -1,
    );
    $("#cache-grid").innerHTML = Array.from(
      { length: 64 },
      (_, i) =>
        `<div aria-hidden="true" class="cache-cell ${s?.cache.includes(Math.floor(i / 4)) ? "loaded" : ""} ${visited.has(i) ? "visited" : ""} ${i === s?.index ? "current" : ""}">${i}</div>`,
    ).join("");
    $("#cache-grid").setAttribute(
      "aria-label",
      s
        ? `Read row ${s.row}, column ${s.col}, element ${s.index}: cache ${s.hit ? "hit" : "miss"}. Resident cache lines: ${s.cache.join(", ")}.`
        : "64 elements in row-major storage; cache is empty.",
    );
    $("#cache-metrics").innerHTML =
      `<div class="metric"><b>${s?.hits ?? 0}</b><small>Hits</small></div><div class="metric"><b>${s?.misses ?? 0}</b><small>Misses</small></div><div class="metric"><b>${s ? Math.round((s.hits / (position + 1)) * 100) : 0}<small>%</small></b><small>Hit rate</small></div>`;
    $("#cache-summary").textContent =
      `Full traversal in this model: row first = 16 misses; column first = 64 misses. Miss counts are not execution times.`;
    $("#cache-step").textContent = `READ ${position + 1} / 64`;
    $("#cache-next").disabled = $("#cache-finish").disabled = position === 63;
    $("#explanation").innerHTML = s
      ? `<strong>${s.hit ? "HIT · The line is already resident." : "MISS · Fetch four neighboring ints."}</strong>matrix[${s.row}][${s.col}] is element ${s.index}, byte offset ${s.index * 4}. Its line spans elements ${s.line * 4}–${s.line * 4 + 3}. ${s.hit ? "This read reuses an earlier fetch." : "If all four cache slots are occupied, evict the least recently used line."}`
      : "<strong>Start with an empty cache.</strong>Each fetch brings in four adjacent ints. Row-first access uses those neighbors immediately; column-first access jumps across rows.";
  }
  function restart(newMode = mode) {
    stop();
    mode = newMode;
    position = -1;
    trace = cacheTrace(mode);
    $("#row").setAttribute("aria-pressed", mode === "row");
    $("#column").setAttribute("aria-pressed", mode === "column");
    draw();
  }
  $("#row").onclick = () => restart("row");
  $("#column").onclick = () => restart("column");
  $("#cache-next").onclick = () => {
    stop();
    position++;
    draw();
  };
  $("#cache-finish").onclick = () => {
    stop();
    position = 63;
    draw();
  };
  $("#cache-reset").onclick = () => restart();
  $("#cache-play").onclick = () => {
    if (timer) return stop();
    if (position === 63) position = -1;
    $("#cache-play").textContent = "Pause";
    timer = setInterval(() => {
      position++;
      draw();
      if (position === 63) stop();
    }, 220);
  };
  cleanup = () => clearInterval(timer);
  draw();
}
const lessons = {
  pointers: {
    render: pointers,
    principle:
      "A pointer stores an address. A reference gives an existing object another name.",
  },
  layout: {
    render: layout,
    principle:
      "Memory efficiency starts with layout. Measure sizeof and alignment on your actual target before changing a data structure.",
  },
  cache: {
    render: cache,
    principle:
      "Contiguous access can turn one memory fetch into several useful reads. Data layout and traversal order work together.",
  },
  compiler: { render: compiler, principle: transformations.fold.principle },
};
function navigate(id) {
  if (!lessons[id]) id = "pointers";
  cleanup();
  cleanup = () => {};
  document.querySelectorAll("[data-lab]").forEach((b) => {
    if (b.dataset.lab === id) b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  });
  $("#principle-text").textContent = lessons[id].principle;
  lessons[id].render();
}
document.querySelectorAll("[data-lab]").forEach(
  (button) =>
    (button.onclick = () => {
      location.hash = button.dataset.lab;
    }),
);
addEventListener("hashchange", () => navigate(location.hash.slice(1)));
navigate(location.hash.slice(1) || "pointers");
