const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const {JSDOM}=require('jsdom');
require('../extension/core.js');require('../extension/filter.js');const S=Stripper;
const fixtures={
 google:'<nav><a href="/search?q=x&udm=50">AI Mode</a><a href="/search?q=x&udm=2">Images</a></nav><div id="Odp5De"><h2>AI Overview</h2><p>Generated summary</p></div><div id="rso"><div class="g"><a href="https://example.org"><h3>AI Mode: a review</h3></a></div><div class="g"><h3>Ordinary result</h3></div></div>',
 bing:'<nav><a id="b-scopeListItem-conv" href="/chat?q=x">Copilot</a></nav><div id="b_results"><div class="b_ans b_syd"><h2>Copilot answer</h2></div><li class="b_algo"><a href="https://example.org"><h3>Copilot news</h3></a></li></div>',
 duckduckgo:'<nav><a href="/?q=x&ia=chat">Duck.ai</a></nav><section data-testid="search-assist"><h2>Search Assist</h2><p>Generated answer</p></section><article data-testid="result"><h3>Search Assist review</h3></article>',
 brave:'<nav><a href="/ask?q=x">Ask Brave</a></nav><section id="summarizer"><h2>AI answer</h2></section><div class="snippet" data-type="web"><h3>Ask Brave review</h3></div>'
};
const urls={google:'https://www.google.com/search?q=x',bing:'https://www.bing.com/search?q=x',duckduckgo:'https://duckduckgo.com/?q=x',brave:'https://search.brave.com/search?q=x'};
for(const engine of Object.keys(fixtures))test(`${engine}: hides answer and shortcut, preserves organic results`,()=>{
 const {window}=new JSDOM(fixtures[engine],{url:urls[engine]});const found=S.collect(window.document,engine,S.normalize(),urls[engine]);
 assert.equal(found.size,2);assert.equal([...found].some(n=>n.textContent.includes('review')||n.textContent.includes('Ordinary result')),false);
 assert.equal(S.collect(window.document,engine,S.normalize({enabled:false}),urls[engine]).size,0);
 assert.equal(S.collect(window.document,engine,S.normalize({engines:{[engine]:false}}),urls[engine]).size,0);
 assert.equal(S.collect(window.document,engine,S.normalize({hidePanels:false}),urls[engine]).size,1);
 assert.equal(S.collect(window.document,engine,S.normalize({hideShortcuts:false}),urls[engine]).size,1);window.close();
});
test('semantic fallback cannot hide a results container or a normal linked heading',()=>{
 const {window}=new JSDOM('<main><h2>AI Overview</h2><div class="g"><h3>News</h3></div></main><section><a href="/article"><h2>AI Overview</h2></a></section><section id="actual"><h2>AI Overview</h2><p>Generated</p></section>');
 const found=S.collect(window.document,'google',S.normalize(),urls.google);assert.deepEqual([...found].map(n=>n.id),['actual']);window.close();
});
test('nested shortcuts count once and malformed URLs do not abort filtering',()=>{
 const {window}=new JSDOM('<div id="Odp5De"><h2>AI Overview</h2><a href="/aimode">AI Mode</a></div><a href="http://[">ordinary</a>');assert.equal(S.collect(window.document,'google',S.normalize(),urls.google).size,1);window.close();
});
test('content lifecycle: late insertion, pause, resume, removal and stored preferences',async()=>{
 const dom=new JSDOM(fixtures.google,{url:urls.google,runScripts:'outside-only'});const w=dom.window;let settings=S.normalize();const changes=[],messages=[];
 w.chrome={storage:{local:{get:async()=>({settings})},onChanged:{addListener:fn=>changes.push(fn)}},runtime:{onMessage:{addListener:fn=>messages.push(fn)}}};
 for(const f of ['core','filter','content'])w.eval(fs.readFileSync(`extension/${f}.js`,'utf8'));
 const settle=()=>new Promise(resolve=>setTimeout(resolve,130));await settle();
 const hidden=()=>w.document.querySelectorAll('[data-stripper-hidden]').length;assert.equal(hidden(),2);assert.equal(w.getComputedStyle(w.document.getElementById('Odp5De')).display,'none');
 const late=w.document.createElement('section');late.innerHTML='<h2>AI Overview</h2><p>late answer</p>';w.document.body.append(late);await settle();assert.equal(hidden(),3);
 settings=S.normalize({enabled:false});changes[0]({settings:{newValue:settings}},'local');assert.equal(hidden(),0);assert.notEqual(w.getComputedStyle(late).display,'none');
 settings=S.normalize();changes[0]({settings:{newValue:settings}},'local');assert.equal(hidden(),3);
 late.remove();await settle();let status;messages[0]({type:'stripper:status'},{},s=>status=s);assert.equal(status.hidden,2);
 w.document.getElementById('Odp5De').id='now-ordinary';w.document.querySelector('#now-ordinary h2').textContent='Ordinary result';await settle();assert.equal(hidden(),1);w.close();
});
test('stored pause prevents hiding during startup',async()=>{
 const dom=new JSDOM(fixtures.google,{url:urls.google,runScripts:'outside-only'});const w=dom.window;
 w.chrome={storage:{local:{get:async()=>({settings:{enabled:false}})},onChanged:{addListener(){}}},runtime:{onMessage:{addListener(){}}}};
 for(const f of ['core','filter','content'])w.eval(fs.readFileSync(`extension/${f}.js`,'utf8'));await new Promise(r=>setTimeout(r,100));assert.equal(w.document.querySelectorAll('[data-stripper-hidden]').length,0);w.close();
});
test('current Bing and DuckDuckGo panel structures are hidden without relying on headings',()=>{
 for(const [engine,html,id] of [['bing','<div id="copans_container"><div id="ca_main"><h2><a>Copilot Search Branding</a></h2><p>Generated</p></div></div><ol id="b_results"><li class="b_algo"><h2>Original</h2></li></ol>','copans_container'],['duckduckgo','<div data-react-module-id="wikinlp" id="answer"><button aria-label="Learn more about Search Assist and Explore More"></button><p>Generated</p></div><article data-testid="result"><h2>Original</h2></article>','answer']]){
 const {window}=new JSDOM(html);const found=S.collect(window.document,engine,S.normalize(),urls[engine]);assert.deepEqual([...found].map(n=>n.id),[id]);window.close();
 }
});

