# Noomo Valentime Local Reconstruction

This repository is an authorized archival reconstruction of the public site at `https://valentime.noomoagency.com/`.

The local version preserves the public Nuxt runtime bundles and downloaded public assets, then rewrites asset paths so the experience runs from a local Vite static server.

## Setup

```bash
npm install
```

## Run

```bash
npm run dev
```

Vite will print the local URL, usually:

```text
http://127.0.0.1:5173/
```

## Build And Preview

```bash
npm run build
npm run preview
```

## Refresh The Public Mirror

```bash
npm run mirror
```

This re-downloads public static files from `https://valentime.noomoagency.com/`, writes the runtime entry to `index.html`, and stores public assets under `public/assets`.

## Verification

```bash
npm run capture:remote
npm run capture:local
npm run compare
```

The capture scripts use Playwright with the installed Microsoft Edge executable. Captured screenshots and request logs are written to `reports/`.

## Limitations

Source maps were not publicly exposed, so this is not a source-level clone. It is a local runtime reconstruction from public HTML, bundled JavaScript/CSS, and public assets.

External links for Noomo, social profiles, and any remote-only sharing or analytics behavior are not locally reproduced. Google Tag Manager is disabled in the local Nuxt config for offline operation.
