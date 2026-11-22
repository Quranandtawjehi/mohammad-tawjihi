# يدمج ملفات الأسئلة لكل كتاب في ملف واحد data.json
import json, glob, os, sys
BOOKS = {
  "is": {"title": "التربية الإسلامية", "icon": "🕌", "color": "#059669", "pages": 153, "start": 5},
}
here = os.path.dirname(os.path.abspath(__file__))
for bid, meta in BOOKS.items():
    q = {}
    for f in sorted(glob.glob(os.path.join(here, bid, "q", "*.json"))):
        with open(f, encoding="utf-8") as fh:
            q.update(json.load(fh))
    out = dict(meta, id=bid, q=q)
    with open(os.path.join(here, bid, "data.json"), "w", encoding="utf-8") as fh:
        json.dump(out, fh, ensure_ascii=False, separators=(",", ":"))
    print(bid, "pages with questions:", len(q), "questions:", sum(len(v["qs"]) for v in q.values()))
