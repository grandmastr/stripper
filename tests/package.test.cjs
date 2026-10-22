const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');
const m=JSON.parse(fs.readFileSync('extension/manifest.json','utf8'));
test('MV3 package declares only local assets and scoped search hosts',()=>{
 assert.equal(m.manifest_version,3);assert.deepEqual(m.permissions,['storage','activeTab']);
 for(const path of [...m.content_scripts[0].js,m.action.default_popup,...Object.values(m.icons)])assert.ok(fs.existsSync('extension/'+path),path);
 assert.ok(m.content_scripts[0].matches.includes('https://www.google.com.ng/*'));assert.ok(!JSON.stringify(m).includes('<all_urls>'));
 for(const f of ['core','filter','content','popup'])assert.doesNotMatch(fs.readFileSync(`extension/${f}.js`,'utf8'),/\bfetch\s*\(|XMLHttpRequest|sendBeacon|\beval\s*\(/);
 assert.ok(!fs.existsSync('extension/shim.js'));
});

test('Firefox manifest declares stable identity, supported minimum and no data transmission',()=>{
 assert.deepEqual(m.browser_specific_settings.gecko,{id:'stripper@grandmastr.github.io',strict_min_version:'142.0',data_collection_permissions:{required:['none']}});
});
