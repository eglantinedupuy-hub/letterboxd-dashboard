# Roadmap

Tick boxes as things get done. Agents: one unchecked item at a time unless asked otherwise.

## Design direction
- **Colours:** Letterboxd-inspired. Dark blue-grey background (#14181c), cards #1c2228 / hover #2c3440,
  orange (#ff8000) as the main chart colour, green (#00e054) for star ratings, blue (#40bcf4) for links, pink hearts for likes.
- **Style:** same as the Spotify dashboard: clean, minimal, rounded cards, hover effects, clickable stats, count-up numbers.
- Every film links to its Letterboxd page.

## Phase 0 — Setup
- [x] Letterboxd export downloaded into `data/raw/`
- [x] Project scaffolded (pipeline, web app shell, docs)
- [ ] GitHub repo created and pushed (`gh repo create`)

## Phase 1 — Pipeline
- [x] `process_letterboxd.py`: summary, monthly/yearly diary counts, weekday, rating distribution, release decades, films, watchlist, lists
- [ ] Fill in favourite-film names (3 of 4 profile favourites only exist as links in the export)
- [ ] TMDB enrichment (optional): genres, runtime, director, country, poster for each film — needs a free TMDB API key; check TMDB's terms and attribution rules first

## Phase 2 — Pages
- [x] **Overview**: stat cards, films per month, rating distribution, release decades, recently watched
- [ ] **Films**: searchable, sortable table/grid of every film (rating, year, date watched, liked, rewatch, in which lists)
- [ ] **Watchlist**: how long films have been waiting, decade breakdown, "oldest on my list", random-pick button
- [ ] **Lists**: each list as a card → its films
- [ ] **Year in review**: per-year page (films, avg rating, top-rated, month chart)
- [ ] Weekday chart / "when I watch"
- [ ] With TMDB: genres over time, hours watched, favourite directors, countries map, posters everywhere

## Phase 3 — Deploy
- [ ] Vercel (root directory `web`); make the build copy `data/processed` (prebuild step)
- [ ] Link from eglantinedupuy-hub.github.io

## Ideas parking lot
- Combine with the Spotify dashboard into one "my data" portfolio site
