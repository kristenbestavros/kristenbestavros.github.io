// Port of src/generator.py — composite scoring and diversity-aware selection.

import { LetterBag } from './letterbag.js';
import { MarkovModel } from './model.js';
import { getCoda, getOnset, VOWELS } from './phonotactics.js';
import { formatName, maybeAddApostrophe, Role, selectTemplates, getTemplateByLabel } from './templates.js';
import { solve, TEMP_MAX, TEMP_MIN } from './solver.js';
import { makeRng } from './rng.js';

const BOUNDARY_WEIGHT = 0.15;
const BOUNDARY_CONSONANT_PENALTY = -3.0;
const SEGMENT_OVERLAP_PENALTY = 2.0;

export function normalize(phrase) {
  return phrase.toLowerCase().replace(/[^a-z]/g, '');
}

/** How naturally the end of one segment runs into the start of the next. */
function scoreBoundary(segA, segB, model) {
  let ctx = segA.slice(-2);
  let score = 0;

  for (const ch of segB.slice(0, 2)) {
    const padded = ctx.length >= 2 ? ctx : '^'.repeat(2 - ctx.length) + ctx;
    score += model.getLogProb(padded, ch);
    ctx = (ctx + ch).slice(-2);
  }

  const boundaryConsonants = getCoda(segA).length + getOnset(segB).length;
  if (boundaryConsonants > 3) {
    score += BOUNDARY_CONSONANT_PENALTY * (boundaryConsonants - 3);
  }
  return score;
}

/** The composite metric the CLI ranks by. Higher is better. */
export function scoreCandidate(segments, tmpl, models) {
  let markovScore = 0;
  for (let i = 0; i < segments.length; i++) {
    markovScore += models[i].scoreSegment(segments[i]) / Math.max(segments[i].length, 1);
  }

  const lengths = segments.filter((s) => s.length > 1).map((s) => s.length);
  let balanceBonus = 0;
  if (lengths.length > 1) {
    const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance =
      lengths.reduce((a, l) => a + (l - mean) ** 2, 0) / lengths.length;
    balanceBonus = -0.1 * variance;
  }

  const fullName = segments.join('');
  let vowelScore = -10.0;
  if (fullName) {
    let vowels = 0;
    for (const c of fullName) if (VOWELS.has(c)) vowels++;
    vowelScore = -10.0 * Math.abs(vowels / fullName.length - 0.4);
  }

  const starts = new Set(segments.filter((s) => s).map((s) => s[0]));
  const diversityBonus = 0.2 * starts.size;

  const bigramSets = [];
  for (const seg of segments) {
    if (seg.length >= 2) {
      const bigrams = new Set();
      for (let i = 0; i < seg.length - 1; i++) bigrams.add(seg.slice(i, i + 2));
      bigramSets.push(bigrams);
    }
  }
  let repetitionPenalty = 0;
  if (bigramSets.length > 1) {
    let shared = 0;
    for (const bg of bigramSets[0]) {
      if (bigramSets.every((s) => s.has(bg))) shared++;
    }
    repetitionPenalty = -0.3 * shared;
  }

  let boundaryScore = 0;
  let nBoundaries = 0;
  for (let i = 0; i < segments.length - 1; i++) {
    if (segments[i].length > 1 && segments[i + 1].length > 1) {
      boundaryScore += scoreBoundary(segments[i], segments[i + 1], models[i + 1]);
      nBoundaries++;
    }
  }
  if (nBoundaries > 0) boundaryScore /= nBoundaries;

  return (
    markovScore +
    balanceBonus +
    vowelScore +
    diversityBonus +
    repetitionPenalty +
    BOUNDARY_WEIGHT * boundaryScore
  );
}

function maxSegmentOverlap(candidateSegs, selected) {
  const cand = new Set(candidateSegs.filter((s) => s.length > 1));
  if (!cand.size) return 0;

  let best = 0;
  for (const entry of selected) {
    const sel = new Set(entry.segments.filter((s) => s.length > 1));
    let shared = 0;
    for (const s of cand) if (sel.has(s)) shared++;
    if (shared > best) best = shared;
  }
  return best;
}

export class Anagrammer {
  /**
   * @param {object} data parsed contents of anagram-data.json
   */
  constructor(data) {
    this.models = {};
    for (const [key, counts] of Object.entries(data.counts)) {
      this.models[key] = new MarkovModel(counts);
    }
    this.englishWords = new Set(data.englishWords);
    this.blockedWords = new Set(data.blockedWords);
    this.attribution = data.attribution;
  }

