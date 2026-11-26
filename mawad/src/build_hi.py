import json, glob, os
here = os.path.dirname(os.path.abspath(__file__))
pq, review = {}, []
for f in sorted(glob.glob(os.path.join(here, "hi_q/*.json"))):
    for p, v in json.load(open(f, encoding="utf-8")).items():
        if p in pq: pq[p]["qs"] += v["qs"]
        else: pq[p] = v
for f in sorted(glob.glob(os.path.join(here, "hi_rev/*.json"))): review += json.load(open(f, encoding="utf-8"))
review.sort(key=lambda r: r["page"])
for p, v in pq.items():
    for q in v["qs"]: assert 0 <= q["a"] < len(q["o"]) and len(q["o"]) == 4, (p, q["q"])
bank = []
bf = os.path.join(here, "hi_bank.json")
if os.path.exists(bf): bank = json.load(open(bf, encoding="utf-8"))
units = [
    {"n": 1, "t": "الأردن في العصور القديمة", "from": 6, "to": 41},
    {"n": 2, "t": "الأردن في العصور الإسلامية", "from": 42, "to": 79},
    {"n": 3, "t": "الأردن في العصر الحديث", "from": 80, "to": 120},
]
out = {"id": "hi", "pages": 120, "start": 6, "img": "../books/hi/img/", "units": units, "pq": pq, "review": review, "bank": bank}
json.dump(out, open(os.path.join(os.path.dirname(here), "data/hi.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print("hi: pages", len(pq), "q", sum(len(v["qs"]) for v in pq.values()), "bank", len(bank), "review", len(review))

import subprocess, sys as _s
subprocess.run([_s.executable, os.path.join(here, "dedup.py"), "hi"])
