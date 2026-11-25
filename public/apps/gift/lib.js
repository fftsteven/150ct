/* Gift exchange: art and helpers. Plain script, sets window.S. */
(function(){
const PC={p:"#f48fb1",P:"#d81b60",r:"#c62828",w:"#fff"};
// The shelf's gift, with a shade down one side. The bow bobs.
const GIFT=["................",".....r...r......","......r.r.......",".......r........","..pppppppppppp..","..pppppprpppPP..","..pppppprpppPP..","...ppppprppPP...","...ppppprppPP...","...ppppprppPP...","...ppppprppPP...","...ppppprppPP...","...ppppprppPP...","...ppppprppPP...","................","................"];
const grid=rows=>rows.map((r,y)=>[...r].map((c,x)=>PC[c]?`<rect x="${x}" y="${y}" width="1" height="1" fill="${PC[c]}"/>`:"").join("")).join("");
const gift=()=>`<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><g class="anim-b">${grid(GIFT.slice(0,4))}</g><g transform="translate(0 4)">${grid(GIFT.slice(4))}</g></svg>`;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
async function copyText(t){
  try{await navigator.clipboard.writeText(t);return true}catch(e){}
  const a=document.createElement("textarea");a.value=t;a.setAttribute("readonly","");a.style.cssText="position:fixed;top:0;left:0;opacity:0";
  document.body.appendChild(a);a.select();a.setSelectionRange(0,t.length);
  let ok=false;try{ok=document.execCommand("copy")}catch(e){}
  a.remove();return ok;
}
const fmtDay=s=>new Date(s+"T12:00:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});
window.S={gift,esc,copyText,fmtDay};
})();
