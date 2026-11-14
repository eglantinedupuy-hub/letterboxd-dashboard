"""
Turn a Letterboxd data export (CSV files) into small JSON summaries for the dashboard.

Usage (from the project root):
    python pipeline/process_letterboxd.py --input data/raw --out data/processed

Export it yourself: letterboxd.com -> Settings -> Data -> Export your data, unzip into data/raw/.

Joins:
- ratings.csv / watched.csv / likes/films.csv / watchlist.csv / profile favourites use FILM links (boxd.it/xxxx)
- diary.csv / reviews.csv use DIARY-ENTRY links (different!), so they are matched to films by (Name, Year).

Review text is NOT included unless you pass --include-reviews (it stays private by default).
Standard library only.
"""

import argparse
import csv
import json
from collections import Counter, defaultdict
from datetime import date, datetime, timezone
from pathlib import Path

WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]


def read_csv(path: Path):
    if not path.exists():
        return []
    with open(path, encoding="utf-8", newline="") as fh:
        return list(csv.DictReader(fh))


def read_list(path: Path):
    """Letterboxd list exports have a small header block, a blank line, then the film rows."""
    with open(path, encoding="utf-8", newline="") as fh:
        lines = fh.read().splitlines()
    meta = next(csv.DictReader(lines[1:3]), {})  # "Date,Name,Tags,URL,Description" + one row
    start = next(i for i, l in enumerate(lines) if l.startswith("Position,"))
    films = list(csv.DictReader(lines[start:]))
    return {
        "name": meta.get("Name") or path.stem.replace("-", " ").title(),
        "created": meta.get("Date"),
        "url": meta.get("URL"),
        "description": meta.get("Description") or "",
        "films": [{"position": int(f["Position"]), "name": f["Name"], "year": to_int(f["Year"]), "url": f["URL"]} for f in films if f.get("Name")],
    }


def to_int(v):
    try:
        return int(v)
    except (TypeError, ValueError):
        return None


