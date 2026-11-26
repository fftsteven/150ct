/* Registry: art and helpers. Plain script, sets window.R. */
(function(){
const PC={w:"#fff6e8",e:"#e2cfb4",k:"#3a3633",r:"#e5484d"};
// A shopping bag with a heart on it. The heart beats.
const BAG=["................","................",".....kkkkkk.....","....k......k....","....k......k....","..wwwwwwwwwwee..","..wwwwwwwwwwee..","..wwrrwrrwwwee..","..wrrrrrrrwwee..","..wrrrrrrrwwee..","..wwrrrrrwwwee..","..wwwrrrwwwwee..","..wwwwrwwwwwee..","..wwwwwwwwwwee..","..eeeeeeeeeeee..","................"];
const grid=(rows,only)=>rows.map((r,y)=>[...r].map((c,x)=>PC[c]&&(!only||only(c))?`<rect x="${x}" y="${y}" width="1" height="1" fill="${PC[c]}"/>`:"").join("")).join("");
const bag=()=>`<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">${grid(BAG,c=>c!=="r")}<g class="beat">${grid(BAG,c=>c==="r")}</g></svg>`;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
async function copyText(t){
  try{await navigator.clipboard.writeText(t);return true}catch(e){}
  const a=document.createElement("textarea");a.value=t;a.setAttribute("readonly","");a.style.cssText="position:fixed;top:0;left:0;opacity:0";
  document.body.appendChild(a);a.select();a.setSelectionRange(0,t.length);
  let ok=false;try{ok=document.execCommand("copy")}catch(e){}
  a.remove();return ok;
}
const fmtDay=s=>new Date(s+"T12:00:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});
// "amazon.com" from a store link.
const store=u=>{try{return new URL(u).hostname.replace(/^(www\d?|m|smile)\./,"")}catch(e){return ""}};
// A product name guessed from the link itself, no fetching. Most stores put it in the path:
// amazon.com/Wooden-Stacking-Rings/dp/…, target.com/p/wooden-stacking-rings/-/A-…, etsy.com/listing/123/wooden-rings
function nameFromUrl(u){
  let x;try{x=new URL(/^https?:/i.test(u.trim())?u.trim():"https://"+u.trim())}catch(e){return ""}
  let best="";
  for(let seg of x.pathname.split("/")){
    try{seg=decodeURIComponent(seg)}catch(e){}
    seg=seg.replace(/\.(html?|aspx?|php)$/i,"");
    if(!/[-_+]/.test(seg)||!/[a-z]{3}/i.test(seg))continue;
    const words=seg.split(/[-_+\s]+/).filter(w=>w&&!/^\d+$/.test(w)&&!/^[a-z]?\d[\w]*$/i.test(w));
    if(words.length<2)continue;
    const s=words.join(" ");
    if(s.length>best.length)best=s;
  }
  if(!best)return "";
  best=best.split(" ").slice(0,10).join(" ").slice(0,80);
  return best.charAt(0).toUpperCase()+best.slice(1);
}
window.R={bag,esc,copyText,fmtDay,store,nameFromUrl};
})();
