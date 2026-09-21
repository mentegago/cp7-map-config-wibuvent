# Comipara 7 Map Config

This repository is the Wibuvent-backed Comipara 7 map data source. It accepts Cardinal's canonical data directly: there is no `fandoms.directory` dependency, mapping workflow, alias resolution, or submission flow here.

The refresh script downloads both sources:

- Catalog: `https://cardinal.wibuvent.com/api/v1/events/comipara-7/catalog.json`
- Fandoms: `https://cardinal.wibuvent.com/api/v1/fandoms.json`

The downloaded JSON is stored in `data/raw/` and copied unchanged to the GitHub Pages API at `public/v1/`. Cardinal already provides canonical `fandomIds`, so the catalog is never remapped locally.

Run locally with Bun 1.3 or newer:

```sh
bun install
bun run typecheck
bun run build
```

The GitHub Actions workflow refreshes both Cardinal documents every six hours and deploys `public/` to GitHub Pages.
