const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const zlib = require('node:zlib');
require('../extension/core.js');
const root = path.resolve(__dirname, '..');
const matches = Stripper.googleDomains.flatMap(tld => [`https://google.${tld}/*`, `https://www.google.${tld}/*`]).concat(['https://www.bing.com/*','https://bing.com/*','https://duckduckgo.com/*','https://www.duckduckgo.com/*','https://search.brave.com/*','https://safe.search.brave.com/*']);
const manifest = {
  manifest_version: 3, name: 'Stripper — Search without AI', version: '1.0.0',
  description: 'Hide AI Overviews, AI Mode shortcuts, Copilot panels and sponsored search results. Private and configurable.',
  permissions: ['storage', 'activeTab'],
  browser_specific_settings: {gecko: {id: 'stripper@grandmastr.github.io', strict_min_version: '142.0', data_collection_permissions: {required: ['none']}}},
  action: {default_title:'Stripper — Search without AI', default_popup:'popup.html', default_icon:{16:'icons/16.png',32:'icons/32.png',48:'icons/48.png',128:'icons/128.png'}},
  icons: {16:'icons/16.png',32:'icons/32.png',48:'icons/48.png',128:'icons/128.png'},
  content_scripts: [{matches, js:['core.js','filter.js','content.js'],run_at:'document_start'}],
  content_security_policy: {extension_pages: "script-src 'self'; object-src 'none'"}
};
fs.writeFileSync(path.join(root,'extension/manifest.json'), JSON.stringify(manifest,null,2)+'\n');
// Dependency-free raster mark: three diminishing paper strips on an ink tile.
function crc(buf) {let c=0xffffffff;for(const b of buf){c^=b;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;}
function chunk(type,data){const t=Buffer.from(type),l=Buffer.alloc(4),c=Buffer.alloc(4);l.writeUInt32BE(data.length);c.writeUInt32BE(crc(Buffer.concat([t,data])));return Buffer.concat([l,t,data,c]);}
for(const size of [16,32,48,128]){
 const raw=Buffer.alloc((size*4+1)*size);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const nx=x/size,ny=y/size;
  const stripe=(ny>.26&&ny<.36&&nx>.22&&nx<.78)||(ny>.45&&ny<.55&&nx>.22&&nx<.65)||(ny>.64&&ny<.74&&nx>.22&&nx<.5);
  const col=stripe?[251,250,247,255]:[34,37,31,255]; const off=y*(size*4+1)+1+x*4;col.forEach((v,i)=>raw[off+i]=v);
 }
 const hdr=Buffer.alloc(13);hdr.writeUInt32BE(size);hdr.writeUInt32BE(size,4);hdr[8]=8;hdr[9]=6;
 fs.writeFileSync(path.join(root,`extension/icons/${size}.png`),Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',hdr),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]));
}
fs.mkdirSync(path.join(root,'dist'),{recursive:true});
const zip=path.join(root,'dist/stripper-1.0.0.zip');
if(fs.existsSync(zip))fs.unlinkSync(zip);
cp.execFileSync('zip',['-q','-r',zip,'.'],{cwd:path.join(root,'extension')});
fs.copyFileSync(zip, path.join(root,'dist/stripper-firefox-1.0.0.zip'));
console.log(`Built ${zip} (${fs.statSync(zip).size} bytes). Load unpacked: ${path.join(root,'extension')}`);
