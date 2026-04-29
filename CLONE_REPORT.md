# Clone Report

Target: `https://valentime.noomoagency.com/`  
Capture date: 2026-04-29

## Summary

The public-facing Valentime experience was reconstructed locally by preserving the exposed Nuxt runtime bundles and downloading public static assets. The local app is served by Vite and rewrites original absolute paths such as `/_nuxt`, `/images`, `/models`, `/audio`, `/hdri`, `/luts`, and `/textures` to local assets.

## Downloaded Assets

Assets are stored under `public/assets`.

- Nuxt JavaScript chunks and CSS, including the main runtime bundle and lazy route/customizer chunks.
- Fonts: `de-lionist.Cc7Nj_xB.otf` and `ProximaNovaExCn-Light.BAeW1Xzc.woff2`.
- Images and SVGs: logo, sound icons, button texture, material/color/frame/sticker thumbnails, mobile/contact title assets, Open Graph image, favicon.
- 3D assets: GLB models for the story scene, mobile scene, customizer heart/object flows, error scene, and personal objects.
- Draco decoder files: `draco_wasm_wrapper.js` and `draco_decoder.wasm`.
- Environment/post-processing assets: HDR file, LUT cube file, water/normal textures.
- Audio: background and interaction MP3 files.

The generated manifest is `reports/asset-manifest.json`.

## Technologies Detected

- Nuxt/Vue runtime, delivered as prerendered HTML plus hashed `_nuxt` bundles.
- Vite-style module preload/chunk loading in the generated bundle.
- Three.js/WebGL/WebGPU-related runtime code for the 3D scenes.
- Draco-compressed GLB loading.
- GSAP-style scroll/animation behavior in bundled runtime code.
- Google Tag Manager/Analytics on the remote site. It is disabled locally.

## Source Maps

No public `sourceMappingURL` references were found in the downloaded HTML, CSS, or JavaScript bundles. Original source modules were therefore not recovered. The local project should be treated as a bundled runtime reconstruction, not a source-level clone.

## Exact Runtime Copies

The following are preserved from public responses, with only path/config rewrites:

- `index.html` prerendered HTML shell.
- Public `_nuxt` JavaScript and CSS bundles.
- Public fonts, images, SVGs, audio, HDR/LUT/texture files, GLB models, Draco WASM/wrapper files.
- Nuxt payload/build metadata.

## Reconstructed Parts

- Local Vite project scaffolding and npm scripts.
- `tools/mirror.mjs` to download and rewrite public assets.
- `tools/capture.mjs` and `tools/compare-screenshots.mjs` for verification.
- Local asset path rewrites to run from `public/assets`.
- A compatibility copy of `public/_payload.json`, because the Nuxt runtime still requests the bare payload path.
- Google Tag Manager config is disabled locally to avoid remote analytics calls.

## Missing Or Blocked Assets

The mirror reports eight 404s that came from minified template-string false positives, not observed concrete network requests:

- `/luts/${R}.png`
- `/luts/${et}.png`
- `/luts/${U}.png`
- `/luts/${f}.png`
- `/images/stickers/${j}.png`
- `/images/stickers/${G}.png`
- `/models/${j}.glb`
- `/models/${G}.glb`

External social/profile links remain external. Any backend share-generation API, if present behind user interaction beyond the public runtime flow, was not reproduced.

## Verification Notes

Playwright captured remote and local states for:

- Initial loading.
- Hero portal.
- Story scroll section.
- Sound toggle.
- Mobile menu.
- Heart customizer area.

Local request logs show no `valentime.noomoagency.com`, Google Tag Manager, Google Analytics, or 404 requests during the final capture. Screenshots are in `reports/screenshots/remote` and `reports/screenshots/local`; comparison metadata is in `reports/screenshot-comparison.json`.

During local Playwright navigation, the runtime emitted a non-fatal SVG `viewBox` warning inherited from the public HTML and an intermittent `I.resize is not a function` page error during viewport/navigation transitions. The main 3D visual experience still rendered locally in the captured hero, scroll, sound, and customizer states.
