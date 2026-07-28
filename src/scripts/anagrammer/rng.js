// Seeded random number generator, so the demo can reproduce a result from a
// seed the way the CLI's --seed flag does.

export function makeRng(seed) {
  // mulberry32: small, fast, good enough for sampling.
  let a = seed >>> 0;
  const next = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    random: next,
    // Inclusive on both ends, matching Python's random.randint.
    randint(min, max) {
      return min + Math.floor(next() * (max - min + 1));
    },
    shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    },
  };
}

export function randomSeed() {
  return Math.floor(Math.random() * 2 ** 31);
}
