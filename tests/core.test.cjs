const {test} = require('node:test'); const assert = require('node:assert/strict');
require('../extension/core.js'); const S=globalThis.Stripper;
test('only exact supported search hosts and paths are accepted',()=>{
 for(const [url,engine] of [['https://www.google.com/search?q=x','google'],['https://google.com.ng/search?q=x','google'],['https://www.bing.com/search?q=x','bing'],['https://duckduckgo.com/?q=x','duckduckgo'],['https://search.brave.com/search?q=x','brave']]) assert.equal(S.engineFor(url),engine);
 for(const url of ['https://google.com.evil.org/search?q=x','https://docs.google.com/search','https://www.google.com/maps','https://www.bing.com/images/search?q=x','https://duckduckgo.com/settings','file:///search','not a url']) assert.equal(S.engineFor(url),null);
});
test('malformed stored values cannot enable settings or corrupt defaults',()=>{
 assert.deepEqual(S.normalize(null),S.defaults);assert.equal(S.normalize({enabled:'false'}).enabled,true);
 const s=S.normalize({engines:{google:false,bogus:true}});assert.equal(s.engines.google,false);assert.equal(s.engines.bing,true);assert.equal(S.defaults.engines.google,true);
});
test('Google AI Mode redirects retain the query and use Web results once',()=>{
 const u=S.redirectFor('https://www.google.com/search?q=cats&udm=50&hl=fr&aep=1',{}); const url=new URL(u);
 assert.equal(url.searchParams.get('q'),'cats');assert.equal(url.searchParams.get('hl'),'fr');assert.equal(url.searchParams.get('udm'),'14');assert.equal(url.searchParams.has('aep'),false);assert.equal(S.redirectFor(u,{}),null);
 assert.equal(S.redirectFor('https://www.google.com/aimode',{}),'https://www.google.com/');
});
test('Web-only mode is opt-in and preserves explicit vertical filters',()=>{
 const input='https://www.google.com/search?q=sky';assert.equal(S.redirectFor(input,{}),null);assert.equal(new URL(S.redirectFor(input,{googleWeb:true})).searchParams.get('udm'),'14');
 for(const suffix of ['&tbm=isch','&tbm=nws','&udm=2','&udm=7','&udm=14','&udm=50'])assert.equal(S.redirectFor(input+suffix,{googleWeb:true,redirectAI:false}),null);
});
test('disabled extension, engine and redirect control leave URLs untouched',()=>{
 const input='https://www.google.com/search?q=x&udm=50';for(const settings of [{enabled:false},{engines:{google:false}},{redirectAI:false}])assert.equal(S.redirectFor(input,settings),null);
});
test('Bing, DuckDuckGo and Brave AI URLs return to ordinary search',()=>{
 for(const [input,expected] of [['https://www.bing.com/copilotsearch?q=sky','https://www.bing.com/search?q=sky'],['https://duckduckgo.com/?q=sky&ia=chat','https://duckduckgo.com/?q=sky&ia=web'],['https://search.brave.com/ask?q=sky','https://search.brave.com/search?q=sky']]){assert.equal(S.redirectFor(input,{}),expected);assert.equal(S.redirectFor(expected,{}),null);}
});