const adFixtures={
 google:'<div id="tads"><div data-text-ad="1"><h3>Paid text listing</h3></div></div><div class="cu-container"><div data-pla="1"><h3>Sponsored products</h3><a>Product</a></div></div><div id="rso"><div class="g" id="organic"><h3>Sponsored results: a guide</h3><p>Ad agencies and running shoes</p></div></div>',
 bing:'<ol id="b_results"><li class="b_ad"><h2>Paid listing</h2></li><li class="b_algo" id="organic"><h2>Sponsored results: a guide</h2></li></ol>',
 duckduckgo:'<div id="links"><article data-testid="ad" class="result--ad"><h2>Paid listing</h2></article><article data-testid="result" id="organic"><h2>Sponsored results: a guide</h2></article></div>',
 brave:'<div id="results"><div class="snippet" data-type="ad"><h3>Paid listing</h3></div><div class="snippet" data-type="web" id="organic"><h3>Sponsored results: a guide</h3></div></div>'
};
for(const engine of Object.keys(adFixtures))test(`${engine}: paid placements hide independently; ordinary and mixed results stay visible`,()=>{
 const {window:w}=new JSDOM(adFixtures[engine],{url:urls[engine]});
 const collect=patch=>S.collect(w.document,engine,S.normalize({hidePanels:false,hideShortcuts:false,...patch}),urls[engine]);
 assert.equal(collect().size,engine==='google'?2:1);
 assert.equal([...collect()].some(n=>n.contains(w.document.getElementById('organic'))),false);
 assert.equal(collect({hideSponsored:false}).size,0);
 assert.equal(collect({enabled:false}).size,0);
 assert.equal(collect({engines:{[engine]:false}}).size,0);
 const mixed=w.document.createElement('div');mixed.innerHTML=adFixtures[engine];mixed.className=engine==='bing'?'b_ad':engine==='google'?'cu-container':'snippet';
 if(engine==='google')mixed.setAttribute('data-text-ad','1');
 if(engine==='duckduckgo')mixed.setAttribute('data-testid','ad');
 if(engine==='brave')mixed.setAttribute('data-type','ad');
 w.document.body.append(mixed);assert.equal(collect().has(mixed),false);w.close();
});
test('sponsored lifecycle: new ad attributes, late cards, independent toggle and restoration',async()=>{
 const dom=new JSDOM('<div id="card"><h3>Paid listing</h3></div><div class="g" id="organic"><h3>Sponsored news</h3></div><section id="Odp5De"><h2>AI Overview</h2></section>',{url:urls.google,runScripts:'outside-only'}),w=dom.window;let changed;
 w.chrome={storage:{local:{get:async()=>({settings:{}})},onChanged:{addListener:fn=>changed=fn}},runtime:{onMessage:{addListener(){}}}};
 for(const f of ['core','filter','content'])w.eval(fs.readFileSync(`extension/${f}.js`,'utf8'));
 const settle=()=>new Promise(r=>setTimeout(r,130));await settle();
 const card=w.document.getElementById('card');assert.equal(card.hasAttribute('data-stripper-hidden'),false);
 card.setAttribute('data-text-ad','1');await settle();assert.equal(w.getComputedStyle(card).display,'none');
 const late=w.document.createElement('div');late.setAttribute('data-text-ad','1');late.textContent='Late paid listing';w.document.body.append(late);await settle();assert.equal(w.getComputedStyle(late).display,'none');
 changed({settings:{newValue:{hideSponsored:false}}},'local');assert.notEqual(w.getComputedStyle(card).display,'none');assert.notEqual(w.getComputedStyle(late).display,'none');assert.equal(w.getComputedStyle(w.document.getElementById('Odp5De')).display,'none');
 changed({settings:{newValue:{hideSponsored:true}}},'local');assert.equal(w.getComputedStyle(card).display,'none');card.removeAttribute('data-text-ad');await settle();assert.notEqual(w.getComputedStyle(card).display,'none');assert.notEqual(w.getComputedStyle(w.document.getElementById('organic')).display,'none');w.close();
});

test('Firefox browser namespace restores filtering through real-shaped storage and message events',async()=>{
 const dom=new JSDOM(fixtures.google,{url:urls.google,runScripts:'outside-only'}),w=dom.window;let changed,message;
 w.browser={runtime:{id:'stripper@grandmastr.github.io',onMessage:{addListener:fn=>message=fn}},storage:{local:{get:async()=>({settings:{}})},onChanged:{addListener:fn=>changed=fn}}};
 for(const f of ['core','filter','content'])w.eval(fs.readFileSync(`extension/${f}.js`,'utf8'));await new Promise(r=>setTimeout(r,100));let status;message({type:'stripper:status'},{},r=>status=r);assert.equal(status.hidden,2);assert.equal(status.enabled,true);changed({settings:{newValue:{enabled:false}}},'local');message({type:'stripper:status'},{},r=>status=r);assert.equal(status.hidden,0);assert.equal(status.enabled,false);w.close();
});
