import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";

const mode = process.argv[2] || "remote";
const baseUrl = mode === "local" ? "http://127.0.0.1:4173/" : "https://valentime.noomoagency.com/";
const outDir = join("reports", "screenshots", mode);
const executablePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const requests = [];
const events = [];

async function screenshot(page, name) {
  await page.screenshot({ path: join(outDir, `${name}.png`), fullPage: false });
}

async function clickText(page, text) {
  const locator = page.getByText(text, { exact: false }).first();
  if (await locator.count()) {
    await locator.click({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(800);
  }
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });

  page.on("request", (request) => {
    requests.push({ method: request.method(), url: request.url(), resourceType: request.resourceType() });
  });
  page.on("response", (response) => {
    const item = requests.findLast((entry) => entry.url === response.url());
    if (item) item.status = response.status();
  });
  page.on("console", (message) => {
    events.push({ type: "console", level: message.type(), text: message.text() });
  });
  page.on("pageerror", (error) => {
    events.push({ type: "pageerror", message: error.message, stack: error.stack });
  });

  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(5000);
  await screenshot(page, "01-initial-loading");
  await page.waitForTimeout(3500);
  await screenshot(page, "02-hero-portal");

  for (const y of [1400, 3400, 6200, 9000, 12200]) {
    await page.evaluate((target) => window.scrollTo({ top: target, behavior: "instant" }), y);
    await page.waitForTimeout(1200);
  }
  await screenshot(page, "03-story-scroll");

  await clickText(page, "sound");
  await screenshot(page, "04-sound-toggle");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(2500);
  await clickText(page, "menu");
  await screenshot(page, "05-menu");

  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(2500);
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight - window.innerHeight - 100, behavior: "instant" }));
  await page.waitForTimeout(2000);
  await clickText(page, "create");
  await clickText(page, "custom");
  await screenshot(page, "06-heart-customizer");

  await writeFile(join("reports", `${mode}-network.json`), `${JSON.stringify(requests, null, 2)}\n`);
  await writeFile(join("reports", `${mode}-events.json`), `${JSON.stringify(events, null, 2)}\n`);
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
