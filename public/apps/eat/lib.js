/* Where to eat: fox art and helpers. Plain script, sets window.E. */
(function(){
const PC={o:"#e8862e",O:"#b85a14",w:"#f4ead8",k:"#3a3633",d:"#4a2210",y:"#f2c230",r:"#c62828"};
const FOX=["..o.......o.....","..oo.....oo.....","..ooo...ooo.....","..ooooooooo.....",".oowkoooowko....",".ooooooooooo....","..oowwwwwoo.....","...owwkwwo......","....owwwo....oo.","....ooooo...ooo.","...ooooooo.oooo.","...oowwwooooow..","...oowwwoooow...","...ooooooooo....","...dd.d.d.dd....","................"];
const grid=rows=>rows.map((r,y)=>[...r].map((c,x)=>PC[c]?`<rect x="${x}" y="${y}" width="1" height="1" fill="${PC[c]}"/>`:"").join("")).join("");
// Head bobs, tail wags.
const fox=()=>`<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><g class="anim-b">${grid(FOX.slice(0,8))}</g><g transform="translate(0 8)">${grid(FOX.slice(8))}</g></svg>`;
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
window.E={fox,esc,mapsUrl,copyText,looksLikeUrl,nameFromLink};
})();
