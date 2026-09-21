import { readFile } from "node:fs/promises";

const readJson = async (file: string): Promise<any> => JSON.parse(await readFile(file, "utf8"));
const exactKeys = (value: object, expected: string[], label: string): void => {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) {
    throw new Error(`${label} keys differ: expected ${wanted.join(", ")}; got ${actual.join(", ")}`);
  }
};

const fandomDocument = await readJson("public/v1/fandoms.json");
exactKeys(fandomDocument, ["schemaVersion", "source", "fandoms"], "fandom document");
exactKeys(fandomDocument.source, ["url", "etag", "lastModified", "schemaVersion"], "fandom source");
for (const [index, fandom] of fandomDocument.fandoms.entries()) {
  exactKeys(fandom, ["id", "name", "kind", "parentId", "alternateNames"], `fandom ${index}`);
}

const catalogDocument = await readJson("public/v1/catalog.json");
exactKeys(catalogDocument, ["schemaVersion", "sources", "event", "stats", "exhibitors"], "catalog document");
exactKeys(catalogDocument.sources, ["catalog", "fandomDirectory"], "catalog sources");
exactKeys(catalogDocument.sources.catalog, ["url", "downloadedAt"], "catalog source");
exactKeys(catalogDocument.sources.fandomDirectory, ["url", "etag", "lastModified", "schemaVersion"], "catalog fandom source");
exactKeys(catalogDocument.event, ["id", "name", "series", "edition", "days"], "event");
exactKeys(catalogDocument.event.series, ["id", "name"], "event series");
for (const [index, day] of catalogDocument.event.days.entries()) {
  exactKeys(day, ["id", "label"], `event day ${index}`);
}
exactKeys(catalogDocument.stats, ["exhibitors", "fandomsReferenced"], "catalog stats");
for (const [index, exhibitor] of catalogDocument.exhibitors.entries()) {
  exactKeys(exhibitor, ["id", "name", "spaces", "attendanceDates", "contentRating", "offerings", "assets", "links", "fandomIds"], `exhibitor ${index}`);
  for (const [spaceIndex, space] of exhibitor.spaces.entries()) exactKeys(space, ["code", "type"], `exhibitor ${index} space ${spaceIndex}`);
  exactKeys(exhibitor.assets, ["thumbnail", "gallery"], `exhibitor ${index} assets`);
  for (const [linkIndex, link] of exhibitor.links.entries()) exactKeys(link, ["type", "url"], `exhibitor ${index} link ${linkIndex}`);
}

console.log("Published payloads match the CF23 API schema.");
