import json, random
random.seed(7)
d=json.load(open('verbs.json')); V={v['inf']:v for v in d['verbs']}
CONF={
 'ind_presente':['ind_indefinido','ind_imperfecto','sub_presente','ind_perfecto'],
 'ind_perfecto':['ind_indefinido','ind_pluscuam','ind_presente','sub_perfecto'],
 'ind_indefinido':['ind_imperfecto','ind_perfecto','ind_presente','ind_pluscuam'],
 'ind_imperfecto':['ind_indefinido','ind_perfecto','ind_condicional','ind_presente'],
 'ind_pluscuam':['ind_perfecto','ind_indefinido','sub_pluscuam','ind_condicional_comp'],
 'ind_futuro':['ind_condicional','sub_presente','ind_indefinido','ind_imperfecto'],
 'ind_futuro_comp':['ind_condicional_comp','ind_perfecto','ind_pluscuam','ind_futuro'],
 'ind_condicional':['ind_futuro','ind_imperfecto','sub_imperfecto','ind_presente'],
 'ind_condicional_comp':['ind_pluscuam','ind_futuro_comp','sub_pluscuam','ind_condicional'],
 'sub_presente':['ind_presente','sub_imperfecto','ind_futuro','ind_indefinido'],
 'sub_perfecto':['ind_perfecto','sub_pluscuam','sub_presente','ind_pluscuam'],
 'sub_imperfecto':['ind_condicional','ind_imperfecto','sub_presente','ind_indefinido'],
 'sub_pluscuam':['ind_condicional_comp','ind_pluscuam','sub_imperfecto','sub_perfecto'],
 'imp_afirmativo':['ind_presente','sub_presente','ind_futuro','ind_indefinido'],
 'imp_negativo':['ind_presente','sub_imperfecto','ind_futuro','ind_indefinido'],
}
def form(inf,t,p):
    f=V[inf]['t'][t][p]
    if f and f.startswith('no '): f=f[3:]
    return f
out=[]
for i,line in enumerate(l for l in open('detective_src.txt') if l.strip() and not l.startswith('#')):
    t,p,inf,es,en=line.strip().split('|'); p=int(p)
    right=form(inf,t,p); assert right, line
    opts=[]; 
    for ct in CONF[t]:
        if t=='ind_condicional' and inf in ('querer','poder','deber') and ct=='sub_imperfecto': continue
        f=form(inf,ct,p)
        if f and f!=right and f not in [o['f'] for o in opts]: opts.append({'f':f,'t':ct})
        if len(opts)==3: break
    assert len(opts)>=2, line
    out.append({'id':f'd{i:03d}','t':t,'p':p,'v':inf,'es':es,'en':en,'ok':right,'wrong':opts})
json.dump(out,open('detective.json','w'),ensure_ascii=False,separators=(',',':'))
print(len(out)); 
for o in out[50:56]: print(o['es'].replace('{}',o['ok']), [w['f'] for w in o['wrong']])
