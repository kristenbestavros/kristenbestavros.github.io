#!/usr/bin/env python3
"""Export the Anagrammer's trained models for the browser demo.

Reads the name data from a checkout of the anagrammer repo, trains the models
using *that repo's own* MarkovModel class, and writes the transition counts to
a JSON file the web demo loads at runtime.

Counts are exported rather than log-probabilities for two reasons: integers
compress far better than floats, and the browser can reconstruct the exact
same Laplace-smoothed log-probs, so the demo and the CLI agree.

Usage:
    python3 tools/export-model.py ../anagrammer

Writes to public/data/anagram-data.json
"""

import json
import os
import sys

OUT_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "public",
    "data",
    "anagram-data.json",
)


def read_lines(path):
    with open(path, encoding="utf-8") as f:
        return [line.strip() for line in f if line.strip()]


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    repo = os.path.abspath(sys.argv[1])
    data_dir = os.path.join(repo, "data")
    if not os.path.isdir(data_dir):
        print(f"No data/ directory found in {repo}", file=sys.stderr)
        sys.exit(1)

    # Use the anagrammer's own model class so the export can never drift from
    # the CLI's training logic.
    sys.path.insert(0, repo)
    from src.generator import BLOCKED_WORDS
    from src.markov import MarkovModel

    male = read_lines(os.path.join(data_dir, "male_first.txt"))
    female = read_lines(os.path.join(data_dir, "female_first.txt"))
    surnames = read_lines(os.path.join(data_dir, "surnames.txt"))
    words = read_lines(os.path.join(data_dir, "english_words.txt"))

    # The generator picks a model per segment role: first names for FIRST,
    # surnames for LAST/HYPHENATED_LAST, combined for MIDDLE and mononyms.
    corpora = {
        "first_both": male + female,
        "first_male": male,
        "first_female": female,
        "surname": surnames,
        "combined_both": male + female + surnames,
        "combined_male": male + surnames,
        "combined_female": female + surnames,
    }

    models = {}
    for key, names in corpora.items():
        model = MarkovModel()
        model.train(names)
        models[key] = {ctx: dict(counter) for ctx, counter in model.transitions.items()}
        print(f"  {key}: {len(names):,} names, {len(models[key])} contexts")

    payload = {
        "order": MarkovModel.ORDER,
        "start": MarkovModel.START,
        "end": MarkovModel.END,
        "counts": models,
        "englishWords": sorted(w.lower() for w in words),
        "blockedWords": sorted(BLOCKED_WORDS),
        "attribution": "Name data from Kate Monk's Onomastikon (c) 1997 Kate Monk",
    }

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(payload, f, separators=(",", ":"))

    size = os.path.getsize(OUT_PATH)
    print(f"\nWrote {OUT_PATH} ({size / 1024:.0f} KB, gzips to roughly a third)")


if __name__ == "__main__":
    main()
