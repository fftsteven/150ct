/* Squares: art and helpers. Plain script, sets window.Q. */
(function(){
const PC={d:"#4a2210",F:"#8b3f1c",w:"#fffdf8"};
// A football with white laces and end stripes. It hops.
const BALL=["................","................","................","................","................","....dddddddd....","..ddFFFFFFFFdd..",".dFwFFwFFwFFwFd.",".dFwFwwwwwwFwFd.",".dFwFFwFFwFFwFd.","..ddFFFFFFFFdd..","....dddddddd....","................","................","................","................"];
const grid=rows=>rows.map((r,y)=>[...r].map((c,x)=>PC[c]?`<rect x="${x}" y="${y}" width="1" height="1" fill="${PC[c]}"/>`:"").join("")).join("");
const ball=()=>`<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><g class="anim-b">${grid(BALL)}</g></svg>`;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
async function copyText(t){
  try{await navigator.clipboard.writeText(t);return true}catch(e){}
  const a=document.createElement("textarea");a.value=t;a.setAttribute("readonly","");a.style.cssText="position:fixed;top:0;left:0;opacity:0";
  document.body.appendChild(a);a.select();a.setSelectionRange(0,t.length);
  let ok=false;try{ok=document.execCommand("copy")}catch(e){}
  a.remove();return ok;
}
const fmtDay=s=>new Date(s+"T12:00:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});
// "$5" when the host typed just a number.
const money=p=>/^[\d.]/.test(p=String(p||"").trim())?"$"+p:p;
window.Q={ball,esc,copyText,fmtDay,money,BALL};
})();
