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
