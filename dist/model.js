export const pointerSteps = [
  { code: 'int x = 42;', x: 42, title: 'Give a value a home', text: 'x is an int object. We assign it the simulated address 0x1000. These addresses illustrate relationships; real addresses vary.' },
  { code: 'int y = 7;', x: 42, y: 7, title: 'A second, independent object', text: 'y has its own storage. Changing x will not change y.' },
  { code: 'int* p = &x;', x: 42, y: 7, p: 'x', title: 'A pointer stores an address', text: 'The address-of operator & obtains x’s address. p is a separate object whose value is that address.' },
  { code: 'int& r = x;', x: 42, y: 7, p: 'x', ref: true, title: 'A reference is another name', text: 'r binds to x. It is not a second int or a separate copy. Whether reference storage is needed is implementation-dependent.' },
  { code: '*p = 99;', x: 99, y: 7, p: 'x', ref: true, title: 'Follow the pointer; write to x', text: 'Dereferencing p selects x. Writing 99 through *p changes x, so reading r also yields 99.' },
  { code: 'p = &y;', x: 99, y: 7, p: 'y', ref: true, title: 'Pointers can point somewhere else', text: 'p now holds y’s address. The reference r is still bound to x.' },
  { code: 'r = y;', x: 7, y: 7, p: 'y', ref: true, title: 'Assignment does not rebind a reference', text: 'r = y copies y’s value into x. r still names x. It does not start referring to y.' },
  { code: 'p = nullptr;', x: 7, y: 7, p: null, ref: true, title: 'A pointer can hold no object address', text: 'p is now null. Dereferencing it would be undefined behavior. r still names x, which remains alive here.' }
];
