// Port of src/markov.py — trigram character model (2 context chars + 1
// predicted), reconstructed in the browser from exported transition counts.

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

export const ORDER = 2;
export const START = '^^';
export const END = '$';

export class MarkovModel {
  /**
   * Rebuild the model from raw counts. Applies the same Laplace smoothing as
   * MarkovModel.train() in Python, so log-probabilities match the CLI exactly.
   */
  constructor(counts) {
    const alphaSize = ALPHABET.length + 1; // 26 letters + END

    this.logProbs = new Map();
    const unigram = new Map();

    for (const [context, charCounts] of Object.entries(counts)) {
      let observed = 0;
      for (const [char, n] of Object.entries(charCounts)) {
        observed += n;
        if (char !== END) unigram.set(char, (unigram.get(char) || 0) + n);
      }
      const total = observed + alphaSize;

      const row = new Map();
      for (const char of ALPHABET + END) {
        const n = charCounts[char] || 0;
        row.set(char, Math.log((n + 1) / total));
      }
      this.logProbs.set(context, row);
    }

    let unigramTotal = 26;
    for (const n of unigram.values()) unigramTotal += n;

    this.unigramLogProbs = new Map();
    for (const char of ALPHABET) {
      this.unigramLogProbs.set(
        char,
        Math.log(((unigram.get(char) || 0) + 1) / unigramTotal)
      );
    }
  }

  /**
   * Log-probability of `char` following `context`, with the same backoff
   * chain as the Python.
   *
   * Note: every context key is exactly two characters long, so the bigram
   * backoff branch in the original can never match and control always falls
   * through to the unigram. Replicated as-is deliberately — "fixing" it here
   * would make the demo disagree with the CLI.
   */
  getLogProb(context, char) {
    const row = this.logProbs.get(context);
    if (row) {
      const lp = row.get(char);
      if (lp !== undefined) return lp;
    }
    const uni = this.unigramLogProbs.get(char);
    if (uni !== undefined) return uni - 2.0;
    return -15.0;
  }

  /** Log-probability of a whole segment. */
  scoreSegment(segment) {
    if (!segment) return -100.0;
    const padded = START + segment.toLowerCase() + END;
    let score = 0;
    for (let i = 0; i + ORDER < padded.length; i++) {
      score += this.getLogProb(padded.slice(i, i + ORDER), padded[i + ORDER]);
    }
    return score;
  }

  /**
   * Available next characters, ranked by probability descending.
   * Ties break alphabetically, matching Python's sort key.
   */
  getLikelyNext(context, bag) {
    let ctx = context;
    if (ctx.length < ORDER) ctx = START.slice(0, ORDER - ctx.length) + ctx;

    const candidates = [];
    const row = this.logProbs.get(ctx);

    for (const char of bag.availableLetters()) {
      if (row) {
        const lp = row.get(char);
        if (lp !== undefined) candidates.push([char, lp]);
      } else {
        const uni = this.unigramLogProbs.get(char);
        if (uni !== undefined) candidates.push([char, uni]);
      }
    }

    candidates.sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
    return candidates;
  }
}
