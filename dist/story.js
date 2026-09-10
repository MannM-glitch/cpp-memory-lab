const stories = {
  pointers: {
    title: "One friend. Two ways to find them.",
    connection:
      "The pink marker is a pointer: it can change which object it points to. A nickname is a reference: assigning through it changes the original object, rather than giving the nickname to someone else. A pointer can also point to nothing (nullptr).",
    scenes: [
      [
        "Meet Alex and Sam.",
        "Each has their own number. Alex has 42. Sam has 7.",
      ],
      [
        "“Over there!”",
        "Our pink marker points to Alex. It tells us where to look.",
      ],
      [
        "Alex gets a nickname: Ace.",
        "Alex and Ace are the same friend. Two names, one number.",
      ],
      [
        "A new number for Alex.",
        "Use the marker to change 42 to 99. Ace now has 99 too!",
      ],
      [
        "The marker moves. The nickname stays.",
        "Now the marker points to Sam. Ace still means Alex.",
      ],
      [
        "Copy a number, not a friend.",
        "Give Ace Sam’s number. Alex now has 7, but Ace is still Alex.",
      ],
      [
        "Taking a break.",
        "The marker points to nobody now. Alex and Sam are still here.",
      ],
    ],
    markup:
      '<div class="token box-x"><b id="alex">42</b><small>Alex</small></div><div class="token box-y"><b>7</b><small>Sam</small></div><div class="token friend" id="friend"><b>👉</b><small id="friend-label">look here</small></div><div class="arrow" id="arrow">↓</div><div class="nickname" id="nickname">also called Ace</div>',
    draw: (n, $) => {
      $("#alex").textContent = n < 3 ? "42" : n < 5 ? "99" : "7";
      $("#friend").classList.toggle("to-y", n >= 4);
      $("#friend").classList.toggle("parked", n === 6);
      $("#friend").style.opacity = n === 0 ? "0" : "1";
      $("#friend-label").textContent = n === 6 ? "nobody" : "look here";
      $("#arrow").classList.toggle("to-y", n >= 4);
      $("#arrow").style.opacity = n === 0 || n === 6 ? "0" : "1";
      $("#nickname").style.opacity = n >= 2 ? "1" : "0";
    },
  },
  layout: {
    title: "Same stuff. A smarter fit.",
    connection:
      "These blocks stand for fields in a struct. Fields have alignment rules, which can leave empty padding between them. Reordering the example’s double, int, and char reduces its size from 24 to 16 bytes on the illustrated ABI. Real sizes depend on the platform; the animation is schematic.",
    scenes: [
      [
        "Everything fits… sort of.",
        "Our three pieces leave awkward gaps. Those gaps take up space too.",
      ],
      [
        "A little rearranging.",
        "Start with the biggest piece, then the medium one, then the tiny one.",
      ],
      [
        "Room to breathe!",
        "Same three pieces. Less wasted space. Nothing important was thrown away.",
      ],
      [
        "Small savings add up.",
        "Repeat this across thousands of objects and the difference gets much bigger.",
      ],
    ],
    markup:
      '<div class="packing"></div><div class="token pack pack-a"><b>•</b></div><div class="token pack pack-b"><b>BIG</b></div><div class="token pack pack-c"><b>M</b></div><div class="space-note" id="space-note"></div>',
    draw: (n, $) => {
      $("#stage").classList.toggle("packed", n >= 1);
      $("#space-note").textContent =
        n === 0
          ? "Three pieces + awkward gaps"
          : n < 3
            ? "Three pieces + more free space ✨"
            : "10,000 objects × a little saved = a lot saved";
    },
  },
  cache: {
    title: "Why make four snack trips?",
    connection:
      "The tray represents a cache: a small place to keep nearby data handy. A memory fetch brings a whole cache line, not just the requested value. Accessing neighboring values can reuse that fetch. This snack story is an analogy, not a measured speedup; the detailed lab includes a specific cache model.",
    scenes: [
      [
        "The snacks are over there.",
        "You want four cookies. One is good. Four nearby are even better.",
      ],
      [
        "One trip, one cookie?",
        "Fetching each snack separately means lots of back-and-forth.",
      ],
      [
        "Bring the neighbors too.",
        "A batch puts nearby snacks within easy reach.",
      ],
      [
        "The next one is already here.",
        "Need the next cookie? No extra trip. That is the joy of keeping useful things nearby.",
      ],
    ],
    markup:
      '<div class="tray"></div>' +
      [0, 1, 2, 3]
        .map(
          (i) =>
            `<div class="token snack snack-${i}" id="snack-${i}"><b>🍪</b></div>`,
        )
        .join("") +
      '<div class="tray-label">your handy snack tray</div>',
    draw: (n, $) => {
      for (let i = 0; i < 4; i++) {
        $(`#snack-${i}`).classList.toggle(
          "collected",
          n >= 2 || (n === 1 && i === 0),
        );
        $(`#snack-${i}`).style.transitionDelay = `${n >= 2 ? i * 90 : 0}ms`;
        $(`#snack-${i}`).style.opacity = n === 3 && i < 2 ? ".25" : "1";
      }
    },
  },
  compiler: {
    title: "Keep the answer. Lose the busywork.",
    connection:
      "A compiler can remove calculations whose results are overwritten before they are used, as long as observable behavior is preserved. Here the unused calculation has no side effects. Real compiler choices depend on the code and target; the detailed lab explores the boundaries.",
    scenes: [
      [
        "A very busy to-do list.",
        "Work out 24 × 9. Then forget that answer and work out 24 + 1.",
      ],
      [
        "Wait… we never used the first answer.",
        "Why do a calculation just to throw its result away?",
      ],
      ["Let’s skip that bit.", "Keep the work that matters: 24 + 1."],
      [
        "Ta-da! Still 25.",
        "The answer stays the same. The unnecessary work disappears.",
      ],
    ],
    markup:
      '<div class="token task task-a" id="task-a"><b>× 9</b><small>do some work</small></div><div class="token task task-b" id="task-b"><b>↺</b><small>forget it</small></div><div class="token task task-c" id="task-c"><b id="answer">+ 1</b><small id="answer-label">use this instead</small></div><div class="spark" id="spark"></div>',
    draw: (n, $) => {
      $("#task-a").classList.toggle("crossed", n >= 1);
      $("#task-b").classList.toggle("crossed", n >= 2);
      $("#task-c").classList.toggle("keep", n >= 2);
      $("#answer").textContent = n === 3 ? "25 🎉" : "+ 1";
      $("#answer-label").textContent =
        n === 3 ? "same answer!" : "use this instead";
      $("#spark").textContent = n >= 2 ? "Less busywork. Same result." : "";
    },
  },
};
const $ = (s) => document.querySelector(s);
let key = "pointers",
  step = 0,
  timer = null;
