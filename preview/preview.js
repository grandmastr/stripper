const frame=document.getElementById('results');
let resolveReady; window.previewReady=new Promise(resolve=>resolveReady=resolve);
window.previewSettings=Stripper.normalize(JSON.parse(localStorage.getItem('stripper-preview')||'null'));
function apply(){const w=frame.contentWindow;if(!w.Stripper?.collect)return;const doc=w.document;doc.querySelectorAll('[data-stripper-hidden]').forEach(n=>n.removeAttribute('data-stripper-hidden'));const found=w.Stripper.collect(doc,'google',window.previewSettings,'https://www.google.com/search?q=sky');for(const n of found)n.setAttribute('data-stripper-hidden','true');document.getElementById('ai-count').textContent=[...doc.querySelectorAll('#Odp5De,section,[href*="udm=50"]')].filter(n=>!n.closest('[data-stripper-hidden]')).length;document.getElementById('organic-count').textContent=doc.querySelectorAll('.g:not([data-stripper-hidden])').length;return found.size;}
window.previewSave=settings=>{window.previewSettings=settings;localStorage.setItem('stripper-preview',JSON.stringify(settings));apply();};
window.previewStatus=()=>({engine:'google',enabled:window.previewSettings.enabled&&window.previewSettings.engines.google,hidden:apply()||0});
frame.addEventListener('load',async()=>{const doc=frame.contentDocument;const style=doc.createElement('style');style.textContent='[data-stripper-hidden="true"]{display:none!important}';doc.head.append(style);for(const file of ['core','filter'])await new Promise(resolve=>{const s=doc.createElement('script');s.src=`/extension/${file}.js`;s.onload=resolve;doc.head.append(s);});apply();resolveReady();});
document.getElementById('add').onclick=()=>{const n=frame.contentDocument.createElement('section');n.innerHTML='<h2>AI Overview</h2><p>A newly loaded AI panel. The filter applies here too.</p>';frame.contentDocument.body.append(n);apply();};

frame.src=frame.dataset.src;document.getElementById("popup").src=document.getElementById("popup").dataset.src;
