// Port of src/templates.py — the name structures a set of letters can be
// arranged into, and how finished segments get formatted for display.

export const Role = {
  FIRST: 'first',
  MIDDLE: 'middle',
  LAST: 'last',
  INITIAL: 'initial',
  HYPHENATED_LAST: 'hyph_last',
};

const spec = (role, min, max) => ({ role, minLen: min, maxLen: max });

function template(label, segments) {
  return {
    label,
    segments,
    totalMin: segments.reduce((a, s) => a + s.minLen, 0),
    totalMax: segments.reduce((a, s) => a + s.maxLen, 0),
  };
}

export const TEMPLATES = [
  template('Mononym', [spec(Role.FIRST, 3, 10)]),
  template('I. Last', [spec(Role.INITIAL, 1, 1), spec(Role.LAST, 2, 5)]),
  template('First Last', [spec(Role.FIRST, 3, 8), spec(Role.LAST, 3, 9)]),
  template('First M. Last', [
    spec(Role.FIRST, 3, 7),
    spec(Role.INITIAL, 1, 1),
    spec(Role.LAST, 3, 8),
  ]),
  template('First Middle Last', [
    spec(Role.FIRST, 3, 7),
    spec(Role.MIDDLE, 3, 6),
    spec(Role.LAST, 3, 8),
  ]),
  template('First M. M. Last', [
    spec(Role.FIRST, 3, 7),
    spec(Role.INITIAL, 1, 1),
    spec(Role.INITIAL, 1, 1),
    spec(Role.LAST, 4, 9),
  ]),
  template('First M. Last-Last', [
    spec(Role.FIRST, 3, 7),
    spec(Role.INITIAL, 1, 1),
    spec(Role.LAST, 3, 8),
    spec(Role.HYPHENATED_LAST, 3, 8),
  ]),
  template('First M. M. Last-Last', [
    spec(Role.FIRST, 3, 7),
    spec(Role.INITIAL, 1, 1),
    spec(Role.INITIAL, 1, 1),
    spec(Role.LAST, 3, 8),
    spec(Role.HYPHENATED_LAST, 3, 8),
  ]),
  template('First Middle Last-Last', [
    spec(Role.FIRST, 3, 7),
    spec(Role.MIDDLE, 3, 6),
    spec(Role.LAST, 3, 8),
    spec(Role.HYPHENATED_LAST, 3, 8),
  ]),
  template('First Middle Middle Last-Last', [
    spec(Role.FIRST, 3, 7),
    spec(Role.MIDDLE, 3, 6),
    spec(Role.MIDDLE, 3, 6),
    spec(Role.LAST, 3, 8),
    spec(Role.HYPHENATED_LAST, 3, 8),
  ]),
];

const MIN_LETTERS_FOR_HYPHEN = 16;

export function getTemplateByLabel(label) {
  const key = label.trim().toLowerCase();
  return TEMPLATES.find((t) => t.label.toLowerCase() === key) || null;
}

export function listTemplates() {
  return TEMPLATES.map((t) => ({
    label: t.label,
    min: t.totalMin,
    max: t.totalMax,
  }));
}

function customTemplate(nLetters) {
  if (nLetters <= 3) {
    return template('I. Last', [
      spec(Role.INITIAL, 1, 1),
      spec(Role.LAST, nLetters - 1, nLetters - 1),
    ]);
  }
  if (nLetters <= 5) {
    return template('First Last', [
      spec(Role.FIRST, 2, nLetters - 2),
      spec(Role.LAST, 2, nLetters - 2),
    ]);
  }
  const per = Math.floor(nLetters / 4);
  const rem = nLetters % 4;
  return template('First M. Last-Last', [
    spec(Role.FIRST, per, per + rem),
    spec(Role.INITIAL, 1, 1),
    spec(Role.LAST, per, per + 3),
    spec(Role.HYPHENATED_LAST, per, per + 3),
  ]);
}

/** Pick up to five templates that can hold this many letters. */
export function selectTemplates(nLetters, rng) {
  const viable = TEMPLATES.filter((t) => {
    if (t.totalMin > nLetters || nLetters > t.totalMax) return false;
    const hasHyphen = t.segments.some((s) => s.role === Role.HYPHENATED_LAST);
    if (hasHyphen && nLetters < MIN_LETTERS_FOR_HYPHEN) return false;
    return true;
  });

  if (!viable.length) return [customTemplate(nLetters)];
  return rng.shuffle(viable.slice()).slice(0, 5);
}

const capitalize = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

export function formatName(parts, tmpl) {
  const formatted = [];
  const n = Math.min(parts.length, tmpl.segments.length);

  for (let i = 0; i < n; i++) {
    const capped = capitalize(parts[i]);
    const role = tmpl.segments[i].role;

    if (role === Role.INITIAL) {
      formatted.push(capped[0] + '.');
    } else if (role === Role.HYPHENATED_LAST) {
      if (formatted.length) {
        formatted[formatted.length - 1] += '-' + capped;
      } else {
        formatted.push(capped);
      }
    } else {
      formatted.push(capped);
    }
  }

  return formatted.join(' ');
}

/** Rare cosmetic apostrophe on qualifying surnames (O'Brien-style). */
export function maybeAddApostrophe(parts, tmpl, rng) {
  const result = parts.slice();
  const n = Math.min(result.length, tmpl.segments.length);

  for (let i = 0; i < n; i++) {
    const seg = result[i];
    const role = tmpl.segments[i].role;
    if (
      (role === Role.LAST || role === Role.HYPHENATED_LAST) &&
      seg.length >= 4 &&
      seg[0] === 'o' &&
      !'aeiouy'.includes(seg[1]) &&
      rng.random() < 0.05
    ) {
      result[i] = seg[0] + "'" + seg.slice(1);
    }
  }
  return result;
}
