// Port of src/solver.py — Markov-guided construction with phonotactic
// lookahead, plus distribution of any letters left over.
//
// The CLI's hill-climbing and syllable-swap refinement passes are not ported.
// They are the most intricate part of the codebase and produce the smallest
// visible difference for a single interactive query.

import { isValidSegment, phonotacticFilter } from './phonotactics.js';
import { START } from './model.js';

export const TEMP_MIN = 1.2;
export const TEMP_MAX = 2.0;

/** Temperature-scaled sample from (char, logProb) pairs. */
export function weightedSample(candidates, temperature, rng) {
  if (!candidates.length) return null;

  let maxLp = -Infinity;
  for (const [, lp] of candidates) if (lp > maxLp) maxLp = lp;

  const weights = candidates.map(([, lp]) => Math.exp((lp - maxLp) / temperature));
  let total = 0;
  for (const w of weights) total += w;

  let r = rng.random() * total;
  let cumulative = 0;
  for (let i = 0; i < candidates.length; i++) {
    cumulative += weights[i];
    if (cumulative >= r) return candidates[i][0];
  }
  return candidates[candidates.length - 1][0];
}

/** Build one segment character by character. Returns null if it can't. */
export function buildSegment(bag, minLen, maxLen, model, temperature, rng, maxSubAttempts = 50) {
  for (let attempt = 0; attempt < maxSubAttempts; attempt++) {
    let segment = '';
    const working = bag.copy();
    let context = START;

    let targetLen = rng.randint(minLen, maxLen);
    targetLen = Math.min(targetLen, working.total());
    if (targetLen < minLen) return null;

    let ok = true;
    for (let pos = 0; pos < targetLen; pos++) {
      let candidates = model.getLikelyNext(context.slice(-2), working);
      candidates = phonotacticFilter(candidates, segment, pos, targetLen);

      if (!candidates.length) {
        ok = false;
        break;
      }

      const char = weightedSample(candidates, temperature, rng);
      if (char === null) {
        ok = false;
        break;
      }

      segment += char;
      working.subtract(char);
      context += char;
    }

    if (ok && segment.length >= minLen && isValidSegment(segment)) return segment;
  }
  return null;
}

/** Insert leftover letters into existing segments at the best-scoring spot. */
export function distributeRemaining(segments, remaining, specs, models) {
  for (const char of remaining.asSortedString()) {
    let bestDelta = -Infinity;
    let bestInsertion = null;

    for (let segIdx = 0; segIdx < segments.length; segIdx++) {
      const segment = segments[segIdx];
      const spec = specs[segIdx];
      if (segment.length >= spec.maxLen) continue;
      if (spec.maxLen === 1) continue; // never grow an initial

      for (let pos = 0; pos <= segment.length; pos++) {
        const candidate = segment.slice(0, pos) + char + segment.slice(pos);
        if (!isValidSegment(candidate)) continue;

        const delta =
          models[segIdx].scoreSegment(candidate) - models[segIdx].scoreSegment(segment);
        if (delta > bestDelta) {
          bestDelta = delta;
          bestInsertion = [segIdx, candidate];
        }
      }
    }

    if (!bestInsertion) return false;
    segments[bestInsertion[0]] = bestInsertion[1];
  }
  return true;
}

/** One full candidate for a template, or null if the letters won't cooperate. */
export function generateCandidate(letterBag, tmpl, models, temperature, rng) {
  const remaining = letterBag.copy();
  const specs = tmpl.segments;
  const segments = new Array(specs.length).fill(null);

  const order = rng.shuffle(specs.map((_, i) => i));

  for (let step = 0; step < order.length; step++) {
    const idx = order[step];
    const spec = specs[idx];

    // Reserve enough letters for the segments still to be built.
    let neededLater = 0;
    for (let future = step + 1; future < order.length; future++) {
      neededLater += specs[order[future]].minLen;
    }

    const availableNow = remaining.total() - neededLater;
    let effectiveMax = Math.min(spec.maxLen, availableNow);
    let effectiveMin = spec.minLen;

    if (effectiveMax < effectiveMin) return null;

    // The last segment built must consume exactly what's left.
    if (step === order.length - 1) {
      const needed = remaining.total();
      if (needed < effectiveMin || needed > spec.maxLen) return null;
      effectiveMin = needed;
      effectiveMax = needed;
    }

    const segment = buildSegment(
      remaining,
      effectiveMin,
      effectiveMax,
      models[idx],
      temperature,
      rng
    );
    if (segment === null) return null;

    segments[idx] = segment;
    remaining.subtract(segment);
  }

  if (!remaining.isEmpty() && !distributeRemaining(segments, remaining, specs, models)) {
    return null;
  }

  return segments;
}

/** Many attempts for one template, temperature ramping to widen variety. */
export function solve(letterBag, tmpl, models, nAttempts, tempMin, tempMax, rng) {
  const results = [];
  const seen = new Set();

  for (let i = 0; i < nAttempts; i++) {
    const progress = i / Math.max(nAttempts - 1, 1);
    const temperature = tempMin + (tempMax - tempMin) * progress;

    const candidate = generateCandidate(letterBag, tmpl, models, temperature, rng);
    if (!candidate) continue;

    const key = candidate.join('\u0000');
    if (seen.has(key)) continue;
    seen.add(key);

    results.push(candidate);
  }

  return results;
}
