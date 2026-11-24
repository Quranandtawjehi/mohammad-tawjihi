import json, glob, os, re
here = os.path.dirname(os.path.abspath(__file__))
root = os.path.dirname(os.path.dirname(here))
q = {}
for f in sorted(glob.glob(os.path.join(root, "books/is/q/*.json"))):
    q.update(json.load(open(f, encoding="utf-8")))
mcq_dir = os.path.join(here, "is_mcq")
mcq = {}
for f in sorted(glob.glob(os.path.join(mcq_dir, "*.json"))):
    mcq.update(json.load(open(f, encoding="utf-8")))
units = [
    {"n": 1, "t": "واعتصموا بحبل الله جميعًا", "from": 5, "to": 42},
    {"n": 2, "t": "وجعلناكم شعوبًا وقبائل لتعارفوا", "from": 43, "to": 75},
    {"n": 3, "t": "وقل جاء الحق وزهق الباطل", "from": 76, "to": 110},
    {"n": 4, "t": "لتسكنوا إليها", "from": 111, "to": 151},
]
pq, review = {}, []
for p in sorted(q, key=int):
    v = q[p]
    h = v["h"]; qs = []
    for x in v["qs"]:
        if x["t"] == "m": qs.append({"q": x["q"], "o": x["o"], "a": x["a"]})
    qs += mcq.get(p, [])
    for qq in qs: assert len(qq["o"]) == 4 and 0 <= qq["a"] < 4, (p, qq["q"])
    if qs: pq[p] = {"h": h, "qs": qs}
    if "التقويم" in v["h"]:
        items = []
        for x in v["qs"]:
            if x["t"] == "s": a = x["a"]
            elif x["t"] == "m": a = x["o"][x["a"]]
            else: a = "صح ✔️" if x["a"] else "خطأ ✖️"
            items.append({"q": x["q"], "a": a})
        t = re.sub(r"^التقويم والمراجعة\s*[—-]?\s*", "", v["h"]) or "التقويم والمراجعة"
        if review and review[-1]["page"] == int(p) - 1:
            review[-1]["items"] += items
        else:
            review.append({"t": t, "page": int(p), "items": items})
bank = []
bf = os.path.join(here, "is_bank.json")
if os.path.exists(bf): bank = json.load(open(bf, encoding="utf-8"))
out = {"id": "is", "pages": 153, "start": 5, "img": "../books/is/img/", "units": units, "pq": pq, "review": review, "bank": bank}
json.dump(out, open(os.path.join(os.path.dirname(here), "data/is.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print("is: pages", len(pq), "q", sum(len(v["qs"]) for v in pq.values()), "bank", len(bank), "review lessons", len(review))
