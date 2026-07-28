# kristenbestavros.github.io

Personal site. Astro, static output, deployed to GitHub Pages by GitHub Actions.
No backend, no database, no build service to pay for.

## Getting it running

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # writes static files to dist/
npm run preview  # serve the built output locally
```

Node 18 or newer.

## Deploying

1. Push this to `kristenbestavros.github.io` on the `main` branch.
2. In the repo: **Settings → Pages → Build and deployment → Source → GitHub Actions**.
3. Push anything to `main`. The workflow in `.github/workflows/deploy.yml` builds
   the site and publishes it.

First deploy takes a couple of minutes. After that, every push to `main` redeploys.

### Custom domain

Worth the ~$12/year. Once you have one:

1. Add a file `public/CNAME` containing just the bare domain, e.g. `kristenbestavros.com`
2. Change `site` in `astro.config.mjs` to `https://kristenbestavros.com`
3. Point the DNS at GitHub Pages, then set the domain under Settings → Pages.

## Editing

Almost everything you'll change day to day is in **`src/data/content.ts`**:
tagline, intro paragraphs, project list, publications, contact links.

| I want to change… | Edit |
| --- | --- |
| Your photo | replace `public/portrait.svg`, point `site.portrait` at it |
| Intro paragraphs, name, links | `src/data/content.ts` |
| Sidebar navigation | `nav` and `pageNav` in `src/data/content.ts` |
| Jobs and education | `experience` / `education` in `src/data/content.ts` |
| The project list | `projects` in `src/data/content.ts` |
| A project writeup | `src/pages/work/<slug>.astro` |
| Colors, type, spacing | `src/styles/global.css` (tokens at the top) |
| Your CV PDFs | replace the files in `public/cv/` |

Adding a project: add an entry to `projects`. Give it an `href` and create the
matching page under `src/pages/work/` only if it deserves a full writeup —
otherwise leave `href` off and it renders as a summary in the list.

## Layout

The site follows the sticky-sidebar structure of the
[Projects Portfolio](https://github.com/masoudsoleymani/projects-portfolio-template)
Astro theme (MIT): a fixed left column holding the portrait, name, contacts, and
navigation, with a scrolling right column of anchored sections. Below 62rem it
stacks into a single column with the sidebar acting as a header.

The homepage is one page of anchored sections (About, Experience, Projects,
Published, Elsewhere) with scroll-spy highlighting in the sidebar. Every other
page — `/work`, the project writeups, `/cv` — uses the same shell, so the
sidebar and navigation persist across the site.

The layout comes from that theme; the palette and typography are this site's
own. `global.css` includes a commented dark palette if you'd rather match the
original theme's dark default.

### Your photo

`public/portrait.svg` is a placeholder. Drop a real image in `public/` (square,
roughly 600×600, JPG or PNG is fine — it renders as a circle) and update
`site.portrait` in `src/data/content.ts`.

## The Anagrammer demo

`/work/anagrammer` runs a browser port of the [anagrammer](https://github.com/kristenbestavros/anagrammer)
CLI. It is a real port, not a lookalike: the Markov model, phonotactic rules,
name templates, composite scoring, and diversity selection are all ported, and
`scoreCandidate` agrees with the Python `score_candidate` to six decimal places.
The hill-climbing and syllable-swap refinement passes are deliberately not
ported — see the page copy, which says so.

Code lives in `src/scripts/anagrammer/`, mirroring the Python module layout:

| Browser | Python |
| --- | --- |
| `model.js` | `src/markov.py` |
| `phonotactics.js` | `src/phonotactics.py` |
| `templates.js` | `src/templates.py` |
| `solver.js` | `src/solver.py` (minus refinement) |
| `generator.js` | `src/generator.py` |
| `letterbag.js` | `src/letterbag.py` |
| `rng.js` | seeded stand-in for Python's `random` |

Generation runs in a Web Worker (`worker.js`) so a few hundred milliseconds of
search doesn't freeze the page.

### Updating the model

`public/data/anagram-data.json` (506 KB, ~157 KB gzipped) holds transition
counts for all seven model variants plus the English word filter. Counts rather
than log-probabilities, because integers compress better and the browser
reconstructs the identical smoothed distribution.

When you change the name data in the anagrammer repo, regenerate it:

```bash
python3 tools/export-model.py ../anagrammer
```

The script imports the anagrammer's own `MarkovModel`, so the export can't drift
from the CLI's training logic. If you change the *algorithm* — templates,
phonotactic rules, scoring weights — the JS needs the same edit by hand. That's
the standing cost of having two implementations.

## The Writing section

It's hidden. `site.showWriting` in `content.ts` is `false`, because a Writing
page with nothing on it is worse than no Writing page.

When you've written something: put the page at `src/pages/writing/<slug>.astro`,
set that essay's `draft` to `false` in `content.ts`, and flip `showWriting` to
`true`.

## Known gaps / next steps

- **Results explorer for the adversarial safety project.** The writeup has a
  `TODO` marking where it goes. Plan: export logged runs to a JSON file in
  `public/data/`, load it client-side, render the charts and a transcript
  stepper. No backend needed, so it still deploys on Pages.
- **Anagrammer refinement passes.** Hill-climbing and syllable swapping aren't
  ported to the browser. Worth doing only if the demo's output starts looking
  meaningfully worse than the CLI's.
- **Dark mode.** Not implemented. The palette is tokenized in `global.css`, so
  it's a `prefers-color-scheme` block away if you want it.
- **OG image.** No social preview image yet; links will unfurl as plain text.

## Notes on choices

- The hero transcript shows a redacted payload on purpose. Publishing a working
  jailbreak on a portfolio site is a bad look and worse practice, and the
  redaction communicates that you know it.
- The Anagrammer demo runs entirely in the browser — no API key, no server, no
  abuse surface. That's what makes it safe to have a live demo on a free static
  host.
