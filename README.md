# AmountHub

Static material and project calculators hosted on GitHub Pages at https://amounthub.com/. The homepage introduces the tools. Gravel lives at `/gravel-calculator/`; the existing topsoil tool remains at `/soil-calculator/` to preserve its established URL.

## Run locally

`python3 -m http.server 8000` from this directory, then open http://localhost:8000/. No build step or dependencies are required.

## Publishing

GitHub Pages serves the `main` branch. Keep `CNAME`, `ads.txt`, `robots.txt`, the AdSense script and canonical URLs intact. Update `sitemap.xml` when adding a public page. Calculator inputs run in the browser.

## Checking changes

Run `python3 tests/site_check.py` for internal links, canonical and sitemap checks. Run `node tests/calculators.test.mjs` for numerical cases and invalid inputs if Chromium is available locally.
