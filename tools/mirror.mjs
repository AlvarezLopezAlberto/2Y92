import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, extname, join } from "node:path";

const ORIGIN = "https://valentime.noomoagency.com";
const OUT_DIR = "public";
const ASSET_ROOT = "assets";
const REPORT_DIR = "reports";

const assetPrefixes = [
  "/_nuxt/",
  "/images/",
  "/models/",
  "/hdri/",
  "/luts/",
  "/textures/",
  "/sounds/",
  "/audio/",
  "/videos/",
  "/fav.png",
  "/OGimage.jpg",
  "/_payload.json",
];

const textExtensions = new Set([
  ".html",
  ".js",
  ".mjs",
  ".css",
  ".json",
  ".svg",
  ".txt",
  ".map",
]);

const pending = new Set(["/"]);
[
  "/luts/Bourbon%2064.CUBE",
  "/models/draco_wasm_wrapper.js",
  "/models/draco_decoder.wasm",
].forEach((path) => pending.add(path));
const downloaded = new Map();
const failed = [];

function normalizePath(value) {
  if (!value || value.startsWith("data:") || value.startsWith("blob:")) return null;
  let url;
  try {
    url = new URL(value, ORIGIN);
  } catch {
    return null;
  }
  if (url.origin !== ORIGIN) return null;
  const path = `${url.pathname}${url.search || ""}`;
  if (path === "/" || assetPrefixes.some((prefix) => path.startsWith(prefix))) return path;
  return null;
}

function localAssetPath(remotePath) {
  if (remotePath === "/") return "index.html";
  const url = new URL(remotePath, ORIGIN);
  const cleanPath = decodeURIComponent(url.pathname.replace(/^\/+/, ""));
  const suffix = url.search ? `.${url.search.replace(/^\?/, "").replace(/[^a-zA-Z0-9._-]/g, "_")}` : "";
  return join(OUT_DIR, ASSET_ROOT, `${cleanPath}${suffix}`);
}

function publicAssetUrl(remotePath) {
  if (remotePath === "/") return "/";
  const url = new URL(remotePath, ORIGIN);
  const cleanPath = url.pathname.replace(/^\/+/, "");
  const suffix = url.search ? `.${url.search.replace(/^\?/, "").replace(/[^a-zA-Z0-9._-]/g, "_")}` : "";
  return `/assets/${cleanPath}${suffix}`;
}

