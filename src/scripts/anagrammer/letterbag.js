// Port of src/letterbag.py — a multiset of letters tracking what's still
// available during construction.

export class LetterBag {
  constructor(source = '') {
    this.counts = new Map();
    for (const raw of source) {
      const c = raw.toLowerCase();
      if (c >= 'a' && c <= 'z') {
        this.counts.set(c, (this.counts.get(c) || 0) + 1);
      }
    }
  }

  count(letter) {
    return this.counts.get(letter) || 0;
  }

  contains(letter) {
    return this.count(letter) > 0;
  }

  subtract(letters) {
    for (const raw of letters) {
      const c = raw.toLowerCase();
      const n = this.counts.get(c) || 0;
      if (n <= 0) throw new Error(`Cannot subtract '${c}': not available`);
      if (n === 1) this.counts.delete(c);
      else this.counts.set(c, n - 1);
    }
  }

  add(letters) {
    for (const raw of letters) {
      const c = raw.toLowerCase();
      this.counts.set(c, (this.counts.get(c) || 0) + 1);
    }
  }

  total() {
    let t = 0;
    for (const n of this.counts.values()) t += n;
    return t;
  }

  isEmpty() {
    return this.total() === 0;
  }

  availableLetters() {
    return [...this.counts.keys()].sort();
  }

  asSortedString() {
    const out = [];
    for (const letter of this.availableLetters()) {
      out.push(letter.repeat(this.counts.get(letter)));
    }
    return out.join('');
  }

  copy() {
    const bag = new LetterBag();
    bag.counts = new Map(this.counts);
    return bag;
  }
}
