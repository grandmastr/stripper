const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const {JSDOM}=require('jsdom');
async function popup(stored={},failSave=false,namespace='chrome'){
 const dom=new JSDOM(fs.readFileSync('extension/popup.html','utf8'),{url:'https://extension.test/popup.html',runScripts:'outside-only'}),w=dom.window;let settings=stored;const writes=[];
 w.structuredClone=structuredClone;
 w[namespace]={runtime:{id:"stripper@grandmastr.github.io"},storage:{local:{get:async()=>({settings}),set:async data=>{if(failSave)throw Error('disk unavailable');settings=data.settings;writes.push(data.settings);}}},tabs:{query:async()=>[{id:2,url:'https://www.google.com/search?q=test'}],sendMessage:async()=>({engine:'google',enabled:settings.enabled!==false,hidden:settings.enabled===false?0:2})}};
 for(const f of ['core','popup'])w.eval(fs.readFileSync(`extension/${f}.js`,'utf8'));await new Promise(r=>setTimeout(r,10));return {w,writes};
}
test('popup loads persisted settings, saves switches and reports the active page',async()=>{
 const {w,writes}=await popup({enabled:false,engines:{bing:false}});
 assert.equal(w.document.querySelector('#enabled').checked,false);assert.equal(w.document.querySelector('#engine-bing').checked,false);assert.equal(w.document.querySelector('#page-count').textContent,'Paused on this engine');
 w.document.querySelector('#enabled').click();await new Promise(r=>setTimeout(r,10));assert.equal(writes.length,1);assert.equal(writes[0].enabled,true);assert.equal(writes[0].engines.bing,false);assert.equal(w.document.querySelector('#page-count').textContent,'2 elements hidden on this page');w.close();
});
test('popup serializes quick changes and preserves engine preferences',async()=>{
 const {w,writes}=await popup();w.document.querySelector('#hidePanels').click();w.document.querySelector('#engine-google').click();w.document.querySelector('#googleWeb').click();await new Promise(r=>setTimeout(r,20));
 assert.equal(writes.length,3);assert.equal(writes[2].hidePanels,false);assert.equal(writes[2].engines.google,false);assert.equal(writes[2].googleWeb,true);w.close();
});
test('save failure displays an error and restores persisted controls',async()=>{
 const {w}=await popup({enabled:true},true);w.document.querySelector('#enabled').click();await new Promise(r=>setTimeout(r,10));assert.match(w.document.querySelector('#feedback').textContent,/Could not save/);assert.equal(w.document.querySelector('#enabled').checked,true);w.close();
});
test('sponsored preference upgrades existing settings and saves independently',async()=>{
 const {w,writes}=await popup({enabled:true,hidePanels:false});assert.equal(w.document.querySelector('#hideSponsored').checked,true);
 w.document.querySelector('#hideSponsored').click();await new Promise(r=>setTimeout(r,10));assert.equal(writes[0].hideSponsored,false);assert.equal(writes[0].hidePanels,false);assert.equal(writes[0].enabled,true);w.close();
 const reopened=await popup({hideSponsored:false});assert.equal(reopened.w.document.querySelector('#hideSponsored').checked,false);reopened.w.close();
});

test('Firefox browser namespace supports popup storage and content messages without chrome',async()=>{
 const {w,writes}=await popup({hideSponsored:false},false,'browser');assert.equal(w.chrome,undefined);assert.equal(w.document.querySelector('#hideSponsored').checked,false);assert.equal(w.document.querySelector('#page-count').textContent,'2 elements hidden on this page');w.document.querySelector('#hideSponsored').click();await new Promise(r=>setTimeout(r,10));assert.equal(writes[0].hideSponsored,true);w.close();
});
