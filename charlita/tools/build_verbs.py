import json, logging, sys
logging.disable(logging.CRITICAL)
sys.path.insert(0, '/home/claude/build')
from verbs_src import CORE, RESERVE, CHECKS
from verbecc import CompleteConjugator

cg = CompleteConjugator(lang='es')

TENSES = [  # id, mood, verbecc tense key, label_es
 ("ind_presente","indicativo","presente","Presente"),
 ("ind_perfecto","indicativo","pretérito-perfecto-compuesto","Pretérito perfecto"),
 ("ind_indefinido","indicativo","pretérito-perfecto-simple","Pretérito indefinido"),
 ("ind_imperfecto","indicativo","pretérito-imperfecto","Pretérito imperfecto"),
 ("ind_pluscuam","indicativo","pretérito-pluscuamperfecto","Pluscuamperfecto"),
 ("ind_futuro","indicativo","futuro","Futuro simple"),
 ("ind_futuro_comp","indicativo","futuro-perfecto","Futuro compuesto"),
 ("ind_condicional","condicional","presente","Condicional simple"),
 ("ind_condicional_comp","condicional","perfecto","Condicional compuesto"),
 ("sub_presente","subjuntivo","presente","Subjuntivo presente"),
 ("sub_perfecto","subjuntivo","pretérito-perfecto","Subjuntivo perfecto"),
 ("sub_imperfecto","subjuntivo","pretérito-imperfecto-1","Subjuntivo imperfecto"),
 ("sub_pluscuam","subjuntivo","pretérito-pluscuamperfecto-1","Subjuntivo pluscuamperfecto"),
 ("imp_afirmativo","imperativo","afirmativo","Imperativo afirmativo"),
 ("imp_negativo","imperativo","negativo","Imperativo negativo"),
]
ALT_SE = {"sub_imperfecto":"pretérito-imperfecto-2","sub_pluscuam":"pretérito-pluscuamperfecto-2"}
PRON = ["yo","tú","él","nosotros","vosotros","ellos"]

def rows_to6(rows, imperative=False):
    out = [None]*6
    for r in rows:
        pr = r.get('pr'); pr = pr.value if pr is not None and hasattr(pr,'value') else pr
        p = r['p'].value; n = r['n'].value
        idx = {('1','s'):0,('2','s'):1,('3','s'):2,('1','p'):3,('2','p'):4,('3','p'):5}[(p,n)]
        if pr in ('vos','ella','ellas','usted','ustedes'): continue
        if out[idx] is not None: continue
        form = r['c'][0]
        if not imperative:
            form = form.split(' ',1)[1] if ' ' in form and form.split(' ',1)[0] in PRON else form
        out[idx] = form
    if imperative: out[0] = None
    return out

def parse(block):
    seen=set(); res=[]
    for line in block.strip().splitlines():
        inf, senses, tags = line.split('|')
        if inf.endswith('_dup') or not senses: continue
        res.append((inf, senses, tags))
    return res

MODEL = {"pasar":("hablar",[("habl","pas")]),"resultar":("hablar",[("habl","result")]),
 "suceder":("comer",[("com","suced")]),"nevar":("pensar",[("piens","niev"),("pens","nev")]),
 "gobernar":("pensar",[("piens","gobiern"),("pens","gobern")])}
def swap(x, reps):
    if isinstance(x, list): return [swap(i, reps) for i in x]
    if isinstance(x, dict): return {k: swap(v, reps) for k,v in x.items()}
    if x is None: return None
    for a,b in reps:
        if a in x: return x.replace(a,b)
    return x
def conj(inf):
    if inf in MODEL:
        m, reps = MODEL[inf]
        t,a,pp,g = conj(m)
        return swap(t,reps), swap(a,reps), swap(pp,reps), swap(g,reps)
    d = cg.conjugate(inf).get_data()
    if d['verb']['predicted']: print("WARNING predicted:", inf)
    moods = {m.value:{t.value:rows for t,rows in ts.items()} for m,ts in d['moods'].items()}
    table = {}
    for tid, mood, tkey, _ in TENSES:
        table[tid] = rows_to6(moods[mood][tkey], mood=='imperativo')
    alt = {tid: rows_to6(moods['subjuntivo'][k]) for tid,k in ALT_SE.items()}
    return table, alt, moods['participo']['participo'][0]['c'][0], moods['gerundio']['gerundio'][0]['c'][0]

def eng(senses):
    out=[]
    for s in senses.split(';'):
        b,p,pp = s.split(',')
        out.append({"base":b,"past":p,"pp":pp})
    return out

core = parse(CORE); reserve = parse(RESERVE)
names=set(); C=[]; R=[]
for inf,s,t in core:
    if inf in names: continue
    names.add(inf); C.append((inf,s,t))
for inf,s,t in reserve:
    if inf in names: continue
    names.add(inf); R.append((inf,s,t))
# top up core to 100 from reserve
while len(C) < 100: C.append(R.pop(0))
while len(C) > 100: R.insert(0, C.pop())
print("core", len(C), "reserve", len(R))

verbs=[]
for rank,(inf,s,t) in enumerate(C+R):
    table, alt, pp, ger = conj(inf)
    verbs.append({"inf":inf,"rank":rank+1,"pool":"core" if rank < len(C) else "reserve",
                  "en":eng(s),"tags":[x for x in t.split(',') if x],"pp":pp,"ger":ger,
                  "t":table,"alt":alt})

FIX={'rió':'rio','frió':'frio','riáis':'riais','friáis':'friais'}
for v in verbs:
    for d in (v['t'],v['alt']):
        for tid,arr in d.items():
            d[tid]=[(' '.join(FIX.get(w,w) for w in f.split(' '))) if f else f for f in arr]
V0={v['inf']:v for v in verbs}; H=V0['haber']
H['t']['ind_presente'][2]='ha'; H['accept']={'ind_presente':{'2':['hay']}}
V0['ir'].setdefault('accept',{})['imp_afirmativo']={'3':['vamos']}
H['t']['imp_afirmativo']=[None]*6; H['t']['imp_negativo']=[None]*6
# Spain-specific fixes: verbecc sometimes gives accented monosyllables; RAE 2010: fue, fui, dio, vio, rio are unaccented
bad=0
V={v['inf']:v for v in verbs}
for inf,tid,i,exp in CHECKS:
    got = V[inf]['t'][tid][i]
    if got != exp:
        print("MISMATCH", inf, tid, i, got, "expected", exp); bad+=1
# global scan for obviously wrong monosyllable accents
for v in verbs:
    for tid,arr in v['t'].items():
        for f in arr:
            if f and f in ("fué","fuí","dió","vió","rió","frió","guió"): print("ACCENT", v['inf'], tid, f); bad+=1
print("checks failed:", bad)
json.dump({"tenses":[{"id":a,"label":d} for a,_,_,d in TENSES],"persons":PRON,"verbs":verbs},
          open('/home/claude/build/verbs.json','w'), ensure_ascii=False, separators=(',',':'))
