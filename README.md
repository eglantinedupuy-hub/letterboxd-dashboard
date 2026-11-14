# Letterboxd Film Dashboard

A personal dashboard of my Letterboxd film diary: what I watch, how I rate, and when.

> Python (data pipeline) + Next.js (dashboard), hosted on Vercel. Not affiliated with Letterboxd.

## Run it (Windows, PowerShell)
```powershell
# 1. Turn the export into JSON (only needed when the export changes)
python pipeline/process_letterboxd.py --input data/raw --out data/processed --include-reviews

# 1b. Optional extras (need `pip install -r pipeline/requirements.txt` and a .env file, see .env.example)
python pipeline/enrich_tmdb.py   # posters, genres, runtime, directors, where to watch (TMDB key needed)
python pipeline/fetch_rss.py     # add my latest diary entries from my Letterboxd RSS feed

# 2. First time only: install the website's packages
cd web
npm install

# 3. Start the website
npm run dev
```
Then open **http://127.0.0.1:3001** (port 3001, so it can run at the same time as the Spotify dashboard on 3000).

## Settings
Challenge goal, favourite films and the "where to watch" region are in `web/src/config.ts`.

## Update with a fresh export
Letterboxd → Settings → Data → Export your data. Unzip it into `data/raw/` (replace the old files), then run step 1 again.

## Structure
```
AGENTS.md         rules for AI agents (Cursor reads this; CLAUDE.md points to it)
.cursor/rules/    extra Cursor rules
docs/PLAN.md      roadmap + checklist
pipeline/         process_letterboxd.py
data/raw/         my export (never uploaded)
data/processed/   JSON the website reads
web/              the Next.js website
```
