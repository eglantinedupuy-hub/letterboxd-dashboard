"""
Pull my latest diary entries from my public Letterboxd RSS feed and merge them into data/processed/diary.json,
so the dashboard stays up to date between full exports.

Usage (from the project root):
    python pipeline/fetch_rss.py            # uses LETTERBOXD_USER from .env, or "eglantinee"

The feed only contains recent activity (roughly the last ~50 items), so run it regularly (e.g. daily).
Feed: https://letterboxd.com/<username>/rss/   (no API key needed)
Fields used: letterboxd:filmTitle, letterboxd:filmYear, letterboxd:watchedDate, letterboxd:rewatch,
letterboxd:memberRating, letterboxd:memberLike, tmdb:movieId, link.
"""

import json
import os
import xml.etree.ElementTree as ET
from pathlib import Path

import requests
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
DIARY = ROOT / "data" / "processed" / "diary.json"
NS = {"letterboxd": "https://letterboxd.com", "tmdb": "https://themoviedb.org"}


def text(item, tag):
    el = item.find(tag, NS)
    return el.text.strip() if el is not None and el.text else None


def main():
    load_dotenv(ROOT / ".env")
    user = os.environ.get("LETTERBOXD_USER", "eglantinee")
    r = requests.get(f"https://letterboxd.com/{user}/rss/", timeout=20, headers={"User-Agent": "personal-dashboard"})
    r.raise_for_status()
    items = ET.fromstring(r.content).findall("./channel/item")

    diary = json.loads(DIARY.read_text(encoding="utf-8")) if DIARY.exists() else []
    seen = {(d["date"], d["name"].lower()) for d in diary}
    added = 0
    for it in items:
        title, watched = text(it, "letterboxd:filmTitle"), text(it, "letterboxd:watchedDate")
        if not title or not watched:
            continue  # list updates etc., not diary entries
        if (watched, title.lower()) in seen:
            continue
        rating = text(it, "letterboxd:memberRating")
        year = text(it, "letterboxd:filmYear")
        diary.append({
            "date": watched,
            "name": title,
            "year": int(year) if year else None,
            "url": text(it, "link") or "",  # diary-entry link (the export uses film links; both open on Letterboxd)
            "rating": float(rating) if rating else None,
            "rewatch": text(it, "letterboxd:rewatch") == "Yes",
            "liked": text(it, "letterboxd:memberLike") == "Yes",
            "tmdb_id": int(text(it, "tmdb:movieId")) if text(it, "tmdb:movieId") else None,
            "source": "rss",
        })
        added += 1

    diary.sort(key=lambda d: d["date"], reverse=True)
    DIARY.write_text(json.dumps(diary, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"RSS: {len(items)} items in feed, {added} new diary entries added (total {len(diary)})")


if __name__ == "__main__":
    main()
