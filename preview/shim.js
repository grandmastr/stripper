// Preview-only API bridge. Never included in the extension package.
window.chrome={storage:{local:{get:async()=>({settings:parent.previewSettings}),set:async({settings})=>parent.previewSave(settings)}},tabs:{query:async()=>[{id:1,url:'https://www.google.com/search?q=sky'}],sendMessage:async()=>{await parent.previewReady;return parent.previewStatus()}}};