def to_float(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def key(name, year):
    return (name.strip().lower(), str(year).strip())


def avg(values):
    values = [v for v in values if v is not None]
    return round(sum(values) / len(values), 2) if values else None


def build(raw: Path, include_reviews: bool):
    watched = read_csv(raw / "watched.csv")
    ratings = read_csv(raw / "ratings.csv")
    diary = read_csv(raw / "diary.csv")
    likes = read_csv(raw / "likes" / "films.csv")
    watchlist = read_csv(raw / "watchlist.csv")
    reviews = read_csv(raw / "reviews.csv")
    profile = (read_csv(raw / "profile.csv") or [{}])[0]
    lists = [read_list(p) for p in sorted((raw / "lists").glob("*.csv"))] if (raw / "lists").exists() else []

    # --- one record per film you've watched ---
    films = {}
    for w in watched:
        films[key(w["Name"], w["Year"])] = {
            "name": w["Name"], "year": to_int(w["Year"]), "url": w["Letterboxd URI"],
            "rating": None, "liked": False, "logged": [], "rewatches": 0, "has_review": False, "lists": [],
            "marked_watched": w["Date"],
        }
    url_to_key = {f["url"]: k for k, f in films.items()}

    for r in ratings:
        k = key(r["Name"], r["Year"])
        if k in films:
            films[k]["rating"] = to_float(r["Rating"])
    liked_urls = {l["Letterboxd URI"] for l in likes}
    for k, f in films.items():
        f["liked"] = f["url"] in liked_urls
    for d in diary:
        k = key(d["Name"], d["Year"])
        if k in films and d.get("Watched Date"):
            films[k]["logged"].append(d["Watched Date"])
            if d.get("Rewatch"):
                films[k]["rewatches"] += 1
    review_text = {}
    for rv in reviews:
        k = key(rv["Name"], rv["Year"])
        if k in films:
            films[k]["has_review"] = True
            if include_reviews:
                review_text[k] = rv.get("Review", "")
    for lst in lists:
        for f in lst["films"]:
            k = key(f["name"], f["year"] or "")
            if k in films:
                films[k]["lists"].append(lst["name"])

    # --- diary entries = dated watches (the timeline) ---
    entries = [d for d in diary if d.get("Watched Date")]
    entries.sort(key=lambda d: d["Watched Date"])
    by_month = defaultdict(lambda: {"films": 0, "ratings": []})
    by_year = defaultdict(lambda: {"films": 0, "ratings": [], "rewatches": 0})
    weekday = Counter()
    for d in entries:
        wd = d["Watched Date"]
        r = to_float(d.get("Rating"))
        by_month[wd[:7]]["films"] += 1
        by_month[wd[:7]]["ratings"].append(r)
        y = by_year[int(wd[:4])]
        y["films"] += 1
        y["ratings"].append(r)
        y["rewatches"] += 1 if d.get("Rewatch") else 0
        weekday[date.fromisoformat(wd).weekday()] += 1

    # fill empty months so charts show gaps honestly
    months = []
    if entries:
        y0, m0 = map(int, entries[0]["Watched Date"][:7].split("-"))
        y1, m1 = map(int, entries[-1]["Watched Date"][:7].split("-"))
        y, m = y0, m0
        while (y, m) <= (y1, m1):
            k = f"{y}-{m:02d}"
            months.append({"month": k, "films": by_month[k]["films"], "avg_rating": avg(by_month[k]["ratings"])})
            y, m = (y + 1, 1) if m == 12 else (y, m + 1)

    rated = [f for f in films.values() if f["rating"] is not None]
    dist = Counter(f["rating"] for f in rated)
    rating_distribution = [{"rating": r / 2, "films": dist.get(r / 2, 0)} for r in range(1, 11)]

    decades = defaultdict(lambda: {"films": 0, "ratings": []})
    for f in films.values():
        if f["year"]:
            d = decades[f["year"] // 10 * 10]
            d["films"] += 1
            d["ratings"].append(f["rating"])
    release_decades = [{"decade": k, "films": v["films"], "avg_rating": avg(v["ratings"])} for k, v in sorted(decades.items())]

    # Favourites are stored as links only; look the names up anywhere in the export.
    # If a favourite appears nowhere else, we keep the link with name=None (fill it in by hand later).
    known = {w["Letterboxd URI"]: (w["Name"], to_int(w["Year"])) for w in watched + likes + watchlist}
    for lst in lists:
        for f in lst["films"]:
            known.setdefault(f["url"], (f["name"], f["year"]))
    favourites = []
    for url in [u.strip() for u in (profile.get("Favorite Films") or "").split(",") if u.strip()]:
        name, year = known.get(url, (None, None))
        k = url_to_key.get(url)
        favourites.append({"name": name, "year": year, "url": url, "rating": films[k]["rating"] if k else None})

    film_list = []
    for k, f in sorted(films.items(), key=lambda kv: (kv[1]["logged"][-1] if kv[1]["logged"] else "", kv[1]["name"]), reverse=True):
        rec = {"name": f["name"], "year": f["year"], "url": f["url"], "rating": f["rating"], "liked": f["liked"],
               "watched_on": sorted(f["logged"]), "rewatches": f["rewatches"], "has_review": f["has_review"], "lists": f["lists"]}
        if include_reviews and k in review_text:
            rec["review"] = review_text[k]
        film_list.append(rec)

    now = date.today()
    wl = []
    for w in watchlist:
        added = w["Date"]
        wl.append({"name": w["Name"], "year": to_int(w["Year"]), "url": w["Letterboxd URI"], "added": added,
                   "days_waiting": (now - date.fromisoformat(added)).days if added else None})

    summary = {
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "member_since": profile.get("Date Joined"),
        "username": profile.get("Username"),
        "films_watched": len(films),
        "diary_entries": len(entries),
        "first_logged": entries[0]["Watched Date"] if entries else None,
        "last_logged": entries[-1]["Watched Date"] if entries else None,
        "rated": len(rated),
        "avg_rating": avg([f["rating"] for f in rated]),
        "liked": sum(1 for f in films.values() if f["liked"]),
        "reviews": sum(1 for f in films.values() if f["has_review"]),
        "rewatches": sum(f["rewatches"] for f in films.values()),
        "watchlist": len(wl),
        "lists": len(lists),
        "favourites": favourites,
    }

    return {
        "summary": summary,
        "monthly": months,
        "yearly": [{"year": y, "films": v["films"], "avg_rating": avg(v["ratings"]), "rewatches": v["rewatches"]} for y, v in sorted(by_year.items())],
        "weekday": [{"day": WEEKDAYS[i], "films": weekday.get(i, 0)} for i in range(7)],
        "rating_distribution": rating_distribution,
        "release_decades": release_decades,
        "films": film_list,
        "watchlist": wl,
        "lists": [{k: v for k, v in l.items()} for l in lists],
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--input", default="data/raw")
    parser.add_argument("--out", default="data/processed")
    parser.add_argument("--include-reviews", action="store_true", help="also publish review text (off by default)")
    args = parser.parse_args()

    result = build(Path(args.input), args.include_reviews)
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    for name, data in result.items():
        p = out / f"{name}.json"
        with open(p, "w", encoding="utf-8") as fh:
            json.dump(data, fh, ensure_ascii=False, separators=(",", ":"))
        print(f"  wrote {p} ({p.stat().st_size / 1024:.1f} KB)")
    s = result["summary"]
    print(f"Done: {s['films_watched']} films, {s['diary_entries']} diary entries, avg rating {s['avg_rating']}, "
          f"{s['watchlist']} on watchlist, {s['lists']} lists")


if __name__ == "__main__":
    main()
