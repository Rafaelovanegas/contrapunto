"""Convierte el Doc "Marco jurídico" en un capítulo-anexo del guion (src/data/marco.json).
Uso: python3 tools/marco_desde_doc.py <lectura_del_doc.json> [salida]"""
import json, re, html, sys
raw = json.load(open(sys.argv[1]))
if isinstance(raw, list): raw = json.loads(raw[0]['text'])
x = raw['data']['xml']
def txt(s):
    s = re.sub(r'<br\s*/?>', ' ', s)
    s = re.sub(r"<date[^>]*value='([^']+)'[^>]*/>", r'\1', s)
    s = re.sub(r"<mention[^>]*name='([^']+)'[^>]*/>", r'\1', s)
    s = re.sub(r'<[^>]+>', '', s)
    return html.unescape(s).strip()
blocks = []; depth = 0
for m in re.finditer(r"<(/?)(paragraph|list|table|quote|image|widget|callout)\b([^>]*?)(/?)>", x):
    close, t, attrs, selfc = m.groups()
    if not close:
        if depth == 0: start, tag, a = m.start(), t, attrs
        if selfc != '/': depth += 1
        elif depth == 0: blocks.append((t, attrs, x[start:m.end()]))
    else:
        depth -= 1
        if depth == 0: blocks.append((tag, a, x[start:m.end()]))
partes = []; titulo = None; primero = True
for t, attrs, rawb in blocks:
    h = re.search(r"heading='(\d)'", attrs)
    if t in ('paragraph', 'quote'):
        s = txt(rawb)
        if not s: continue
        if h and h.group(1) == '1': titulo = s; continue
        if primero and re.match(r'^\d{4}-\d{2}-\d{2}', s): primero = False; continue
        partes.append({'t': 'sub' if h else 'dic', 'x': s})
    elif t == 'list':
        partes.append({'t': 'lista', 'x': [txt(i) for i in re.findall(r'<listItem\b.*?</listItem>', rawb, re.S)]})
    elif t == 'table':
        partes.append({'t': 'tabla', 'x': [[txt(c) for c in re.findall(r'<cell\b.*?</cell>', r, re.S)] for r in re.findall(r'<row\b.*?</row>', rawb, re.S)]})
cap = {'n': 10, 'titulo': 'Anexo: marco jurídico', 'min': 0, 'anexo': True, 'partes': partes}
json.dump(cap, open(sys.argv[2] if len(sys.argv) > 2 else 'src/data/marco.json', 'w'), ensure_ascii=False, indent=1)
print(titulo, len(partes), sum(len(p['x']) if p['t'] != 'tabla' else 0 for p in partes if isinstance(p['x'], str)))
