import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const locales = ["en", "es"];

function collectKeys(value, prefix = "") {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return child && typeof child === "object" && !Array.isArray(child)
      ? collectKeys(child, path)
      : [path];
  });
}

const keySets = new Map();
for (const locale of locales) {
  const source = await readFile(resolve(root, "locales", `${locale}.json`), "utf8");
  keySets.set(locale, new Set(collectKeys(JSON.parse(source))));
}

const [english, spanish] = locales.map((locale) => keySets.get(locale));
const missingInSpanish = [...english].filter((key) => !spanish.has(key)).sort();
const missingInEnglish = [...spanish].filter((key) => !english.has(key)).sort();

if (missingInSpanish.length || missingInEnglish.length) {
  if (missingInSpanish.length) console.error(`Missing in es: ${missingInSpanish.join(", ")}`);
  if (missingInEnglish.length) console.error(`Missing in en: ${missingInEnglish.join(", ")}`);
  process.exitCode = 1;
} else {
  console.log(`Locale key sets match (${english.size} keys).`);
}
