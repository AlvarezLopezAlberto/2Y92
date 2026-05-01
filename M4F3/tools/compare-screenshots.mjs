import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const remoteDir = join("reports", "screenshots", "remote");
const localDir = join("reports", "screenshots", "local");

async function main() {
  const remote = await readdir(remoteDir).catch(() => []);
  const local = await readdir(localDir).catch(() => []);
  const rows = [];

  for (const file of remote.filter((name) => name.endsWith(".png"))) {
    if (!local.includes(file)) {
      rows.push({ file, status: "missing-local" });
      continue;
    }
    const [a, b] = await Promise.all([readFile(join(remoteDir, file)), readFile(join(localDir, file))]);
    rows.push({
      file,
      status: a.equals(b) ? "byte-identical" : "captured-for-manual-visual-review",
      remoteBytes: a.length,
      localBytes: b.length,
    });
  }

  await writeFile(join("reports", "screenshot-comparison.json"), `${JSON.stringify(rows, null, 2)}\n`);
  console.log(rows);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
