# AGENTS.md — Letterboxd Film Dashboard

Instructions for any AI coding agent (Cursor, Claude Code, etc.) working in this repo.
Read this file fully before making changes. The roadmap lives in `docs/PLAN.md`.

## What this project is
A personal dashboard of Eglantine's Letterboxd film diary, built as a portfolio piece.
Sister project of `spotify-dashboard` (same stack and conventions).
- Visitors browse charts built from pre-computed JSON. No login, no live API.
- Personal, non-commercial. Low maintenance is fine.

## Stack
- `pipeline/` — **Python 3** (standard library only) turns the Letterboxd CSV export into JSON summaries.
- `web/` — **Next.js 16 (App Router) + TypeScript + Tailwind CSS 4**, charts with **Recharts 3**.
- Hosting: **Vercel** (Hobby), code on **GitHub**. Owner develops on **Windows** (PowerShell).

## Directory map
```
data/raw/          # Letterboxd export (CSVs). GITIGNORED. Never commit.
data/processed/    # JSON summaries from the pipeline. Committed (public info anyway, no review text).
pipeline/          # process_letterboxd.py
web/               # Next.js app; `npm run sync-data` copies data/processed -> web/src/data (committed; imported by the site)
docs/PLAN.md       # roadmap + checklist
```

## Commands
- Process export: `python pipeline/process_letterboxd.py --input data/raw --out data/processed --include-reviews`
- TMDB details: `python pipeline/enrich_tmdb.py` (needs TMDB_API_KEY in .env; cached in data/raw/cache/)
- Latest diary from RSS: `python pipeline/fetch_rss.py`
- Web: `cd web; npm install` (first time), then `npm run dev` → http://127.0.0.1:3001 (port 3001; the Spotify dashboard uses 3000)
  (`predev` runs `sync-data` automatically)

## Data facts (Letterboxd export)
- `watched.csv`, `ratings.csv`, `likes/films.csv`, `watchlist.csv`, list files and profile favourites use **film** links (boxd.it/xxxx).
- `diary.csv` and `reviews.csv` use **diary-entry** links — different! Join them to films by (Name, Year).
- Ratings are 0.5–5 in half steps. Diary `Watched Date` is the date watched; `Date` is when it was logged.
- The export has **no genres, runtime, directors, posters or countries**. They come from TMDB via `enrich_tmdb.py` → `data/processed/tmdb.json` (keyed by Letterboxd film URL). Pages must still work when tmdb.json is missing.
- Credit TMDB (and JustWatch for where-to-watch) wherever that data is shown — the footer already does.

## Hard rules
1. Never commit `data/raw/`, `.env*` (except `.env.example`), or API keys. Never print keys in logs.
2. Review text is published on purpose (owner's choice) via `--include-reviews` → `reviews.json`, used by the "From my diary" card. Don't publish anything else from `data/raw/`.
3. Do not invent APIs or library functions. If unsure, say so and point to the official docs.
4. Ask before adding dependencies, deleting files, or restructuring folders.
5. Small steps, one feature at a time. After each change: plain-language summary, how to test, tick `docs/PLAN.md`.
6. Reuse the existing components (`Card`, `StatCard`, `Stars`, `FilmCard`, `SimpleBarChart`, `chartTheme.ts`) to keep one consistent look.
7. Personal settings (challenge goal, moods, JustWatch region) live in `web/src/config.ts`; favourite films in `data/favourites.json`.
8. Don't rebuild what Letterboxd already shows well (full film list, watchlist, lists). Focus on new insights.
