/* Send: the phone's share sheet (Messages, WhatsApp, Kakao) first, copy as the backup.
   window.send150({title,text,url}, button) */
(function(){
async function copy(t){
  try{await navigator.clipboard.writeText(t);return true}catch(e){}
  const a=document.createElement("textarea");a.value=t;a.setAttribute("readonly","");a.style.cssText="position:fixed;top:0;left:0;opacity:0";
  document.body.appendChild(a);a.select();a.setSelectionRange(0,t.length);
  let ok=false;try{ok=document.execCommand("copy")}catch(e){}
  a.remove();return ok;
}
window.canShare150=!!navigator.share;
window.send150=async function(d,btn){
  if(navigator.share){
    try{await navigator.share(d);return}catch(e){if(e&&e.name==="AbortError")return}
  }
  const ok=await copy([d.text,d.url].filter(Boolean).join("\n"));
  if(btn){const was=btn.dataset.label||btn.textContent;btn.dataset.label=was;btn.textContent=ok?"Copied":"Couldn't copy";setTimeout(()=>btn.textContent=was,1800)}
};
})();

/* The host panel, the same on every tool:
   Send to the group (big), the link with Copy (one quiet row), then one row of small actions,
   Delete last, and a one-line note. Hooks the apps listen for: #share, [data-copy], #delEv, plus
   any extra action ids passed in (e.g. copyList).
   hostPanel({ url, hostUrl, edit: {href, label}, extra: [{id, label}] }) -> html */
(function(){
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
window.hostPanel=function(o){
  const acts=[
    o.edit&&`<a href="${esc(o.edit.href)}">${esc(o.edit.label||"Edit")}</a>`,
    ...(o.extra||[]).map(a=>`<button type="button" id="${esc(a.id)}" data-label="${esc(a.label)}">${esc(a.label)}</button>`),
    `<button type="button" data-copy="${esc(o.hostUrl)}" data-label="Copy host link">Copy host link</button>`,
    `<button type="button" class="del" id="delEv">Delete</button>`,
  ].filter(Boolean);
  return `<div class="band hostband"><div class="wrap"><div class="hp">
    <span class="hp-h">You're the host</span>
    <button class="btn send" id="share" type="button">${window.canShare150?"Send to the group":"Copy the link"}</button>
    <div class="hp-link"><code>${esc(o.url)}</code><button type="button" data-copy="${esc(o.url)}" data-label="Copy">Copy</button></div>
    <div class="hp-acts">${acts.join("")}</div>
    <p class="hp-note">Only this browser can manage it. Open your host link to manage from another phone.</p>
  </div></div></div>`;
};
})();
