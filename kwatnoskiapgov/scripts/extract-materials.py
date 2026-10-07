"""Rebuild classroom data and original card images from the supplied print materials.
Run with a Python environment containing pymupdf; optional first argument: source directory.
"""
import pathlib, sys, re, json, zipfile, xml.etree.ElementTree as E
import pymupdf as pdf
root=pathlib.Path(__file__).resolve().parents[1]
source=pathlib.Path(sys.argv[1]) if len(sys.argv)>1 else root/'public/materials'
def file(name,ext):
    p=source/(name+' (1).'+ext)
    return p if p.exists() else (source/(name+'.'+ext) if (source/(name+'.'+ext)).exists() else root/(name+'.'+ext))
def norm(s): return re.sub(r'[^a-z0-9]','',s.lower())
groups=re.findall(r'id: "([^"]+)", name: "([^"]+)"', (root/'src/data/voterGroups.ts').read_text())
alias={norm(n):i for i,n in groups}
alias.update({norm(n):i for n,i in [('Rural Farmers/Ranchers','rural-farmers'),('Secular/Religious','secular-non-religious'),('Labor','labor-unions'),('Asian American','asian-americans'),('Evangelical Voters','evangelical-christians'),('Evangelical Christian','evangelical-christians'),('Non-College Whites','white-non-college'),('Coporate Executives','corporate-executives'),('Small Buisness Owners','small-business-owners')]})
def group(n):
    if norm(n) not in alias: raise ValueError('Unknown voter group '+n)
    return alias[norm(n)]
seed=(root/'src/data/states.ts').read_text()
stateids={name:id for id,name in re.findall(r'id: "([A-Z]+)", name: "([^"]+)"',seed)}
stateids['Washington D.C.']='DC'; stateids['Washington, DC']='DC'; stateids['Washington, D.C.']='DC'
stateids['Washington D.C']='DC'
ev={id:int(n) for id,n in re.findall(r'id: "([A-Z]+)"[^\n]+?electoralVotes: (\d+)',seed)}
assets=root/'public/cards'; assets.mkdir(parents=True,exist_ok=True)
ss=[]; cc=[]
for kind,name in [('state','State Cards'),('strategy','Strategy and Event Cards')]:
 d=pdf.open(file(name,'pdf'))
 for page in range(0,len(d),2):
  for row in range(3):
   for col in range(3):
    rect=pdf.Rect(col*204,row*264,(col+1)*204,(row+1)*264)
    spans=[s for b in d[page].get_text('dict',clip=rect)['blocks'] for l in b.get('lines',[]) for s in l['spans']]
    txt=d[page].get_text(clip=rect)
    if not txt.strip(): continue
    if kind=='state':
     lines=txt.splitlines(); printedEV=next((int(l.rstrip('*')) for l in lines if l.rstrip('*').isdigit()),None)
     if printedEV is None: continue
     title=next((n for n in sorted(stateids,key=len,reverse=True) if n in ' '.join(txt.split())),None)
     if title is None: raise ValueError(txt)
     id=stateids[title]; raw=[]
     for n,v in re.findall(r'([A-Za-z /\-]+)\.+\s*(\d+)%',txt): raw.append({'voterGroupId':group(n),'percentage':int(v)})
     assert len(raw)>3,txt
     total=sum(x['percentage'] for x in raw)
     # Largest remainder keeps a 100-delegate state when printed percentages have a typo.
     values=[x['percentage']*100/total for x in raw]; scores=[int(v) for v in values]
     for idx in sorted(range(len(raw)),key=lambda i:values[i]-scores[i],reverse=True)[:100-sum(scores)]: scores[idx]+=1
     printedSpan=next(s for s in spans if s['text'].strip().rstrip('*')==str(printedEV))
     color=printedSpan['color'] # numbers are white; colored polygon holds the lean
     center=pdf.Point((printedSpan['bbox'][0]+printedSpan['bbox'][2])/2,(printedSpan['bbox'][1]+printedSpan['bbox'][3])/2)
     fills=[p['fill'] for p in d[page].get_drawings() if p.get('fill') and p['rect'].contains(center) and p['rect'].width<100]
     fill=fills[-1] if fills else None
     # Some imported PDF octagons are images; use the original state silhouette color if needed.
     if fill:
      r,g,b=fill; lean='red' if r>b*1.5 else ('purple' if r>b*.2 else 'blue')
     else: raise ValueError('No lean '+id)
     primary='closed' if 'Closed' in txt else 'open'
     ss.append({'id':id,'name':title,'electoralVotes':ev[id],'printedElectoralVotes':printedEV,'primaryType':primary,'safeColor':lean,'voterGroups':[dict(x,percentage=scores[i],printedPercentage=x['percentage']) for i,x in enumerate(raw)],'printedTotal':total,'page':page+1,'image':f'cards/state-{id}.png'})
     d[page].get_pixmap(matrix=pdf.Matrix(1.5,1.5),clip=rect).save(str(assets/f'state-{id}.png'))
    else:
     num=page//2*9+row*3+col+1
     types={'ENDORSEMENT':'Endorsement','PLATFORM IDEAS':'Platform Idea','IMPORTANT EVENTS':'Important Event','SCANDALS':'Scandal','DEBATES':'Debate','SPEECHES':'Speech','CAMPAIGN COVER-UP':'Campaign Cover-Up'}
     flat=' '.join(txt.split()); typ=next((v for k,v in types.items() if k in flat),None)
     assert typ,(num,txt)
     title=' '.join(s['text'].strip() for s in spans if s['size']>14.5 and 'COVER' not in s['text'] and 'CAMPAIGN' not in s['text'])
     if num==119: title='Supreme Court School Prayer Ruling'
     if typ=='Campaign Cover-Up': title='Campaign Cover-Up'
     desc=' '.join(s['text'].strip() for s in spans if 'Regular' in s['font'])
     effectText=' '.join(s['text'].strip() for s in spans if s['size']<=14.5 and 'Bold' in s['font'] and s['text'].strip() not in types)
     for k in types: effectText=effectText.replace(k,'')
     effects=[]
     for n,sign,v in re.findall(r'([A-Z /\-]+?)\s*([+-])\s*(\d+)',effectText):
      if 'GROUP' in n or not n.strip(): continue
      effects.append({'voterGroupId':group(n.strip()),'delta':int(v)*(1 if sign=='+' else -1)})
     special={145:'all',156:'skip',159:'double',184:'choose'}.get(num,'cover' if typ=='Campaign Cover-Up' else None)
     if special=='all': effects=[{'voterGroupId':i,'delta':2} for i,n in groups]
     assert title and (effects or special),(num,title,effectText)
     cc.append({'id':f'card-{num}','title':title,'type':typ,'description':desc,'effects':effects,'special':special,'page':page+1,'image':f'cards/card-{num}.png'})
     d[page].get_pixmap(matrix=pdf.Matrix(1.3,1.3),clip=rect).save(str(assets/f'card-{num}.png'))
