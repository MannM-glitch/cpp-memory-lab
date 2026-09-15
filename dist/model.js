export const pointerSteps = [
  {
    code: "int x = 42;",
    x: 42,
    title: "Give a value a home",
    text: "x is an int object. We assign it the simulated address 0x1000. These addresses illustrate relationships; real addresses vary.",
  },
  {
    code: "int y = 7;",
    x: 42,
    y: 7,
    title: "A second, independent object",
    text: "y has its own storage. Changing x will not change y.",
  },
  {
    code: "int* p = &x;",
    x: 42,
    y: 7,
    p: "x",
    title: "A pointer stores an address",
    text: "The address-of operator & obtains x’s address. p is a separate object whose value is that address.",
  },
  {
    code: "int& r = x;",
    x: 42,
    y: 7,
    p: "x",
    ref: true,
    title: "A reference is another name",
    text: "r binds to x. It is not a second int or a separate copy. Whether reference storage is needed is implementation-dependent.",
  },
  {
    code: "*p = 99;",
    x: 99,
    y: 7,
    p: "x",
    ref: true,
    title: "Follow the pointer; write to x",
    text: "Dereferencing p selects x. Writing 99 through *p changes x, so reading r also yields 99.",
  },
  {
    code: "p = &y;",
    x: 99,
    y: 7,
    p: "y",
    ref: true,
    title: "Pointers can point somewhere else",
    text: "p now holds y’s address. The reference r is still bound to x.",
  },
  {
    code: "r = y;",
    x: 7,
    y: 7,
    p: "y",
    ref: true,
    title: "Assignment does not rebind a reference",
    text: "r = y copies y’s value into x. r still names x. It does not start referring to y.",
  },
  {
    code: "p = nullptr;",
    x: 7,
    y: 7,
    p: null,
    ref: true,
    title: "A pointer can hold no object address",
    text: "p is now null. Dereferencing it would be undefined behavior. r still names x, which remains alive here.",
  },
];

// An explicit illustrative ABI: char 1/1, int 4/4, double 8/8 (size/alignment).
export const fields = {
  tag: { name: "tag", type: "char", size: 1, align: 1, css: "char" },
  value: { name: "value", type: "double", size: 8, align: 8, css: "double" },
  count: { name: "count", type: "int", size: 4, align: 4, css: "int" },
};
export function structLayout(order) {
  if (
    !Array.isArray(order) ||
    order.length !== 3 ||
    new Set(order).size !== 3 ||
    order.some((k) => !fields[k])
  )
    throw new Error("Expected each field exactly once");
  let offset = 0;
  const bytes = [],
    members = [];
  const pad = () => {
    bytes.push({ offset: offset++, name: "padding", css: "padding" });
  };
  for (const key of order) {
    const field = fields[key];
    while (offset % field.align) pad();
    members.push({ ...field, offset });
    for (let i = 0; i < field.size; i++)
      bytes.push({ offset: offset++, name: key, css: field.css });
  }
  const alignment = Math.max(...order.map((k) => fields[k].align));
  while (offset % alignment) pad();
  return {
    bytes,
    members,
    size: offset,
    alignment,
    padding: bytes.filter((b) => b.css === "padding").length,
  };
}

// 8x8 int matrix, 4-byte int, aligned base, 16-byte lines, four fully-associative
// lines with LRU replacement; cold, read-only cache; no prefetching.
export function cacheTrace(mode = "row") {
  if (!["row", "column"].includes(mode)) throw new Error("Unknown traversal");
  let cache = [],
    misses = 0;
  const trace = [];
  for (let outer = 0; outer < 8; outer++)
    for (let inner = 0; inner < 8; inner++) {
      const row = mode === "row" ? outer : inner,
        col = mode === "row" ? inner : outer;
      const index = row * 8 + col,
        line = Math.floor(index / 4),
        hit = cache.includes(line);
      const evicted = !hit && cache.length === 4 ? cache[0] : null;
      if (!hit) misses++;
      cache = cache.filter((l) => l !== line);
      cache.push(line);
      if (cache.length > 4) cache.shift();
      trace.push({
        row,
        col,
        index,
        line,
        hit,
        evicted,
        cache: [...cache],
        misses,
        hits: trace.length + 1 - misses,
      });
    }
  return trace;
}

export const transformations = {
  fold: {
    name: "Constant folding",
    file: "constant_folding.cpp",
    source: [
      "unsigned compute(unsigned x) {",
      "  unsigned scale = 3u * 4u;",
      "  return x + scale;",
      "}",
    ],
    optimized: ["unsigned compute(unsigned x) {", "  return x + 12u;", "}"],
    title: "Compute what is already known.",
    text: "The constant expression 3u * 4u can become 12u before execution. This source-level rewrite illustrates the idea; even an unoptimized build may fold constants.",
    principle:
      "An optimizer preserves observable behavior while choosing a different implementation. Source expressions do not map one-to-one to instructions.",
    run: (x) => (x + 12) >>> 0,
    rewritten: (x) => (x + 3 * 4) >>> 0,
  },
  dead: {
    name: "Dead store elimination",
    file: "dead_store.cpp",
    source: [
      "unsigned compute(unsigned x) {",
      "  unsigned result = x * 9u;",
      "  result = x + 1u;",
      "  return result;",
      "}",
    ],
    optimized: ["unsigned compute(unsigned x) {", "  return x + 1u;", "}"],
    title: "Remove work whose result is never used.",
    text: "The first value of result is overwritten before any read. These unsigned arithmetic operations have no observable side effects. Volatile writes, I/O, and other side effects cannot simply be discarded.",
    principle:
      "A benchmark can time nothing if its result is unobserved. Check generated code and use a benchmark harness that prevents unwanted elimination.",
    run: (x) => {
      let result = Math.imul(x, 9) >>> 0;
      result = (x + 1) >>> 0;
      return result;
    },
    rewritten: (x) => (x + 1) >>> 0,
  },
  strength: {
    name: "Strength reduction",
    file: "strength_reduction.cpp",
    source: ["unsigned compute(unsigned x) {", "  return x * 8u;", "}"],
    optimized: ["unsigned compute(unsigned x) {", "  return x << 3;", "}"],
    title: "Express the same operation another way.",
    text: "For the illustrated 32-bit unsigned type, both forms wrap modulo 2³². A compiler may use a shift, an addressing instruction, or another sequence. A shift is not a universal speedup; let target-specific cost models decide.",
    principle:
      "Readable code gives the compiler room to choose. Inspect and measure before replacing clear arithmetic with manual tricks.",
    run: (x) => Math.imul(x, 8) >>> 0,
    rewritten: (x) => (x << 3) >>> 0,
  },
  alias: {
    name: "Aliasing barrier",
    file: "aliasing.cpp",
    source: [
      "int update(int* a, int* b) {",
      "  *a = 1;",
      "  *b = 2;",
      "  return *a;",
      "}",
    ],
    optimized: [
      "// Cannot always return 1:",
      "// a and b may point to one int.",
      "*a = 1;",
      "*b = 2;",
      "return *a; // keep the dependency",
    ],
    title: "What if both addresses name the same object?",
    text: "With distinct objects the result is 1; when a == b the result is 2. Both pointers have the same type, so type-based alias analysis cannot assume they are independent. References can alias too.",
    principle:
      "Optimization depends on what the compiler can prove. Replacing a pointer parameter with a reference does not promise non-aliasing.",
    run: (_, alias) => (alias ? 2 : 1),
    rewritten: (_, alias) => (alias ? 2 : 1),
  },
};
