import json,glob,os
here=os.path.dirname(os.path.abspath(__file__))
pq={}
for f in sorted(glob.glob(os.path.join(here,'ar_q','*.json'))):
    for p,v in json.load(open(f,encoding='utf-8')).items():
        for q in v['qs']: assert len(q['o'])==4 and 0<=q['a']<4 and len(set(q['o']))==4,(f,p,q['q'])
        pq[p]=v
d=json.load(open(os.path.join(here,'..','data','ar.json'),encoding='utf-8'))
d['pq']=pq
rev=[]
for f in sorted(glob.glob(os.path.join(here,'ar_rev','*.json'))): rev+=json.load(open(f,encoding='utf-8'))
d['review']=rev
json.dump(d,open(os.path.join(here,'..','data','ar.json'),'w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))
print('ar: pages',len(pq),'q',sum(len(v['qs']) for v in pq.values()),'review',len(rev))
