/* Gather: shared themes, pixel art and helpers. Plain script, sets window.G. */
(function(){
const PC={s:"#8b3a1e",d:"#4a2210",w:"#f4ead8",b:"#8a5a2b",g:"#6aa84f",G:"#2f6b2f",y:"#f2c230",c:"#f6d14a",k:"#9a8f88",K:"#3a3633",r:"#c62828",R:"#a31d1d",B:"#c98a3d",o:"#e8862e",l:"#a9c7d8",e:"#e0a85a",p:"#f48fb1",P:"#d81b60",Y:"#f3e39a",n:"#2b59c3"};
const HERO={"cake": ["................", "....y....y....y.", "...yoy..yoy..yo.", "....w....w....w.", "....w....w....w.", "..cccccccccccc..", "..cPcccPccPccc..", "..pPpppPppPppp..", "..pppppppppppp..", "..bbbbbbbbbbbb..", "..pppppppppppp..", "..pppppPpppppp..", "..bbbbbbbbbbbb..", ".kkkkkkkkkkkkkk.", "..kkkkkkkkkkkk..", "................"], "tree": [".......yy.......", "......yyyy......", ".......yy.......", "......gGgg......", ".....gGgggg.....", "....gGrgggGg....", "...gGggggGggg...", "....ggggGbgg....", "...ggggGgggyG...", "..gggyGggggGgg..", ".ggggGggggGgggg.", "...gGggggGrgg...", "..gGyggbGggggG..", ".gGggggGggggGgg.", ".......dd.......", ".....RRddRR....."], "grill": ["....o...o...o...", "...oyo.oyo.oyo..", "...oyo.oyo.oyo..", "..ssssssssssss..", "..sddsssdddsss..", "kkkkkkkkkkkkkkkk", ".KKKKKKKKKKKKKK.", ".KKKKKKKKKKKKKK.", "..KKKKKKKKKKKK..", "...KKKKKKKKKK...", ".....KKKKKK.....", "......K..K......", ".....K....K.....", "....K......K....", "...K........K...", "................"], "balloons": ["...rr.....bb....", "..rrrr...bbbb...", ".rrwrrr.bbwbbb..", ".rrrrrr.bbbbbb..", ".rrrrrr.bbbbbb..", "..rrrr...bbbb...", "...rr..yy.bb....", "....k.yyyy.k....", "....k.ywyyyk....", ".....kyyyyk.....", "......kyyk......", ".......kk.......", ".......k........", "........k.......", ".......k........", "................"]};
// procedural turkey (24x23)
function turkey(){
  const C={r:"#c62828",o:"#ef6c00",y:"#f9c22e",d:"#5a2d12",b:"#8a4b20",w:"#6b3816",h:"#a8622b",k:"#111",e:"#fff",a:"#f2b631",R:"#d81b1b",L:"#f08a24"};
  const px=(x,y,c)=>`<rect x="${x}" y="${y}" width="1" height="1" fill="${C[c]}"/>`;
  let tail="",body="",head="";
  for(let y=0;y<23;y++)for(let x=0;x<24;x++){
    const dx=x+.5-12,dy=y+.5-14,d=Math.hypot(dx,dy);
    if(dy>1||d<5||d>11.2)continue;
    const st=Math.floor((Math.atan2(dy,dx)+Math.PI)*4.5)%2;
    let c=d<6.4?"d":d<8?"y":d<9.6?"o":"r";
    if(st&&c!=="d")c=c==="y"?"a":c==="o"?"L":"R";
    tail+=px(x,y,c);
  }
  for(let y=0;y<23;y++)for(let x=0;x<24;x++){const ex=(x+.5-12)/4.6,ey=(y+.5-14.5)/5;if(ex*ex+ey*ey<=1){const wing=Math.abs(x+.5-12)>2.6&&y>12&&y<18;body+=px(x,y,wing||y>17?"w":"b")}}
  [[11,19],[11,20],[13,19],[13,20],[10,21],[11,21],[12,21],[13,21],[14,21]].forEach(([x,y])=>body+=px(x,y,"L"));
  for(let y=3;y<11;y++)for(let x=8;x<16;x++)if(Math.hypot(x+.5-12,y+.5-6.5)<=2.9||(y>8&&Math.abs(x+.5-12)<1.6))head+=px(x,y,"h");
  head+=px(10,5,"e")+px(11,5,"k")+px(13,5,"k")+px(14,5,"e")+px(11,7,"a")+px(12,7,"a")+px(12,8,"R")+px(12,9,"R")+px(13,9,"R");
  return `<svg viewBox="0 0 24 23" shape-rendering="crispEdges" aria-hidden="true"><g class="anim-a">${tail}</g><g>${body}</g><g class="anim-b">${head}</g></svg>`;
}
function grid(rows,cls){
  return rows.map((r,y)=>[...r].map((ch,x)=>ch==="."?"":`<rect x="${x}" y="${y}" width="1" height="1" fill="${PC[ch]}"/>`).join("")).join("");
}
function sprite(id){
  if(id==="turkey")return turkey();
  const rows=HERO[id]||HERO.balloons;
  const top=rows.slice(0,6),bot=rows.slice(6);
  // top rows (flames, star, balloon tops) get the motion
  return `<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><g class="anim-b">${grid(top)}</g><g transform="translate(0 6)">${grid(bot)}</g></svg>`;
}
const ICONS={
ribs:["w.w.w.w.","ssssssss","sdsdsdsd","ssssssss","sdsdsdsd","ssssssss",".w.w.w.w","........"],
stuffing:["........","..bgby..",".bybgbb.","bgbbybgb","kkkkkkkk",".kkkkkk.","..kkkk..","........"],
mac:["........","..c..c..",".cyccyc.","cycyccyc","kkkkkkkk",".kkkkkk.","..kkkk..","........"],
mash:["........","...yy...","..wwww..",".wwwwww.","wwwwwwww","kkkkkkkk",".kkkkkk.","........"],
salad:["........",".g.G..g.","gGgrGgGg","GgGgrgGg","kkkkkkkk",".kkkkkk.","..kkkk..","........"],
corn:["...gy...","..gyyy..","..gyyyg.","..yyyyg.",".gyyyyg.",".gyyyg..","..gyg...","...g...."],
bread:["........","........",".BB..BB.","BeeBBeeB","BeeBBeeB","BBBBBBBB","dddddddd","........"],
pie:["........","........","......BB","....BBoo","..BBoooo","BBoooooo","BBBBBBBB","........"],
booze:["..G.....","..G.....",".GGG....",".GGG.l.l",".GwG.lrl",".GGG.lrl",".GGG..l.",".GGG.lll"],
redwine:["........",".llllll.",".lRRRRl.","..lRRl..","...ll...","...ll...","..llll..","........"],
whitewine:["........",".llllll.",".lYYYYl.","..lYYl..","...ll...","...ll...","..llll..","........"],
beer:[".wwww...","wwwwww..","yyyyyykk","yyyyyy.k","yyyyyy.k","yyyyyykk","yyyyyy..","........"],
spirits:["...ll...","...ll...","..llll..",".llllll.",".lwwwwl.",".lwrrwl.",".llllll.",".llllll."],
soda:["..kkkk..",".rrrrrr.",".rwwwrr.",".rrrrrr.",".rrwwrr.",".rrrrrr.",".rrrrrr.","..kkkk.."],
chips:[".oooooo.",".oyyyyo.",".oyrryo.",".oyrryo.",".oyyyyo.",".oyyyyo.",".oooooo.","........"],
cake:["....r...","..wwwww.",".pppppp.",".bbbbbb.",".pppppp.",".bbbbbb.","kkkkkkkk","........"],
cookies:["........","..BBBB..",".BdBBdB.",".BBBBBB.",".BBdBBB.","..BBBB..","........","........"],
plates:["........","..wwww..",".wkkkkw.",".wkwwkw.",".wkwwkw.",".wkkkkw.","..wwww..","........"],
cups:["........",".rrrrrr.",".rrrrrr.","..rrrr..","..rwrr..","..rrrr..","..rrrr..","........"],
ice:["........","..llll..",".lwwwwl.",".lwllwl.",".lwllwl.",".lwwwwl.","..llll..","........"],
fruit:["....g...","...d....",".rrrrrr.","rrwrrrrr","rrrrrrrr","rrrrrrrr",".rrrrrr.","..rrrr.."],
chicken:["..BBB...",".BBBBB..",".BBeBB..",".BBBBB..","..BBBw..",".....w..","....www.",".....w.."],
dumplings:["........","........","..wwww..",".wkwkww.","wwwwwwww","wwwwwwww",".kkkkkk.","........"],
rice:["........","..wwww..",".wwwwww.","wwwwwwww","rrrrrrrr",".rrrrrr.","..rrrr..","........"],
burger:["........","..BBBB..",".BBeBBB.",".gggggg.",".dddddd.",".yyyyyy.",".BBBBBB.","........"],
dish:["...kk...","..kkkk..",".kwkkkk.",".kkkkkk.","kkkkkkkk","dddddddd","........","........"]
};
const MATCH=[
 [/red wine|cabernet|pinot noir|merlot|malbec|zinfandel/,"redwine"],
 [/white wine|chardonnay|sauvignon|pinot gri|riesling|ros[eé]|champagne|prosecco|sparkling/,"whitewine"],
 [/wine/,"redwine"],[/beer|ipa|lager|seltzer|soju|sake/,"beer"],
 [/gin|vodka|whisk|tequila|rum|vermouth|bourbon|liquor|spirit|mezcal|bitters/,"spirits"],
 [/booze|drinks|cocktail|alcohol/,"booze"],
 [/soda|coke|sprite|juice|lemonade|water|sparkling water|la croix|tea|coffee/,"soda"],
 [/chip|crisp|pretzel|popcorn|snack|cracker|dip|salsa|guac/,"chips"],
 [/cake|cupcake|brownie|dessert|tart|cheesecake/,"cake"],[/pie/,"pie"],[/cookie/,"cookies"],
 [/rib|brisket|pork|steak|beef|bbq|sausage/,"ribs"],[/chicken|wing|turkey|drumstick/,"chicken"],
 [/burger|hot ?dog|slider|sandwich/,"burger"],[/dumpling|mandu|gyoza|wonton|bao|pot ?sticker/,"dumplings"],
 [/rice|noodle|japchae|pasta/,"rice"],[/mac|cheese/,"mac"],[/mash|potato/,"mash"],[/stuffing|dressing/,"stuffing"],
 [/salad|greens|slaw|veggie|vegetable/,"salad"],[/corn/,"corn"],[/bread|roll|bun|baguette|biscuit/,"bread"],
 [/fruit|apple|berr|grape|melon|orange/,"fruit"],
 [/plate|fork|knife|spoon|utensil|napkin|foil|container/,"plates"],[/\bcups?\b/,"cups"],[/\bice\b/,"ice"]
];
const iconFor=name=>{const n=String(name||"").toLowerCase();for(const [re,k] of MATCH)if(re.test(n))return k;return "dish"};
const icon=k=>`<svg viewBox="0 0 8 8" shape-rendering="crispEdges" aria-hidden="true">${grid(ICONS[k]||ICONS.dish)}</svg>`;

const THEMES={
 thanksgiving:{name:"Thanksgiving",sprite:"turkey",hero:"#e2582a",heroInk:"#fff",pattern:"repeating-linear-gradient(90deg,transparent 0 22px,rgba(0,0,0,.05) 22px 24px)",accent:"#f2b631",light:"#fff8ef",dark:"#1d120b",panelL:"#ffffff",panelD:"#2a1a10",line:["#ecdccb","#43291a"],slot:"#c4441a"},
 bbq:{name:"Cookout",sprite:"grill",hero:"#c0392b",heroInk:"#fff",pattern:"linear-gradient(90deg,rgba(255,255,255,.18) 50%,transparent 50%),linear-gradient(rgba(255,255,255,.18) 50%,transparent 50%)",patternSize:"40px 40px",accent:"#ffd166",light:"#fffaf2",dark:"#1a1412",panelL:"#ffffff",panelD:"#2a1f1b",line:["#efdcd4","#46302a"],slot:"#b03224"},
 birthday:{name:"Birthday",sprite:"cake",hero:"#ff5c93",heroInk:"#fff",pattern:"radial-gradient(circle at 20% 30%,#ffd23f 0 3px,transparent 4px),radial-gradient(circle at 70% 60%,#4cc9f0 0 3px,transparent 4px),radial-gradient(circle at 45% 85%,#fff 0 2px,transparent 3px)",patternSize:"60px 60px",accent:"#ffd23f",light:"#fff7fa",dark:"#1c1118",panelL:"#ffffff",panelD:"#2b1a25",line:["#f6d9e4","#47293b"],slot:"#d81b60"},
 holiday:{name:"Holiday",sprite:"tree",hero:"#1f5c3a",heroInk:"#fff",pattern:"radial-gradient(circle at 25% 25%,rgba(255,255,255,.55) 0 2px,transparent 3px),radial-gradient(circle at 75% 65%,rgba(255,255,255,.35) 0 1.5px,transparent 2.5px)",patternSize:"46px 46px",accent:"#e63946",light:"#f7fbf8",dark:"#0f1a14",panelL:"#ffffff",panelD:"#18291f",line:["#d7e6dc","#2a4234"],slot:"#1f5c3a"},
 party:{name:"Party",sprite:"balloons",hero:"#3b4cca",heroInk:"#fff",pattern:"radial-gradient(circle at 30% 40%,#ffd23f 0 3px,transparent 4px),radial-gradient(circle at 80% 20%,#ff5c93 0 3px,transparent 4px),radial-gradient(circle at 60% 80%,#4cc9f0 0 3px,transparent 4px)",patternSize:"70px 70px",accent:"#ffd23f",light:"#f8f8ff",dark:"#12131f",panelL:"#ffffff",panelD:"#1d1f33",line:["#dfe1f5","#30344f"],slot:"#3b4cca"}
};
function applyTheme(id){
  const t=THEMES[id]||THEMES.party,s=document.documentElement.style;
  s.setProperty("--hero",t.hero);s.setProperty("--heroInk",t.heroInk);
  s.setProperty("--heroPat",t.pattern);s.setProperty("--heroPatSize",t.patternSize||"auto");
  s.setProperty("--acc",t.accent);s.setProperty("--slot",t.slot);
  s.setProperty("--bg",`light-dark(${t.light},${t.dark})`);s.setProperty("--panel",`light-dark(${t.panelL},${t.panelD})`);
  s.setProperty("--line",`light-dark(${t.line[0]},${t.line[1]})`);
  return t;
}
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function fmtWhen(date,time){
  if(!date)return "";
  const d=new Date(date+"T12:00:00");
  let out=d.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric",year:"numeric"});
  if(time){const [h,m]=time.split(":").map(Number);out+=` · ${((h+11)%12)+1}${m?":"+String(m).padStart(2,"0"):""} ${h<12?"AM":"PM"}`}
  return out;
}
const mapsUrl=a=>"https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(a||"");
window.G={THEMES,applyTheme,sprite,icon,iconFor,esc,fmtWhen,mapsUrl};
})();