function stop() {
  clearInterval(timer);
  timer = null;
  $("#play").textContent = "▶ Play story";
}
function draw() {
  const s = stories[key];
  const [title, text] = s.scenes[step];
  s.draw(step, $);
  $("#caption-title").textContent = title;
  $("#caption-text").textContent = text;
  $("#stage").setAttribute("aria-label", `${title} ${text}`);
  $("#step-count").textContent = `${step + 1} / ${s.scenes.length}`;
  $("#back").disabled = step === 0;
  $("#next").disabled = step === s.scenes.length - 1;
  $("#progress").innerHTML = s.scenes
    .map((_, i) => `<span class="${i <= step ? "done" : ""}"></span>`)
    .join("");
}
function select(id) {
  stop();
  key = Object.hasOwn(stories, id) ? id : "pointers";
  step = 0;
  const s = stories[key];
  $("#stage").className = "";
  $("#stage").innerHTML = s.markup;
  $("#story-title").textContent = s.title;
  $("#chapter").textContent =
    `STORY ${Object.keys(stories).indexOf(key) + 1} OF 4`;
  $("#connection").textContent = s.connection;
  $("#deep-link").href = `advanced.html#${key}`;
  document.querySelectorAll("[data-story]").forEach((b) => {
    if (b.dataset.story === key) b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  });
  draw();
}
$("#back").onclick = () => {
  stop();
  if (step > 0) step--;
  draw();
};
$("#next").onclick = () => {
  stop();
  if (step < stories[key].scenes.length - 1) step++;
  draw();
};
$("#replay").onclick = () => {
  stop();
  step = 0;
  draw();
};
$("#play").onclick = () => {
  if (timer) return stop();
  if (step === stories[key].scenes.length - 1) {
    step = 0;
    draw();
  }
  $("#play").textContent = "Ⅱ Pause";
  timer = setInterval(() => {
    step++;
    draw();
    if (step === stories[key].scenes.length - 1) stop();
  }, 3200);
};
document.querySelectorAll("[data-story]").forEach(
  (b) =>
    (b.onclick = () => {
      location.hash = b.dataset.story;
      select(b.dataset.story);
    }),
);
addEventListener("hashchange", () => select(location.hash.slice(1)));
addEventListener("pagehide", stop);
select(location.hash.slice(1));
