// Copies the pipeline's JSON (data/processed/*.json + data/favourites.json) into web/src/data,
// where the site imports it. Commit web/src/data: that's what Vercel builds from.
//
//   npm run sync-data        (also runs automatically before `npm run dev` and `npm run build`)
import { copyFileSync, existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const webDir = path.resolve(import.meta.dirname, "..");
const source = path.resolve(webDir, process.env.DATA_DIR ?? "../data/processed");
const favourites = path.resolve(webDir, "../data/favourites.json");
const target = path.join(webDir, "src", "data");
mkdirSync(target, { recursive: true });

if (existsSync(source)) {
  const files = readdirSync(source).filter((f) => f.endsWith(".json"));
  for (const f of files) copyFileSync(path.join(source, f), path.join(target, f));
  if (existsSync(favourites)) copyFileSync(favourites, path.join(target, "favourites.json"));
  console.log(`sync-data: copied ${files.length} file(s) from ${path.relative(webDir, source)} to src/data`);
} else {
  // e.g. on Vercel if only the web/ folder is available: use the committed copies in src/data
  console.log(`sync-data: ${source} not found, using the committed files in src/data`);
}

// Optional files: create empty placeholders so the site still builds without them
const placeholders = { "reviews.json": "[]", "tmdb.json": "{}", "favourites.json": "[]" };
for (const [name, empty] of Object.entries(placeholders)) {
  if (!existsSync(path.join(target, name))) writeFileSync(path.join(target, name), empty);
}
