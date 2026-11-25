/* When works: calendar art and helpers. Plain script, sets window.M. */
(function(){
const PC={k:"#3a3633",r:"#c62828",w:"#f4ead8",y:"#f2c230",n:"#2b59c3"};
const CAL=["................","..k..k..........",".rrrrrr.........",".rrrrrr..k..k...",".wwwwww.nnnnnn..",".wkwkww.nnnnnn..",".wwwwwy.wwwwww..",".wkwwkw.wkwkww..",".wwwwww.ywwwww..",".wkwkww.wkwwkw..",".wwwwww.wwwwww..","........wkwkww..","........wwwwww..","................","................","................"];
const grid=rows=>rows.map((r,y)=>[...r].map((c,x)=>PC[c]?`<rect x="${x}" y="${y}" width="1" height="1" fill="${PC[c]}"/>`:"").join("")).join("");
// Two pages; the back one bobs.
const cal=()=>`<svg viewBox="0 1 16 13" shape-rendering="crispEdges" aria-hidden="true">${grid(CAL.map(s=>s.slice(0,8)+"........"))}<g class="anim-b">${grid(CAL.map(s=>"........"+s.slice(8)))}</g></svg>`;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
async function copyText(t){
  try{await navigator.clipboard.writeText(t);return true}catch(e){}
  const a=document.createElement("textarea");a.value=t;a.setAttribute("readonly","");a.style.cssText="position:fixed;top:0;left:0;opacity:0";
  document.body.appendChild(a);a.select();a.setSelectionRange(0,t.length);
  let ok=false;try{ok=document.execCommand("copy")}catch(e){}
  a.remove();return ok;
}
// Dates are plain "YYYY-MM-DD" strings, read at local noon so no time zone shifts the day.
const toDate=s=>new Date(s+"T12:00:00");
const ymd=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const fmtDay=(s,o={weekday:"short",month:"short",day:"numeric"})=>toDate(s).toLocaleDateString("en-US",o);
const hourLabel=h=>{h=h%24;return `${(h+11)%12+1} ${h<12?"AM":"PM"}`};
const shortHour=h=>{h=h%24;return `${(h+11)%12+1}${h<12?"a":"p"}`};
const hh=h=>String(h).padStart(2,"0");
function slotsOf(ev){
  if(ev.from==null)return ev.days.slice();
  const out=[];for(const d of ev.days)for(let h=ev.from;h<ev.to;h++)out.push(`${d}T${hh(h)}`);return out;
}
window.M={cal,esc,copyText,toDate,ymd,fmtDay,hourLabel,shortHour,hh,slotsOf};
})();
