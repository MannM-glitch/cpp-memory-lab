#include <cassert>
#include <cstddef>
#include <iostream>
#include <memory>
#include <vector>

struct Original { char tag; double value; int count; };
struct Reordered { double value; int count; char tag; };

unsigned constant_fold(unsigned x) { return x + 3u * 4u; }
unsigned dead_store(unsigned x) { unsigned result = x * 9u; result = x + 1u; return result; }
unsigned strength_reduce(unsigned x) { return x * 8u; }
int update(int* a, int* b) { *a = 1; *b = 2; return *a; }

// Independent unsigned additions give a compiler an opportunity to vectorize.
// Whether it does so depends on target, cost model, flags and alias analysis.
void add_arrays(unsigned* dst, const unsigned* a, const unsigned* b, std::size_t n) {
  for (std::size_t i = 0; i < n; ++i) dst[i] = a[i] + b[i];
}

int main() {
  int x = 42;
  int y = 7;
  int* p = &x;
  int& r = x;
  *p = 99;
  assert(x == 99 && r == 99);
  p = &y;
  assert(p == &y && &r == &x);
  r = y;
  assert(x == 7 && &r == &x);
  p = nullptr; // Do not dereference a null pointer.
  assert(p == nullptr);

  std::cout << "Original: sizeof=" << sizeof(Original) << ", alignof=" << alignof(Original)
            << ", offsets=" << offsetof(Original, tag) << ',' << offsetof(Original, value)
            << ',' << offsetof(Original, count) << '\n';
  std::cout << "Reordered: sizeof=" << sizeof(Reordered) << ", alignof=" << alignof(Reordered)
            << ", offsets=" << offsetof(Reordered, value) << ',' << offsetof(Reordered, count)
            << ',' << offsetof(Reordered, tag) << '\n';
  // Actual sizes are deliberately printed, not asserted: they depend on the ABI.

  for (unsigned input : {0u, 1u, 24u, 100u, ~0u}) {
    assert(constant_fold(input) == input + 12u);
    assert(dead_store(input) == input + 1u);
    assert(strength_reduce(input) == (input << 3));
  }
  int a = 0, b = 0;
  assert(update(&a, &b) == 1);
  assert(update(&a, &a) == 2);
  const unsigned lhs[] = {1u, 2u, 3u, 4u}, rhs[] = {5u, 6u, 7u, 8u};
  unsigned dst[4] = {};
  add_arrays(dst, lhs, rhs, 4);
  for (std::size_t i = 0; i < 4; ++i) assert(dst[i] == lhs[i] + rhs[i]);

  // RAII owns dynamic storage and releases it when the owner leaves scope.
  auto owned = std::make_unique<int>(42);
  int* observer = owned.get();
  assert(*observer == 42); // Observer is valid while the owned int is alive.
  owned.reset(); // Observer is now dangling. Never dereference it.
  observer = nullptr;

  // Reserve capacity before taking an address that subsequent growth could invalidate.
  std::vector<int> values;
  values.reserve(1000); // Capacity becomes at least 1000; size is still zero.
  assert(values.empty() && values.capacity() >= 1000);
  for (int i = 0; i < 1000; ++i) values.push_back(i);
  assert(values.size() == 1000 && values.back() == 999);
  std::cout << "All C++ semantic checks passed.\n";
}
