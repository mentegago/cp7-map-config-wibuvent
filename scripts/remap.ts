import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

const catalogUrl = "https://cardinal.wibuvent.com/api/v1/events/comipara-7/catalog.json";
const fandomsUrl = "https://cardinal.wibuvent.com/api/v1/fandoms.json";
const root = process.cwd();

async function fetchJson(url: string): Promise<string> {
  const response = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}: ${await response.text()}`);
  const body = await response.text();
  JSON.parse(body);
  return body.endsWith("\n") ? body : `${body}\n`;
}

async function writeAtomic(file: string, body: string): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.tmp`;
  await writeFile(temporary, body);
  await rename(temporary, file);
}

const [catalog, fandoms] = await Promise.all([fetchJson(catalogUrl), fetchJson(fandomsUrl)]);

await writeAtomic(path.join(root, "data/raw/catalog.json"), catalog);
await writeAtomic(path.join(root, "data/raw/fandoms.json"), fandoms);
await writeAtomic(path.join(root, "public/v1/catalog.json"), catalog);
await writeAtomic(path.join(root, "public/v1/fandoms.json"), fandoms);

const previousLastUpdated = await readFile(path.join(root, "public/last-updated.json"), "utf8")
  .then((value) => JSON.parse(value) as Record<string, unknown>)
  .catch(() => ({}));
await writeAtomic(path.join(root, "public/manifest.json"), `${JSON.stringify({
  schemaVersion: "1.0.0",
  event: { id: "comipara-7", name: "Comipara 7" },
  sources: { catalog: catalogUrl, fandoms: fandomsUrl },
  catalog: "v1/catalog.json",
  fandomRegistry: "v1/fandoms.json",
}, null, 2)}\n`);
await writeAtomic(path.join(root, "public/last-updated.json"), `${JSON.stringify({
  ...previousLastUpdated,
  lastUpdated: new Date().toISOString(),
}, null, 2)}\n`);

console.log("Published Cardinal catalog and fandoms for Comipara 7.");
