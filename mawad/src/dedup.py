import json,sys,os
H=os.path.dirname(os.path.abspath(__file__))
def apply(sub,d):
    R=json.load(open(os.path.join(H,'remove.json'))).get(sub,[])
    keys={}
    for p,i,q,a in R: keys[(str(p),q,a)]=keys.get((str(p),q,a),0)+1; n=0
    for p,v in list(d['pq'].items()):
        before=len(v['qs']); keep=[]
        for q in v['qs']:
            k=(p,q['q'],q['o'][q['a']])
            if keys.get(k,0)>0: keys[k]-=1
            else: keep.append(q)
        v['qs']=keep; n+=before-len(v['qs'])
        if not v['qs']: del d['pq'][p]
    return n
if __name__=='__main__':
    s=sys.argv[1]; f=os.path.join(H,'..','data',s+'.json'); d=json.load(open(f))
    n=apply(s,d); json.dump(d,open(f,'w'),ensure_ascii=False)
    print(s,'removed',n,'left',sum(len(v['qs']) for v in d['pq'].values()))
