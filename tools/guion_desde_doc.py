import json,re,html,sys
x=json.load(open(sys.argv[1]))['data']['xml']
def txt(s):
    s=re.sub(r'<br\s*/?>',' ',s)
    s=re.sub(r"<date[^>]*value='([^']+)'[^>]*/>",r'\1',s)
    s=re.sub(r"<mention[^>]*name='([^']+)'[^>]*/>",r'\1',s)
    s=re.sub(r'<[^>]+>','',s)
    return html.unescape(s).strip()
# tokenize top-level blocks
blocks=[]
pos=0
pat=re.compile(r"<(paragraph|list|table|quote|image|widget|callout)\b([^>]*)>")
depth=0;start=None;tag=None
for m in re.finditer(r"<(/?)(paragraph|list|table|quote|image|widget|callout)\b([^>]*?)(/?)>",x):
    close,t,attrs,selfc=m.groups()
    if not close:
        if depth==0: start=m.start(); tag=t; a=attrs
        if selfc!='/': depth+=1
        elif depth==0: blocks.append((t,attrs,x[start:m.end()]))
    else:
        depth-=1
        if depth==0: blocks.append((tag,a,x[start:m.end()]))
caps=[];cur=None;skip=False
for t,attrs,raw in blocks:
    h=re.search(r"heading='(\d)'",attrs)
    if t=='paragraph' and h:
        lvl=int(h.group(1)); s=txt(raw)
        if lvl==2:
            mm=re.match(r'Bloque (\d+) · (.*?)(?: \((\d+) min\))?$',s)
            if mm:
                cur={'n':int(mm.group(1)),'titulo':mm.group(2),'min':int(mm.group(3) or 0),'partes':[]}; caps.append(cur); skip=False
            else: cur=None
            continue
        if lvl==3 and cur is not None:
            skip=s.lower().startswith('fuentes')
            if not skip: cur['partes'].append({'t':'sub','x':s})
            continue
    if cur is None or skip: continue
    if t=='paragraph':
        s=txt(raw)
        if not s or s=='Notas:': continue
        mm=re.match(r'^(\[[^\]]*\])\s*(.*)$',s)
        if mm:
            cur['partes'].append({'t':'esc','x':mm.group(1)[1:-1].strip()})
            if mm.group(2): cur['partes'].append({'t':'dic','x':mm.group(2)})
        else: cur['partes'].append({'t':'dic','x':s})
    elif t=='list':
        items=[txt(i) for i in re.findall(r'<listItem\b.*?</listItem>',raw,re.S)]
        cur['partes'].append({'t':'lista','x':items})
    elif t=='table':
        rows=[[txt(c) for c in re.findall(r'<cell\b.*?</cell>',r,re.S)] for r in re.findall(r'<row\b.*?</row>',raw,re.S)]
        cur['partes'].append({'t':'tabla','x':rows})
json.dump(caps,open(sys.argv[2] if len(sys.argv)>2 else 'src/data/guion.json','w'),ensure_ascii=False,indent=1)
for c in caps: print(c['n'],c['titulo'],c['min'],len(c['partes']),sum(1 for p in c['partes'] if p['t']=='esc'))
