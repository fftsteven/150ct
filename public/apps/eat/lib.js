/* Where to eat: storefront art and helpers. Plain script, sets window.E. */
(function(){
const PC={w:"#f4ead8",k:"#3a3633",y:"#f2c230",r:"#c62828",l:"#a9c7d8",b:"#8a5a2b",W:"#fffdf8",e:"#d9cbb3"};
const SHOP=["................","................",".kkkkkkkkkkkkkk.",".kwwwwyyyywwwwk.","rrWWrrWWrrWWrrWW","rrWWrrWWrrWWrrWW","rr..rr..rr..rr..",".kwwwwwwwwwwwwk.",".kwllllwwbbbbwk.",".kwlWllwwbbbbwk.",".kwllllwwbbbywk.",".kwllllwwbbbbwk.",".kweeeewwbbbbwk.",".kwwwwwwwbbbbwk.","eeeeeeeeeeeeeeee","................"];
const grid=rows=>rows.map((r,y)=>[...r].map((c,x)=>PC[c]?`<rect x="${x}" y="${y}" width="1" height="1" fill="${PC[c]}"/>`:"").join("")).join("");
const shop=()=>`<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">${grid(SHOP)}</svg>`;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const mapsUrl=name=>"https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(name);
async function copyText(t){
  try{await navigator.clipboard.writeText(t);return true}catch(e){}
  const a=document.createElement("textarea");a.value=t;a.setAttribute("readonly","");a.style.cssText="position:fixed;top:0;left:0;opacity:0";
  document.body.appendChild(a);a.select();a.setSelectionRange(0,t.length);
  let ok=false;try{ok=document.execCommand("copy")}catch(e){}
  a.remove();return ok;
}
// A pasted Google Maps link: ask the server for the place name. "" when it can't tell.
const looksLikeUrl=s=>/^https?:\/\//i.test(s.trim());
async function nameFromLink(u){
  try{const r=await fetch("/api/unfurl?u="+encodeURIComponent(u.trim()));const j=await r.json();return r.ok?(j.name||""):null}catch(e){return ""}
}
window.E={shop,esc,mapsUrl,copyText,looksLikeUrl,nameFromLink};
})();
