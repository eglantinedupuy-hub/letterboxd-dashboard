// Copies the pipeline's JSON summaries into web/public/data so the site can read them.
//
//   npm run sync-data   -> copies from ../data/processed
//
// Runs automatically before `npm run dev` (see "predev" in package.json).
import { cpSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";

const webDir = path.resolve(import.meta.dirname, "..");
const source = path.resolve(webDir, process.env.DATA_DIR ?? "../data/processed");
const target = path.join(webDir, "public", "data");

if (!existsSync(source)) {
  console.error(`sync-data: source folder not found: ${source}`);
  console.error("Run the pipeline first: python pipeline/process_letterboxd.py --input data/raw --out data/processed");
  process.exit(1);
}

mkdirSync(target, { recursive: true });
const files = readdirSync(source).filter((f) => f.endsWith(".json"));
for (const f of files) cpSync(path.join(source, f), path.join(target, f));
console.log(`sync-data: copied ${files.length} file(s) from ${path.relative(webDir, source)} to public/data`);
