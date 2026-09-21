# Comipara 7 Map Config

This repository is the Wibuvent-backed Comipara 7 map data source. It accepts Cardinal's canonical data directly: there is no `fandoms.directory` dependency, mapping workflow, alias resolution, or submission flow here.

The refresh script downloads both sources:

- Catalog: `https://cardinal.wibuvent.com/api/v1/events/comipara-7/catalog.json`
- Fandoms: `https://cardinal.wibuvent.com/api/v1/fandoms.json`

The downloaded Cardinal JSON is stored unchanged in `data/raw/`. The published documents at `public/v1/` retain the existing CF23 API schema exactly, while using Cardinal's canonical exhibitor data and Comipara 7 metadata. Cardinal already provides canonical `fandomIds`, so fandoms are never remapped locally.

Run locally with Bun 1.3 or newer:

```sh
bun install
bun run typecheck
bun run build
```

The GitHub Actions workflow refreshes both Cardinal documents every six hours and deploys `public/` to GitHub Pages.
