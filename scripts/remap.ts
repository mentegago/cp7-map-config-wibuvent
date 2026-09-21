import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

const catalogUrl = "https://cardinal.wibuvent.com/api/v1/events/comipara-7/catalog.json";
const fandomsUrl = "https://cardinal.wibuvent.com/api/v1/fandoms.json";
const root = process.cwd();

interface CardinalFandom {
  id: number;
  name: string;
  kind: string;
  parentId: number | null;
  aliases: string[];
  alternateNames: string[];
}

interface CardinalFandoms {
  fandoms: CardinalFandom[];
  ignored: string[];
}

interface CardinalCatalog {
  schemaVersion: string;
  stats: { exhibitors: number; fandomsReferenced: number };
  exhibitors: Array<Record<string, unknown>>;
}

async function fetchJson<T>(url: string): Promise<{ body: string; value: T }> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(180_000),
      });
      if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}: ${await response.text()}`);
      const body = await response.text();
      return { body: body.endsWith("\n") ? body : `${body}\n`, value: JSON.parse(body) as T };
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 5_000));
    }
  }
  throw lastError;
}

async function writeAtomic(file: string, body: string): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.tmp`;
  await writeFile(temporary, body);
  await rename(temporary, file);
}

const [{ body: rawCatalog, value: cardinalCatalog }, { body: rawFandoms, value: cardinalFandoms }] = await Promise.all([
  fetchJson<CardinalCatalog>(catalogUrl),
  fetchJson<CardinalFandoms>(fandomsUrl),
]);
const downloadedAt = new Date().toISOString();
const fandomSource = {
  url: fandomsUrl,
  etag: null,
  lastModified: null,
  schemaVersion: "1.0.0",
};

const catalog = {
  schemaVersion: "1.0.0",
  sources: {
    catalog: { url: catalogUrl, downloadedAt },
    fandomDirectory: fandomSource,
  },
  event: {
    id: "comipara-7",
    name: "Comipara 7",
    series: { id: "comipara", name: "Comipara" },
    edition: 7,
    days: [
      { id: "2026-10-17", label: "Saturday" },
      { id: "2026-10-18", label: "Sunday" },
    ],
  },
  stats: cardinalCatalog.stats,
  exhibitors: cardinalCatalog.exhibitors,
};
const fandoms = {
  schemaVersion: "1.0.0",
  source: fandomSource,
  fandoms: cardinalFandoms.fandoms.map(({ id, name, kind, parentId, alternateNames }) => ({
    id,
    name,
    kind,
    parentId,
    alternateNames,
  })),
};

await writeAtomic(path.join(root, "data/raw/catalog.json"), rawCatalog);
await writeAtomic(path.join(root, "data/raw/fandoms.json"), rawFandoms);
await writeAtomic(path.join(root, "public/v1/catalog.json"), `${JSON.stringify(catalog)}\n`);
await writeAtomic(path.join(root, "public/v1/fandoms.json"), `${JSON.stringify(fandoms)}\n`);

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
  lastUpdated: downloadedAt,
}, null, 2)}\n`);

console.log("Published Cardinal catalog and fandoms for Comipara 7.");
