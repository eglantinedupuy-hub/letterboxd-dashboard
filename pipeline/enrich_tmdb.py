"""
Add TMDB details (poster, genres, runtime, language, directors, countries, TMDB rating, where to watch)
to every film in my Letterboxd data: watched films, watchlist and lists.

Usage (from the project root, after process_letterboxd.py):
    python pipeline/enrich_tmdb.py

Needs a free TMDB key in the project's .env file:
    TMDB_API_KEY=...      (either the short "API Key" or the long "API Read Access Token" works)

Results are cached in data/raw/cache/tmdb.json, so re-runs only fetch new films.
Writes data/processed/tmdb.json: { "<letterboxd film url>": { ...details } }

Terms: TMDB data is free for non-commercial use with attribution (credit TMDB on the site).
Where-to-watch data comes from JustWatch via TMDB and must be credited to JustWatch.
Docs: https://developer.themoviedb.org/reference
"""

import json
import os
import sys
import time
from pathlib import Path

import requests
from dotenv import load_dotenv

API = "https://api.themoviedb.org/3"
REGION = os.environ.get("WATCH_REGION", "CA")  # where-to-watch country
ROOT = Path(__file__).resolve().parent.parent
PROCESSED = ROOT / "data" / "processed"
CACHE = ROOT / "data" / "raw" / "cache" / "tmdb.json"


def session_with_key() -> requests.Session:
    load_dotenv(ROOT / ".env")
    key = os.environ.get("TMDB_API_KEY", "").strip()
    if not key:
        sys.exit("TMDB_API_KEY is missing. Add it to the .env file in the project root (see .env.example).")
    s = requests.Session()
    if len(key) > 40:  # the long "Read Access Token" goes in a header
        s.headers["Authorization"] = f"Bearer {key}"
    else:  # the short "API Key" goes in the URL
        s.params = {"api_key": key}
    return s


def get(s: requests.Session, path: str, **params):
    for attempt in range(4):
        r = s.get(f"{API}{path}", params=params, timeout=20)
        if r.status_code == 429:  # rate limited: wait and retry
            time.sleep(2 * (attempt + 1))
            continue
        r.raise_for_status()
        time.sleep(0.05)  # be gentle
        return r.json()
    r.raise_for_status()


def find_id(s, name: str, year) -> int | None:
    """Search TMDB by title (+ year, which makes matches much more reliable)."""
    tries = [{"query": name, "year": year}, {"query": name}] if year else [{"query": name}]
    for params in tries:
        results = get(s, "/search/movie", **{k: v for k, v in params.items() if v}).get("results", [])
        if results:
            return results[0]["id"]
    return None


def details(s, tmdb_id: int) -> dict:
    d = get(s, f"/movie/{tmdb_id}", append_to_response="credits,watch/providers")
    providers = (d.get("watch/providers") or {}).get("results", {}).get(REGION, {})
    names = lambda kind: [p["provider_name"] for p in providers.get(kind, [])]
    return {
        "tmdb_id": tmdb_id,
        "poster": d.get("poster_path"),  # full URL: https://image.tmdb.org/t/p/w342{poster}
        "genres": [g["name"] for g in d.get("genres", [])],
        "runtime": d.get("runtime") or None,  # minutes
        "language": d.get("original_language"),  # ISO code, e.g. "fr", "en"
        "countries": [c["iso_3166_1"] for c in d.get("production_countries", [])],
        "directors": [c["name"] for c in d.get("credits", {}).get("crew", []) if c.get("job") == "Director"],
        "tmdb_rating": d.get("vote_average"),  # 0-10
        "tmdb_votes": d.get("vote_count"),
        "overview": d.get("overview") or "",
        "watch": {"link": providers.get("link"), "stream": names("flatrate"), "rent": names("rent"), "buy": names("buy")},
    }


def all_films():
    """Every film we know about: watched, watchlist, list entries -> {url: (name, year)}."""
    films = {}
    for f in json.loads((PROCESSED / "films.json").read_text(encoding="utf-8")):
        films[f["url"]] = (f["name"], f["year"])
    for w in json.loads((PROCESSED / "watchlist.json").read_text(encoding="utf-8")):
        films.setdefault(w["url"], (w["name"], w["year"]))
    for lst in json.loads((PROCESSED / "lists.json").read_text(encoding="utf-8")):
        for f in lst["films"]:
            films.setdefault(f["url"], (f["name"], f["year"]))
    return films


def main():
    s = session_with_key()
    cache = json.loads(CACHE.read_text(encoding="utf-8")) if CACHE.exists() else {}
    films = all_films()
    todo = [u for u in films if u not in cache]
    print(f"{len(films)} films, {len(todo)} to fetch from TMDB (the rest are cached)")

    for i, url in enumerate(todo, 1):
        name, year = films[url]
        try:
            tmdb_id = find_id(s, name, year)
            cache[url] = details(s, tmdb_id) if tmdb_id else {"tmdb_id": None}
        except requests.HTTPError as e:
            print(f"  ! {name} ({year}): {e}")
            continue
        if i % 25 == 0 or i == len(todo):
            print(f"  {i}/{len(todo)}")
            CACHE.parent.mkdir(parents=True, exist_ok=True)
            CACHE.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")

    CACHE.parent.mkdir(parents=True, exist_ok=True)
    CACHE.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")
    out = {u: cache[u] for u in films if cache.get(u, {}).get("tmdb_id")}
    (PROCESSED / "tmdb.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    missing = [films[u][0] for u in films if not cache.get(u, {}).get("tmdb_id")]
    print(f"Done: {len(out)} films matched on TMDB. Not found: {len(missing)}" + (f" (e.g. {', '.join(missing[:5])})" if missing else ""))


if __name__ == "__main__":
    main()
