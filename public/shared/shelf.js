/* The toy box shelf: which apps exist and how their tiles look.
   To launch an app: set status "live" and href. Order here is order on the shelf. */
(function(){
const SITE={
  donate:"",   // e.g. https://ko-fi.com/...  (empty shows "soon")
  discord:""   // e.g. https://discord.gg/...
};
const SHELF=[
 {id:"potluck",sp:"turkey",name:"Potluck",line:"List what you need, guests claim it. No duplicate salads.",bg:"#ffd9c2",flakes:["#e8862e","#c62828","#f2c230"],status:"live",href:"/potluck"},
 {id:"when",sp:"cal",name:"When works",line:"Everyone paints when they're free. The best time lights up.",bg:"#d7e6ff",flakes:["#fff","#a9c7d8"],status:"soon"},
 {id:"eat",sp:"fox",name:"Where to eat",line:"Pick a few places, send one text with the map links.",bg:"#ffe8b8",flakes:["#e8862e","#fff"],status:"live",href:"/eat"},
 {id:"santa",sp:"gift",name:"Gift exchange",line:"Draw names without anyone seeing.",bg:"#f7d6e6",flakes:["#fff","#f48fb1"],status:"soon"},
 {id:"raffle",sp:"raffle",name:"Raffle",line:"Everyone gets a ticket, one tap draws a winner.",bg:"#ffe0d6",flakes:["#f2c230","#c62828"],status:"soon"},
 {id:"waitlist",sp:"waitlist",name:"Waitlist",line:"People add their name, you call them in order.",bg:"#e6e0f7",flakes:["#fff"],status:"soon"},
 {id:"carpool",sp:"car",name:"Carpool",line:"Who's driving, who needs a seat.",bg:"#d8efe4",flakes:["#fff","#a9c7d8"],status:"soon"}
];
const SP={"cal": ["................", "..k..k..........", ".rrrrrr.........", ".rrrrrr..k..k...", ".wwwwww.nnnnnn..", ".wkwkww.nnnnnn..", ".wwwwwy.wwwwww..", ".wkwwkw.wkwkww..", ".wwwwww.ywwwww..", ".wkwkww.wkwwkw..", ".wwwwww.wwwwww..", "........wkwkww..", "........wwwwww..", "................", "................", "................"], "fox": ["..o.......o.....", "..oo.....oo.....", "..ooo...ooo.....", "..ooooooooo.....", ".oowkoooowko....", ".ooooooooooo....", "..oowwwwwoo.....", "...owwkwwo......", "....owwwo....oo.", "....ooooo...ooo.", "...ooooooo.oooo.", "...oowwwooooow..", "...oowwwoooow...", "...ooooooooo....", "...dd.d.d.dd....", "................"], "gift": ["................", ".....r...r......", "......r.r.......", ".......r........", "..pppppppppppp..", "..pppppprppppp..", "..pppppprppppp..", "...ppppprpppp...", "...ppppprpppp...", "...ppppprpppp...", "...ppppprpppp...", "...ppppprpppp...", "...ppppprpppp...", "...ppppprpppp...", "................", "................"], "car": ["................", "................", "................", "................", ".....nnnnnn.....", "....nllnllnn....", "...nnlln.llnn...", ".nnnnnnnnnnnnnn.", ".nnnnnnnnnnnnnn.", ".ynnnnnnnnnnnnr.", ".nnnnnnnnnnnnnn.", "..kkk......kkk..", "..kwk......kwk..", "..kkk......kkk..", "................", "................"], "receipt": ["................", "...wwwwwwwwww...", "...wkkkwwkkkw...", "...wwwwwwwwww...", "...wkkkkkwkkw...", "...wwwwwwwwww...", "...wkkkwwwkkw...", "...wwwwwwwwww...", "...wkkkkwwkkw...", "...wwwwwwwwww...", "...wwwwwwwwww...", "...wkkkkkkkkw...", "...wwwwwwwwww...", "...w.w.w.w.w....", "................", "................"], "waitlist": ["................", "......kkkk......", "...bbbkwwkbbb...", "...bwwwwwwwwb...", "...bwgwkkkkwb...", "...bwwwwwwwwb...", "...bwgwkkkwwb...", "...bwwwwwwwwb...", "...bwwwkkkkwb...", "...bwwwwwwwwb...", "...bwwwkkkwwb...", "...bwwwwwwwwb...", "...bwwwkkkkwb...", "...bwwwwwwwwb...", "...bbbbbbbbbb...", "................"], "raffle": ["................", "................", ".....kkkkkkk....", "....knnnnnnnk...", "...knlyynnlynk..", "...knnnylnnnnk..", "...knyynnnylnkkk", "...knnnlynnnnk..", "...knllnnnyynk..", "....knnnnnnnk...", ".....kkkkkkk....", "......k...k.....", ".....kk...kk....", "...rr.........y.", "..ryyr.......yry", "...rr.........y."]};
const PC={s:"#8b3a1e",d:"#4a2210",w:"#f4ead8",b:"#8a5a2b",g:"#6aa84f",G:"#2f6b2f",y:"#f2c230",k:"#3a3633",r:"#c62828",o:"#e8862e",l:"#a9c7d8",n:"#2b59c3",p:"#f48fb1"};
const grid=rows=>rows.map((r,y)=>[...r].map((c,x)=>c==="."?"":`<rect x="${x}" y="${y}" width="1" height="1" fill="${PC[c]}"/>`).join("")).join("");
function turkey(){
  const C={r:"#c62828",o:"#ef6c00",y:"#f9c22e",d:"#5a2d12",b:"#8a4b20",w:"#6b3816",h:"#a8622b",k:"#111",e:"#fff",a:"#f2b631",R:"#d81b1b",L:"#f08a24"};
  const px=(x,y,c)=>`<rect x="${x}" y="${y}" width="1" height="1" fill="${C[c]}"/>`;let t="",b="",h="";
  for(let y=0;y<23;y++)for(let x=0;x<24;x++){const dx=x+.5-12,dy=y+.5-14,d=Math.hypot(dx,dy);if(dy>1||d<5||d>11.2)continue;const st=Math.floor((Math.atan2(dy,dx)+Math.PI)*4.5)%2;let c=d<6.4?"d":d<8?"y":d<9.6?"o":"r";if(st&&c!=="d")c=c==="y"?"a":c==="o"?"L":"R";t+=px(x,y,c)}
  for(let y=0;y<23;y++)for(let x=0;x<24;x++){const ex=(x+.5-12)/4.6,ey=(y+.5-14.5)/5;if(ex*ex+ey*ey<=1)b+=px(x,y,(Math.abs(x+.5-12)>2.6&&y>12&&y<18)||y>17?"w":"b")}
  [[11,19],[11,20],[13,19],[13,20],[10,21],[11,21],[12,21],[13,21],[14,21]].forEach(([x,y])=>b+=px(x,y,"L"));
  for(let y=3;y<11;y++)for(let x=8;x<16;x++)if(Math.hypot(x+.5-12,y+.5-6.5)<=2.9||(y>8&&Math.abs(x+.5-12)<1.6))h+=px(x,y,"h");
  h+=px(10,5,"e")+px(11,5,"k")+px(13,5,"k")+px(14,5,"e")+px(11,7,"a")+px(12,7,"a")+px(12,8,"R")+px(12,9,"R")+px(13,9,"R");
  return `<svg class="sp" viewBox="0 0 24 23" aria-hidden="true"><g class="fan2 anim">${t}</g><g>${b}</g><g class="bob anim">${h}</g></svg>`;
}
function sprite(k){
  if(k==="turkey")return turkey();
  const r=SP[k];
  if(k==="cal")return `<svg class="sp" viewBox="0 0 16 16" aria-hidden="true">${grid(r.map(s=>s.slice(0,8)+"........"))}<g class="slide anim">${grid(r.map(s=>"........"+s.slice(8)))}</g></svg>`;
  if(k==="fox")return `<svg class="sp" viewBox="0 0 16 16" aria-hidden="true"><g class="bob anim">${grid(r.slice(0,8))}</g><g transform="translate(0 8)">${grid(r.slice(8))}</g></svg>`;
  return `<svg class="sp" viewBox="0 0 16 16" aria-hidden="true">${grid(r)}</svg>`;
}
window.SHELF={SITE,SHELF,sprite};
})();