ns={'a':'http://schemas.openxmlformats.org/drawingml/2006/main','p':'http://schemas.openxmlformats.org/presentationml/2006/main'}
with zipfile.ZipFile(file('Voter Group Board','pptx')) as z:
 e=E.fromstring(z.read('ppt/slides/slide1.xml')); labels=[]
 for s in e.findall('.//p:sp',ns):
  txt=' '.join(t.text or '' for t in s.findall('.//a:t',ns)); off=s.find('.//a:xfrm/a:off',ns)
  if norm(txt) in alias: labels.append((int(off.attrib['x']),int(off.attrib['y']),group(txt)))
 base={}
 for t in e.findall('.//p:graphicFrame',ns):
  off=t.find('.//a:off',ns); x,y=int(off.attrib['x']),int(off.attrib['y'])
  label=min((l for l in labels if l[1]<y),key=lambda l:abs(l[0]-x)+abs(l[1]-y))
  colors=[c.find('./a:tcPr/a:solidFill/a:srgbClr',ns).attrib['val'] for c in t.findall('.//a:tc',ns)]
  base[label[2]]={'blue':colors.count('CFE2F3'),'red':colors.count('F4CCCC')}
assert len(ss)==51 and len(cc)==198 and len(base)==19
(root/'src/classroom/materials.json').write_text(json.dumps({'states':ss,'cards':cc,'base':base},indent=2)+'\n')
print('Extracted',len(ss),'states,',len(cc),'cards and',len(base),'board groups')
print('Corrections:',[(s['name'],s['printedTotal'],s['printedElectoralVotes'],s['electoralVotes']) for s in ss if s['printedTotal']!=100 or s['printedElectoralVotes']!=s['electoralVotes']])
print('Base',base)