  modelFor(role, dataset, isMononym) {
    if (isMononym) return this.models[`combined_${dataset}`];
    if (role === Role.FIRST) return this.models[`first_${dataset}`];
    if (role === Role.LAST || role === Role.HYPHENATED_LAST) return this.models.surname;
    return this.models[`combined_${dataset}`];
  }

  modelsForTemplate(tmpl, dataset) {
    const isMononym = tmpl.segments.length === 1;
    return tmpl.segments.map((s) => this.modelFor(s.role, dataset, isMononym));
  }

  /**
   * @returns {{results: Array, letters: string, seed: number, error?: string}}
   */
  generate(phrase, options = {}) {
    const {
      dataset = 'both',
      nResults = 10,
      templateLabel = null,
      tempMin = TEMP_MIN,
      tempMax = TEMP_MAX,
      allowWords = false,
      seed = 1,
      attemptsPerTemplate = null,
    } = options;

    const letters = normalize(phrase);
    const rng = makeRng(seed);

    if (letters.length < 3) {
      return { results: [], letters, seed, error: 'too-short' };
    }

    // The largest template holds 35 letters; past that nothing can be built.
    if (letters.length > 35) {
      return { results: [], letters, seed, error: 'too-long' };
    }

    const bag = new LetterBag(letters);
    const nLetters = bag.total();

    let templates;
    if (templateLabel) {
      const chosen = getTemplateByLabel(templateLabel);
      if (!chosen) return { results: [], letters, seed, error: 'unknown-template' };
      if (nLetters < chosen.totalMin || nLetters > chosen.totalMax) {
        return {
          results: [],
          letters,
          seed,
          error: 'template-unfit',
          templateRange: [chosen.totalMin, chosen.totalMax],
        };
      }
      templates = [chosen];
    } else {
      templates = selectTemplates(nLetters, rng);
    }

    let attempts = attemptsPerTemplate;
    if (attempts === null) {
      attempts = 500;
      if (nLetters > 20) attempts = 800;
      if (nLetters > 30) attempts = 1200;
    }

    const all = [];

    for (const tmpl of templates) {
      const models = this.modelsForTemplate(tmpl, dataset);
      const candidates = solve(bag, tmpl, models, attempts, tempMin, tempMax, rng);

      for (const segments of candidates) {
        if (segments.some((seg) => this.blockedWords.has(seg))) continue;
        if (
          !allowWords &&
          segments.some((seg) => seg.length >= 4 && this.englishWords.has(seg))
        ) {
          continue;
        }

        const composite = scoreCandidate(segments, tmpl, models);
        const display = maybeAddApostrophe(segments, tmpl, rng);

        all.push({
          name: formatName(display, tmpl),
          score: composite,
          template: tmpl.label,
          segments,
        });
      }
    }

    // Deduplicate by name and by segment set, so reorderings of the same
    // segments don't fill the list.
    const seenNames = new Set();
    const seenSegmentSets = new Set();
    const unique = [];

    for (const entry of all) {
      const nameKey = entry.name.toLowerCase();
      const segKey = entry.segments.slice().sort().join('\u0000');
      if (seenNames.has(nameKey) || seenSegmentSets.has(segKey)) continue;
      seenNames.add(nameKey);
      seenSegmentSets.add(segKey);
      unique.push(entry);
    }

    unique.sort((a, b) => b.score - a.score);

    // Diversity-aware greedy selection: quality, minus a penalty for reusing
    // segments already chosen, with a cap per template.
    const final = [];
    const labelCounts = new Map();
    const remaining = unique.slice();
    const maxPerLabel = Math.max(2, Math.floor(nResults * 0.4));

    while (final.length < nResults && remaining.length) {
      let bestIdx = null;
      let bestAdjusted = -Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const entry = remaining[i];
        if ((labelCounts.get(entry.template) || 0) >= maxPerLabel) continue;

        const adjusted =
          entry.score - SEGMENT_OVERLAP_PENALTY * maxSegmentOverlap(entry.segments, final);
        if (adjusted > bestAdjusted) {
          bestAdjusted = adjusted;
          bestIdx = i;
        }
      }

      if (bestIdx === null) break;
      const [entry] = remaining.splice(bestIdx, 1);
      final.push(entry);
      labelCounts.set(entry.template, (labelCounts.get(entry.template) || 0) + 1);
    }

    for (const entry of remaining) {
      if (final.length >= nResults) break;
      final.push(entry);
    }

    // Verify every result really is an anagram of the input.
    const sortedIn = letters.split('').sort().join('');
    for (const entry of final) {
      const used = entry.segments.join('').split('').sort().join('');
      entry.exact = used === sortedIn;
    }

    return { results: final, letters, seed };
  }
}
