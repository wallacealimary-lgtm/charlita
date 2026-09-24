import json,glob,re
out=[];seen=set();seen_es_core=set()
def load(files,src):
    for f in sorted(files):
        for line in open(f,encoding='utf-8'):
            line=line.rstrip('\n')
            if not line.strip() or line.startswith('#'): continue
            p=line.split('|')
            assert len(p)==8,(f,line)
            es,pos,g,en,d,ex,topic,latam=p
            key=(es,en)
            if key in seen: continue
            if src=='reserve' and es in seen_es_core: continue
            seen.add(key)
            if src=='core': seen_es_core.add(es)
            out.append({"id":f"w{len(out)+1:04d}","es":es,"pos":pos,"gender":g or None,"def_es":d,"example_es":ex,
                        "en":en,"variety":"es-ES" if latam else "all","latam_alt":latam or None,"topic":[topic],
                        "freq_rank":len(out)+1,"source":src})
load([f for f in glob.glob('words/*.txt') if not os.path.basename(f).startswith('r')] if False else sorted(glob.glob('words/0*.txt')),'core')
n=len(out)
load(glob.glob('words/r*.txt'),'reserve')
print('core',n,'reserve',len(out)-n)
json.dump(out,open('words.json','w'),ensure_ascii=False,separators=(',',':'))
