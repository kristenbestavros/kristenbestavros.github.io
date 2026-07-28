// Port of src/phonotactics.py — hard pronounceability constraints, used both
// for final validation and as lookahead during segment construction.

export const VOWELS = new Set('aeiouy');
export const CONSONANTS = new Set('bcdfghjklmnpqrstvwxyz');

const set = (s) => new Set(s.split(' '));

const VALID_ONSETS_2 = set(
  'bl br ch cl cr dh dr dw fl fr gh gl gn gr gw kh kl kn kr kw ph pl pr ps qu ' +
    'rh sc sh sk sl sm sn sp st sv sw th tr ts tw vl vr wh wr zh'
);

const VALID_ONSETS_3 = set('chr phr sch scr shr sph spl spr squ str thr');

const VALID_CODAS_2 = set(
  'ch ck ct dg ds ff ft gh gs ks lb lc ld lf lk ll lm ln lp ls lt lv lz mb mn ' +
    'mp ms mt nc nd ng nk nn ns nt nx nz ph ps pt rb rc rd rf rg rk rl rm rn ' +
    'rp rs rt rv rz sh sk sm sp ss st th ts tt tz wl wn ws xt xn'
);

const VALID_CODAS_3 = set(
  'cts fts lch lds lfs lks lls lms lps lts mbs mps nce nch ncs nds ngs nks ' +
    'nse nth nts nze rbs rch rds rfs rks rls rms rns rps rse rst rth rts sks ' +
    'sts tch ths'
);

const VALID_VOWEL_PAIRS = set(
  'ae ai ao au ay ea ee ei eo eu ey ia ie io iu oa oe oi oo ou oy ua ue ui ' +
    'uo uy ya ye yi yo yu'
);

export function getOnset(segment) {
  let i = 0;
  while (i < segment.length && !VOWELS.has(segment[i])) i++;
  return segment.slice(0, i);
}

export function getCoda(segment) {
  let i = segment.length;
  while (i > 0 && !VOWELS.has(segment[i - 1])) i--;
  return segment.slice(i);
}

export function isValidOnset(cluster) {
  if (cluster.length <= 1) return true;
  if (cluster.length === 2) return VALID_ONSETS_2.has(cluster);
  if (cluster.length === 3) return VALID_ONSETS_3.has(cluster);
  return false;
}

export function isValidCoda(cluster) {
  if (cluster.length <= 1) return true;
  if (cluster.length === 2) return VALID_CODAS_2.has(cluster);
  if (cluster.length === 3) return VALID_CODAS_3.has(cluster);
  return false;
}

function countTrailing(s, charSet) {
  let n = 0;
  for (let i = s.length - 1; i >= 0; i--) {
    if (charSet.has(s[i])) n++;
    else break;
  }
  return n;
}

function hasExcessiveConsonantRun(segment, maxRun = 3) {
  let run = 0;
  for (const c of segment) {
    if (CONSONANTS.has(c)) {
      run++;
      if (run > maxRun) return true;
    } else {
      run = 0;
    }
  }
  return false;
}

function hasExcessiveVowelRun(segment, maxRun = 2) {
  let run = 0;
  for (let i = 0; i < segment.length; i++) {
    if (VOWELS.has(segment[i])) {
      run++;
      if (run > maxRun) return true;
      if (run === 2 && !VALID_VOWEL_PAIRS.has(segment.slice(i - 1, i + 1))) {
        return true;
      }
    } else {
      run = 0;
    }
  }
  return false;
}

function couldBeValidOnsetPrefix(cluster) {
  if (cluster.length <= 1) return true;
  if (cluster.length === 2) {
    if (VALID_ONSETS_2.has(cluster)) return true;
    for (const o of VALID_ONSETS_3) if (o.startsWith(cluster)) return true;
    return false;
  }
  if (cluster.length === 3) return VALID_ONSETS_3.has(cluster);
  return false;
}

function couldBeValidCodaPrefix(cluster) {
  if (cluster.length <= 1) return true;
  if (cluster.length === 2) {
    if (VALID_CODAS_2.has(cluster)) return true;
    for (const o of VALID_CODAS_3) if (o.startsWith(cluster)) return true;
    return false;
  }
  if (cluster.length === 3) return VALID_CODAS_3.has(cluster);
  return false;
}

export function isValidSegment(segment) {
  if (segment.length === 0) return false;
  if (segment.length === 1) return /[a-z]/.test(segment);

  let hasVowel = false;
  for (const c of segment) if (VOWELS.has(c)) hasVowel = true;
  if (!hasVowel) return false;

  const onset = getOnset(segment);
  if (onset.length > 1 && !isValidOnset(onset)) return false;

  const coda = getCoda(segment);
  if (coda.length > 1 && !isValidCoda(coda)) return false;

  if (hasExcessiveConsonantRun(segment, 3)) return false;
  return !hasExcessiveVowelRun(segment, 2);
}

/**
 * Trim candidate next-characters to those that don't walk the segment into a
 * phonotactic dead end. This is the lookahead that keeps construction from
 * wasting attempts on unpronounceable prefixes.
 */
export function phonotacticFilter(candidates, partial, position, targetLen) {
  const result = [];

  for (const [char, prob] of candidates) {
    const test = partial + char;
    const remaining = targetLen - position - 1;

    if (CONSONANTS.has(char) && countTrailing(test, CONSONANTS) > 3) continue;

    if (VOWELS.has(char)) {
      const trailingVowels = countTrailing(test, VOWELS);
      if (trailingVowels > 2) continue;
      if (trailingVowels === 2 && !VALID_VOWEL_PAIRS.has(test.slice(-2))) continue;
    }

    let allConsonants = true;
    for (const c of test) if (!CONSONANTS.has(c)) allConsonants = false;
    if (position === 0 || (test.length <= 3 && allConsonants)) {
      const onsetSoFar = getOnset(test);
      if (onsetSoFar.length > 1 && !couldBeValidOnsetPrefix(onsetSoFar)) continue;
    }

    if (remaining <= 2 && CONSONANTS.has(char)) {
      const trailing = getCoda(test);
      if (trailing.length > 1 && !couldBeValidCodaPrefix(trailing)) continue;
    }

    if (remaining === 0 && test.length > 1) {
      let vowelPresent = false;
      for (const c of test) if (VOWELS.has(c)) vowelPresent = true;
      if (!vowelPresent) continue;
    }

    result.push([char, prob]);
  }

  return result;
}