function discover(text, basePath = "/") {
  const patterns = [
    /(?:src|href|content|data-src)=["']([^"']+)["']/g,
    /url\((["']?)([^"')]+)\1\)/g,
    /["'`]((?:\/|https:\/\/valentime\.noomoagency\.com\/)(?:_nuxt|images|models|hdri|luts|textures|sounds|audio|videos)\/[^"'`\s)]+)["'`]/g,
    /["'`](\.\/[^"'`\s)]+\.(?:js|css|json|wasm|hdr|cube|jpg|png|glb))["'`]/gi,
    /["'`](\/(?:fav\.png|OGimage\.jpg|_payload\.json)[^"'`\s)]*)["'`]/g,
    /sourceMappingURL=([^\s]+)/g,
  ];

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const raw = match[2] || match[1];
      const candidate = raw.startsWith("./")
        ? new URL(raw, new URL(basePath, ORIGIN)).pathname
        : raw;
      const normalized = normalizePath(candidate);
      if (normalized && !downloaded.has(normalized)) pending.add(normalized);
    }
  }
}

function rewriteText(text) {
  let next = text.replaceAll(ORIGIN, "");

  const paths = [...downloaded.keys()].sort((a, b) => b.length - a.length);
  for (const remotePath of paths) {
    if (remotePath === "/") continue;
    next = next.replaceAll(remotePath, publicAssetUrl(remotePath));
  }

  next = next
    .replaceAll('href="/_nuxt/', 'href="/assets/_nuxt/')
    .replaceAll('src="/_nuxt/', 'src="/assets/_nuxt/')
    .replaceAll('href="/images/', 'href="/assets/images/')
    .replaceAll('src="/images/', 'src="/assets/images/')
    .replaceAll('url(/_nuxt/', 'url(/assets/_nuxt/')
    .replaceAll('url(/images/', 'url(/assets/images/')
    .replaceAll('url(../assets/', 'url(/assets/')
    .replaceAll('"/_nuxt/', '"/assets/_nuxt/')
    .replaceAll("'/_nuxt/", "'/assets/_nuxt/")
    .replaceAll('"/images/', '"/assets/images/')
    .replaceAll("'/images/", "'/assets/images/")
    .replaceAll('"/models/', '"/assets/models/')
    .replaceAll("'/models/", "'/assets/models/")
    .replaceAll('"/hdri/', '"/assets/hdri/')
    .replaceAll("'/hdri/", "'/assets/hdri/")
    .replaceAll('"/luts/', '"/assets/luts/')
    .replaceAll("'/luts/", "'/assets/luts/")
    .replaceAll('"/textures/', '"/assets/textures/')
    .replaceAll("'/textures/", "'/assets/textures/")
    .replaceAll('"/fav.png"', '"/assets/fav.png"')
    .replaceAll('"/OGimage.jpg"', '"/assets/OGimage.jpg"')
    .replaceAll('baseURL:"/"', 'baseURL:"/"')
    .replaceAll('buildAssetsDir:"/_nuxt/"', 'buildAssetsDir:"/assets/_nuxt/"')
    .replaceAll('gtag:{enabled:true', 'gtag:{enabled:false')
    .replaceAll('id:"G-DS2Y30NGYE"', 'id:""')
    .replaceAll('url:"https://www.googletagmanager.com/gtag/js"', 'url:""');

  return next;
}

async function downloadOne(remotePath) {
  const url = new URL(remotePath, ORIGIN).toString();
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  const contentType = response.headers.get("content-type") || "";
  const buffer = Buffer.from(await response.arrayBuffer());
  const outputPath = localAssetPath(remotePath);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, buffer);
  if (new URL(remotePath, ORIGIN).pathname === "/_payload.json") {
    await writeFile(join(OUT_DIR, "_payload.json"), buffer);
  }
  downloaded.set(remotePath, { outputPath, contentType, bytes: buffer.length });

  const ext = extname(new URL(remotePath, ORIGIN).pathname).toLowerCase();
  if (textExtensions.has(ext) || contentType.includes("text") || contentType.includes("json") || contentType.includes("javascript")) {
    const text = buffer.toString("utf8");
    discover(text, remotePath);
  }
}

async function rewriteDownloadedTextFiles() {
  for (const [remotePath, info] of downloaded.entries()) {
    const ext = extname(new URL(remotePath, ORIGIN).pathname).toLowerCase();
    if (textExtensions.has(ext) || info.contentType.includes("text") || info.contentType.includes("json") || info.contentType.includes("javascript")) {
      const original = await readFile(info.outputPath, "utf8");
      await writeFile(info.outputPath, rewriteText(original));
    }
  }
}

async function main() {
  await mkdir(join(OUT_DIR, ASSET_ROOT), { recursive: true });
  await mkdir(REPORT_DIR, { recursive: true });

  while (pending.size) {
    const [remotePath] = pending;
    pending.delete(remotePath);
    if (downloaded.has(remotePath)) continue;

    try {
      console.log(`download ${remotePath}`);
      await downloadOne(remotePath);
    } catch (error) {
      failed.push({ remotePath, error: error.message });
      console.warn(`failed ${remotePath}: ${error.message}`);
    }
  }

  await rewriteDownloadedTextFiles();

  const manifest = {
    origin: ORIGIN,
    generatedAt: new Date().toISOString(),
    downloaded: Object.fromEntries(downloaded),
    failed,
  };
  await writeFile(join(REPORT_DIR, "asset-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`downloaded ${downloaded.size} files, failed ${failed.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
