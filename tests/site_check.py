from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://amounthub.com'

class Page(HTMLParser):
    def __init__(self):
        super().__init__(); self.links=[]; self.ids=set(); self.h1=0; self.title=0; self.description=[]; self.canonical=[]; self.ads=[]
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if 'id' in a: self.ids.add(a['id'])
        if tag=='a': self.links.append(a.get('href',''))
        if tag in ('script','link'): self.links.append(a.get('src',a.get('href','')))
        if tag=='h1': self.h1+=1
        if tag=='title': self.title+=1
        if tag=='meta' and a.get('name')=='description': self.description.append(a.get('content',''))
        if tag=='link' and a.get('rel')=='canonical': self.canonical.append(a.get('href',''))
        if tag=='script' and 'adsbygoogle.js' in a.get('src',''): self.ads.append(a['src'])

def local(url):
    u=urlsplit(url)
    if u.scheme and u.netloc!='amounthub.com': return None
    path=unquote(u.path)
    if not path.startswith('/'):return None
    file=ROOT/path.lstrip('/')
    return file/'index.html' if path.endswith('/') else file

errors=[]; pages=list(ROOT.rglob('*.html'))
for file in pages:
    if '/tests/' in str(file) or file==ROOT/'privacy/index.html':continue
    p=Page();p.feed(file.read_text())
    route='/' if file==ROOT/'index.html' else '/'+str(file.relative_to(ROOT)).replace('index.html','')
    if file.name!='index.html': route='/'+str(file.relative_to(ROOT))
    expected=BASE+route
    if p.h1!=1 or p.title!=1 or len(p.description)!=1 or not p.description[0]:errors.append(f'{file}: heading/title/description')
    if p.canonical!=[expected]:errors.append(f'{file}: canonical {p.canonical} expected {expected}')
    if not {'/calculators/','/about/','/methodology/','/privacy.html','/terms/'}.issubset(p.links):errors.append(f'{file}: missing navigation/footer link')
    for link in p.links:
        target=local(link)
        if target is not None and not target.is_file():errors.append(f'{file}: broken {link}')
    if file.parent.name.endswith('-calculator') and (not p.ads or not {'length','width','depth','calculateBtn','result','error'}.issubset(p.ids)):
        if file.parent.name not in ('paint-calculator','tile-calculator','flooring-calculator','drywall-calculator','brick-calculator','paver-calculator'):
            errors.append(f'{file}: calculator controls or AdSense missing')

ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'}
urls=[e.text for e in ET.parse(ROOT/'sitemap.xml').findall('s:url/s:loc',ns)]
if len(urls)!=len(set(urls)): errors.append('duplicate sitemap URL')
for url in urls:
    f=local(url)
    if f is None or not f.is_file():errors.append(f'sitemap missing {url}')
for p in pages:
    if p==ROOT/'privacy/index.html':continue
    page=Page();page.feed(p.read_text())
    if page.canonical and page.canonical[0] not in urls:errors.append(f'canonical absent from sitemap: {p}')
for f in ('CNAME','ads.txt','robots.txt'):
    if not (ROOT/f).is_file():errors.append(f'missing {f}')
if errors:
    print('\n'.join(errors));raise SystemExit(1)
print(f'Checked {len(pages)} pages, {len(urls)} sitemap entries and all local links.')
