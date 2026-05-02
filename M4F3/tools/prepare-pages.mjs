import fs from 'node:fs';
import path from 'node:path';

const distDir = path.resolve('dist');
const basePath = (process.env.PAGES_BASE_PATH || '/2Y92/M4F3').replace(/\/+$/, '');
const assetRoot = `${basePath}/assets/`;
const textExtensions = new Set(['.css', '.html', '.js', '.json', '.svg', '.txt', '.webmanifest']);

const legacyNuxtDir = path.resolve('public/assets/_nuxt');
const legacyAssetDir = path.join(distDir, 'assets');
if (fs.existsSync(legacyNuxtDir)) {
  fs.mkdirSync(legacyAssetDir, { recursive: true });
  for (const entry of fs.readdirSync(legacyNuxtDir, { withFileTypes: true })) {
    if (entry.isFile()) {
      fs.copyFileSync(path.join(legacyNuxtDir, entry.name), path.join(legacyAssetDir, entry.name));
    }
  }
}

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(fullPath);
    } else {
      yield fullPath;
    }
  }
}

if (!fs.existsSync(distDir)) {
  throw new Error('dist directory does not exist. Run vite build before prepare-pages.');
}

for (const filePath of walk(distDir)) {
  if (!textExtensions.has(path.extname(filePath))) continue;

  const original = fs.readFileSync(filePath, 'utf8');
  let updated = original
    .replace(/(?<!\/2Y92\/M4F3)\/assets\//g, assetRoot)
    .replaceAll('url(2Y92/M4F3/assets/', `url(${assetRoot}`)
    .replaceAll('"2Y92/M4F3/assets/', `"${assetRoot}`)
    .replaceAll("'2Y92/M4F3/assets/", `'${assetRoot}`)
    .replaceAll('`2Y92/M4F3/assets/', `\`${assetRoot}`)
    .replaceAll('return"/"+s', `return s.startsWith("./")?"${assetRoot}"+s.slice(2):s.startsWith("assets/")?"${basePath}/"+s:s.startsWith("/")?"${basePath}"+s:"${basePath}/"+s`)
    .replace(
      /const ([A-Za-z_$][\w$]*)=\{"Bourbon 64\.CUBE":null,"Chemical 168\.CUBE":null,"Clayton 33\.CUBE":null,"Cubicle 99\.CUBE":null,"Remy 24\.CUBE":null,"Presetpro-Cinematic\.3dl":null,NeutralLUT:null,"B&WLUT":null,NightLUT:null\}/g,
      'const $1={"Bourbon 64.CUBE":null}'
    );

  while (updated.includes(`${basePath}${basePath}/assets/`)) {
    updated = updated.replaceAll(`${basePath}${basePath}/assets/`, assetRoot);
  }

  if (updated !== original) {
    fs.writeFileSync(filePath, updated);
  }
}

fs.writeFileSync(path.join(distDir, '.nojekyll'), '');
