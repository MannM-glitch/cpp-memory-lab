import { pointerSteps } from './model.js';
const $ = (selector) => document.querySelector(selector);
const lab = $('#lab');
const escape = (s) => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const codeBlock = (lines, active = -1) => `<pre class="code"><code>${lines.map((line, i) => `<span class="code-line ${i === active ? 'active' : ''}"><span class="line-number" aria-hidden="true">${i + 1}</span>${escape(line)}</span>`).join('')}</code></pre>`;
const heading = (title, subtitle, tag) => `<div class="lab-heading"><div><h2 id="lab-title">${title}</h2><p>${subtitle}</p></div><span class="tag">${tag}</span></div>`;
const notice = () => '<div class="explanation" role="status" aria-live="polite" id="explanation"></div>';
let cleanup = () => {};
function pointers() {
  let step = 0, timer;
  lab.innerHTML = heading('Follow the address.', 'Step through a program and watch its objects change.', 'SIMULATED MEMORY') + `<div class="workspace"><div class="editor"><div class="pane-title"><strong>pointers.cpp</strong><span>C++20</span></div><div id="pointer-code"></div><p class="editor-note"><code>&x</code> gets an address. <code>*p</code> accesses the object at that address.</p></div><div class="canvas"><div class="pane-title"><strong>Object map</strong><span>int = 4 B · pointer = 8 B model</span></div><div id="object-map" class="memory-area" role="img"></div><div class="legend"><span>Pointer</span><span>Reference alias</span><span>Pointed-to object</span></div></div></div><div class="controls"><button id="back">← Back</button><button class="primary" id="next">Next line →</button><button id="play">Play</button><button id="reset">Reset</button><span class="step-label" id="step-label"></span></div>${notice()}`;
  const cell = (name, value, address, extra = '', alias = false) => `<div class="cell ${extra}"><div class="cell-name"><span>${name}</span><span>int</span></div><div class="cell-value">${value ?? '—'}</div><div class="address">${address}</div>${alias ? '<span class="alias">r aliases x</span>' : ''}</div>`;
  function draw() {
    const s = pointerSteps[step];
    $('#pointer-code').innerHTML = codeBlock(pointerSteps.map(s => s.code), step);
    $('#object-map').innerHTML = `<div class="memory-column"><div class="cell ${s.p === undefined ? 'empty' : 'pointer'}"><div class="cell-name"><span>p</span><span>int*</span></div><div class="cell-value" style="font-size:20px">${s.p === undefined ? '—' : s.p === null ? 'nullptr' : s.p === 'x' ? '0x1000' : '0x1004'}</div><div class="address">${s.p === undefined ? 'not declared' : 'stored at 0x1010'}</div></div></div><div class="connection">${s.p ? '→<small>to '+s.p+'</small>' : '·'}</div><div class="memory-column">${cell('x', s.x, '0x1000', s.p === 'x' ? 'target' : '', s.ref)}${cell('y', s.y, '0x1004', s.y === undefined ? 'empty' : s.p === 'y' ? 'target' : '')}</div>`;
    $('#object-map').setAttribute('aria-label', `x equals ${s.x}; y ${s.y === undefined ? 'not declared' : 'equals '+s.y}; p ${s.p === undefined ? 'not declared' : s.p === null ? 'is null' : 'points to '+s.p}; r ${s.ref ? 'aliases x' : 'not declared'}.`);
    $('#explanation').innerHTML = `<strong>${s.title}</strong>${s.text}`;
    $('#step-label').textContent = `LINE ${String(step + 1).padStart(2, '0')} / ${pointerSteps.length}`;
    $('#back').disabled = step === 0; $('#next').disabled = step === pointerSteps.length - 1;
  }
  function stop() { clearInterval(timer); timer = null; $('#play').textContent = 'Play'; }
  $('#back').onclick = () => { stop(); step--; draw(); };
  $('#next').onclick = () => { stop(); step++; draw(); };
  $('#reset').onclick = () => { stop(); step = 0; draw(); };
  $('#play').onclick = () => { if (timer) return stop(); if (step === pointerSteps.length - 1) step = 0; draw(); $('#play').textContent = 'Pause'; timer = setInterval(() => { step++; draw(); if (step === pointerSteps.length - 1) stop(); }, 1700); };
  cleanup = () => clearInterval(timer); draw();
}
const lessons = {
  pointers: { render: pointers, principle: 'A pointer stores an address. A reference gives an existing object another name.' },
};
function navigate(id) {
  if (!lessons[id]) id = 'pointers'; cleanup(); cleanup = () => {};
  document.querySelectorAll('[data-lab]').forEach(b => { if (b.dataset.lab === id) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  lessons[id].render(); $('#principle-text').textContent = lessons[id].principle;
}
document.querySelectorAll('[data-lab]').forEach(button => button.onclick = () => { location.hash = button.dataset.lab; });
addEventListener('hashchange', () => navigate(location.hash.slice(1)));
navigate(location.hash.slice(1) || 'pointers');
