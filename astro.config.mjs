// @ts-check
import { defineConfig } from 'astro/config';

// This repo is a GitHub *user* site (kristenbestavros.github.io), so the site
// is served from the root path. No `base` needed.
// If you later point a custom domain at it, change `site` to that domain and
// add a `public/CNAME` file containing the bare domain.
export default defineConfig({
  site: 'https://kristen.bestavros.net',
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
  },
});
