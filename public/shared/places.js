/* Google place and address search for any "where" field. The key stays on the server (/api/places).
   placeSearch(input, { addr: true })  addr: street addresses only (shipping). Otherwise any place or address.
   Picking a suggestion fills the input with the full address. Typing by hand still works, and if the
   server has no key (501) the field is just a text box. */
(function(){
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const newSession=()=>Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,"0")).join("");
let n=0;
window.placeSearch=function(input,o={}){
  const wrap=document.createElement("div");wrap.className="find";
  input.parentNode.insertBefore(wrap,input);wrap.appendChild(input);
  const list=document.createElement("ul");list.className="sug";list.id="sug"+(++n);list.setAttribute("role","listbox");list.hidden=true;wrap.appendChild(list);
  input.setAttribute("autocomplete","off");input.setAttribute("role","combobox");input.setAttribute("aria-autocomplete","list");input.setAttribute("aria-controls",list.id);input.setAttribute("aria-expanded","false");
  let on=true,session=newSession(),sug=[],sel=-1,seq=0,timer=null;
  const close=()=>{sug=[];sel=-1;list.hidden=true;input.setAttribute("aria-expanded","false")};
  const draw=()=>{
    if(!sug.length)return close();
    list.innerHTML=sug.map((s,i)=>`<li><button type="button" role="option" data-i="${i}" aria-selected="${i===sel}"><span>${esc(s.name)}</span>${s.area?`<small>${esc(s.area)}</small>`:""}</button></li>`).join("")+`<li class="hint" style="padding:4px 12px;font-size:12px">Results from Google</li>`;
    list.hidden=false;input.setAttribute("aria-expanded","true");
  };
  async function search(q){
    const my=++seq;
    try{
      const r=await fetch(`/api/places?${o.addr?"t=addr&":""}q=${encodeURIComponent(q)}&s=${session}`);
      if(r.status===501){on=false;return close()}
      const j=await r.json();
      if(my!==seq||input.value.trim()!==q)return;
      sug=r.ok?j.results||[]:[];sel=-1;draw();
    }catch(e){close()}
  }
  // Details ends the search session (billed as one lookup) and gives the full address.
  async function choose(s){
    close();
    const quick=o.addr||!s.area?s.name:s.name+", "+s.area;
    input.value=quick;
    try{
      const r=await fetch(`/api/places?id=${encodeURIComponent(s.id)}&s=${session}`);
      const p=r.ok&&(await r.json()).place;
      if(p&&p.area)input.value=o.addr||p.area.toLowerCase().startsWith((p.name||"").toLowerCase())?p.area:p.name+", "+p.area;
    }catch(e){}
    session=newSession();
    input.dispatchEvent(new Event("change",{bubbles:true}));
    if(o.onPick)o.onPick(input.value);
  }
  input.addEventListener("input",()=>{
    clearTimeout(timer);const q=input.value.trim();
    if(!on||q.length<3||/^https?:/i.test(q))return close();
    timer=setTimeout(()=>search(q),250);
  });
  input.addEventListener("keydown",e=>{
    if(!sug.length)return;
    if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();sel=e.key==="ArrowDown"?(sel+1>=sug.length?-1:sel+1):(sel-1<-1?sug.length-1:sel-1);draw();return}
    if(e.key==="Escape"){close();return}
    if(e.key==="Enter"&&sel>=0){e.preventDefault();e.stopImmediatePropagation();choose(sug[sel])}
  });
  list.addEventListener("mousedown",e=>e.preventDefault());
  list.addEventListener("click",e=>{const b=e.target.closest("[data-i]");if(b)choose(sug[+b.dataset.i])});
  input.addEventListener("blur",()=>setTimeout(close,150));
};
})();
