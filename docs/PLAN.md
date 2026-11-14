# Roadmap

Tick boxes as things get done. Agents: one unchecked item at a time unless asked otherwise.
Principle: don't copy what Letterboxd already shows (film list, watchlist, lists) — add new insights and tools.

## Design direction
- **Colours:** Letterboxd-inspired slate grey (not black): background #242c34, cards #2c3440, hover #384452.
  Orange (#ff8000) main chart colour, green (#00e054) star ratings, blue (#40bcf4) links, pink hearts for likes.
- **Style:** clean, minimal, rounded cards, hover effects, clickable stats, count-up numbers. Every film links to Letterboxd.
- Personal settings in `web/src/config.ts` (challenge goal, favourites, JustWatch region).

## Phase 0 — Setup
- [x] Letterboxd export in `data/raw/`; project scaffolded
- [ ] GitHub repo created and pushed (`gh repo create`)

## Phase 1 — Pipeline
- [x] `process_letterboxd.py`: summary, monthly/yearly counts, weekday, ratings, decades, films, watchlist, lists, diary, reviews (`--include-reviews`)
- [x] Favourite-film names (typed in `config.ts`; the export only has links)

## Phase 2 — Pages
- [x] **Overview**: this week / month / year counts, yearly challenge with pace, favourites, rotating diary reviews, "this month in past years", recently watched
- [x] **Stats**: fun facts, calendar heatmap per year, films per year, weekday, films per month, ratings, decades
- [x] **Pick a film**: watchlist shuffle with era filters + "waiting longest", JustWatch + Letterboxd links, export shortlist as a Letterboxd-importable CSV
- [x] **Pick a film v2**: moods (presets + my mood lists), filters for language, genre, TMDB rating, known/new director, length, era; posters + streaming info (needs TMDB)
- [x] Posters on the Overview film cards, favourites and diary reviews
- [ ] Challenge goal per year (different goal for each year, history of past challenges)
- [ ] List completion: % of each list I've watched (e.g. Barb's cinematic education)
- [ ] Rating vs average: how my ratings compare with Letterboxd's average (needs data the export doesn't have)

## Phase 3 — Data upgrades
- [x] `fetch_rss.py`: merge recent diary entries from my public RSS feed (written, not yet tested against the live feed)
- [x] `enrich_tmdb.py`: posters, genres, runtime, language, directors, countries, TMDB rating, where-to-watch (written, needs my TMDB key to test)
- [x] Get TMDB key, run both scripts, check results (685/689 matched)
- [x] Daily RSS + TMDB refresh workflow written (`.github/workflows/daily-refresh.yml`) — needs the TMDB_API_KEY repo secret
- [ ] Stats with TMDB: hours watched, genres over time, favourite directors, countries map

## Phase 4 — Deploy
- [x] Data bundled via `web/src/data` (works on Vercel)
- [ ] Vercel project (root directory `web`)
- [ ] Link from eglantinedupuy-hub.github.io
