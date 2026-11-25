/* Potluck: icons, templates, colour and helpers. Plain script, sets window.G. */
(function(){
const PC={s:"#8b3a1e",d:"#4a2210",w:"#f4ead8",W:"#ffffff",b:"#8a5a2b",g:"#6aa84f",G:"#2f6b2f",y:"#f2c230",c:"#f6d14a",h:"#fff3b0",k:"#9a8f88",K:"#3a3633",x:"#1b1716",r:"#c62828",R:"#a31d1d",B:"#c98a3d",o:"#e8862e",O:"#b85a14",l:"#a9c7d8",e:"#e0a85a",p:"#f48fb1",P:"#d81b60",Y:"#f3e39a",n:"#2b59c3",N:"#1c3d8f",v:"#8e5bd6",m:"#4cc9a0"};

// 16x16 card icons. Rows shorter than 16 are padded.
const ART={
cake:["................","....y....y....y.","...yoy..yoy..yo.","....w....w....w.","....w....w....w.","..cccccccccccc..","..cPcccPccPccc..","..pPpppPppPppp..","..pppppppppppp..","..bbbbbbbbbbbb..","..pppppppppppp..","..pppppPpppppp..","..bbbbbbbbbbbb..",".kkkkkkkkkkkkkk.","..kkkkkkkkkkkk..","................"],
tree:[".......yy.......","......yyyy......",".......yy.......","......gGgg......",".....gGgggg.....","....gGrgggGg....","...gGggggGggg...","....ggggGbgg....","...ggggGgggyG...","..gggyGggggGgg..",".ggggGggggGgggg.","...gGggggGrgg...","..gGyggbGggggG..",".gGggggGggggGgg.",".......dd.......",".....RRddRR....."],
grill:["....o...o...o...","...oyo.oyo.oyo..","...oyo.oyo.oyo..","..ssssssssssss..","..sddsssdddsss..","kkkkkkkkkkkkkkkk",".KKKKKKKKKKKKKK.",".KKKKKKKKKKKKKK.","..KKKKKKKKKKKK..","...KKKKKKKKKK...",".....KKKKKK.....","......K..K......",".....K....K.....","....K......K....","...K........K...","................"],
balloons:["...rr.....nn....","..rrrr...nnnn...",".rrwrrr.nnwnnn..",".rrrrrr.nnnnnn..",".rrrrrr.nnnnnn..","..rrrr...nnnn...","...rr..yy.nn....","....k.yyyy.k....","....k.ywyyyk....",".....kyyyyk.....","......kyyk......",".......kk.......",".......k........","........k.......",".......k........","................"],
pumpkin:["................","................",".......dd.......","........dg......","........ggg.....","...oOoooooOoo...","..ooOooOOooOoo..",".oooOooOOooOooo.",".oooOooOOooOooo.",".oooOooOOooOooo.",".oooOooOOooOooo.",".oooOooOOooOooo.","..ooOooOOooOoo..","...oOoooooOoo...","................","................"],
pie:["................","................","................","................","....w.w.w.w.w...","...wwwwwwwwwww..","..BBBBBBBBBBBBB.",".BeBeBeBeBeBeBeB",".BoooooooooooooB",".BoooooooooooooB",".BOOOOOOOOOOOOOB","..BBBBBBBBBBBBB.","..kkkkkkkkkkkk..","...kkkkkkkkkk...","................","................"],
leaf:[".......o........","......ooo.......","..o..ooooo..o...","..oo.ooOoo.oo...","..oooooOooooo...","...ooooOoooo....",".ooooooOooooooo.","..oooooOoooooo..","...ooOoOoOooo...","....oOooOooOo...","....ooooOoooo...",".....oooOooo....","........d.......","........d.......","........d.......","................"],
gift:["................","...rrr....rrr...","..r...r..r...r..","..r....rr....r..","...rrrrrrrrrr...",".nnnnnnrrnnnnnn.",".nnnnnnrrnnnnnn.",".rrrrrrrrrrrrrr.","..NnnnnrrnnnnN..","..NnnnnrrnnnnN..","..NnnnnrrnnnnN..","..NnnnnrrnnnnN..","..NnnnnrrnnnnN..","..NnnnnrrnnnnN..","..NNNNNrrNNNNN..","................"],
snowflake:[".......W........",".....W.W.W......","......WWW.......",".W.....W.....W..","W.W....W....W.W.","...W...W...W....","....W..W..W.....",".....W.W.W......","WWWWWWWlWWWWWWW.",".....W.W.W......","....W..W..W.....","...W...W...W....","W.W....W....W.W.",".W.....W.....W..","......WWW.......",".....W.W.W......"],
bell:["......RRRR......",".....RR..RR.....","......RRRR......",".......yy.......","......yccy......",".....yccchy.....","....ycccchyy....","....ycccchyy....","....yccccchy....","...ycccccchyy...","...ycccccccyy...","..ycccccccccyy..",".yyyyyyyyyyyyyy.",".......BB.......","......BBBB......","................"],
champagne:[".....y...y......","...y...y....y...",".....y..y.......","......KK........","......GG........","......GG.....W..",".....GGGG..lYYl.","....GGGGGG.lYYl.","....GwwwwG.lYYl.","....GwRRwG..ll..","....GwwwwG...l..","....GGGGGG...l..","....GGGGGG..lll.","....GGGGGG......",".....GGGG.......","................"],
fireworks:[".......y........","...y...y...y....","....y..y..y.....",".....y.W.y......","......yWy.......",".yyyyWWWWWyyyy..","......yWy.......",".....y.W.y......","....y..y..y.....","...y...y...y....",".......y........",".p..........m...","ppp........mmm..",".p..........m...","................","................"],
clock:[".....xxxxx......","...xxWWWWWxx....","..xWWWWxWWWWx...",".xWWWWWxWWWWWx..",".xWWWWWxWWWWWx..","xWWWWWWxWWWWWWx.","xWxWWWWxWWWWxWx.","xWWWWWWxWWWWWWx.","xWWWWWWWWWWWWWx.",".xWWWWWWWWWWWx..",".xWWWWWWWWWWWx..","..xWWWWxWWWWx...","...xxWWWWWxx....",".....xxxxx......","................","................"],
partyhat:[".......W........","......WyW.......",".......W........","......ppp.......","......pnp.......",".....ppppp......",".....yyyyy......","....ppppppp.....","....pnpppnp.....","...ppppppppp....","...yyyyyyyyy....","..ppppppppppp...","..pnpppnpppnp...",".ppppppppppppp..",".WWWWWWWWWWWWW..","................"],
star:[".......y........",".......y........","......yyy.......","......yyy.......",".yyyyyyhyyyyyy..","..yyyyyhyyyyy...","...yyyyyyyyy....","....yyyyyyy.....","....yyyyyyy.....","...yyyyyyyyy....","...yyyy.yyyy....","..yyy.....yyy...","..yy.......yy...","..y.........y...","................","................"],
heart:["................","..RRR.....RRR...",".RrrrR...RrrrR..","RrWrrrR.RrrrrrR.","RrWrrrrRrrrrrrR.","RrrrrrrrrrrrrrR.","RrrrrrrrrrrrrrR.",".RrrrrrrrrrrrR..","..RrrrrrrrrrR...","...RrrrrrrrR....","....RrrrrrR.....",".....RrrrR......","......RrR.......",".......R........","................","................"],
smiley:[".....xxxxx......","...xxyyyyyxx....","..xyyyyyyyyyx...",".xyyyxyyyxyyyx..",".xyyyxyyyxyyyx..","xyyyyxyyyxyyyyx.","xyyyyyyyyyyyyyx.","xyyyyyyyyyyyyyx.","xyxyyyyyyyyyxyx.",".xyxyyyyyyyxyx..",".xyyxxxxxxxyyx..","..xyyyyyyyyyx...","...xxyyyyyxx....",".....xxxxx......","................","................"],
pizza:[".BBBBBBBBBBBBBB.",".BeeeeeeeeeeeeB.","..cccccccccccc..","..crrcccccrrcc..","...crrcccrrcc...","...cccgccccc....","....ccrrcccc....","....crrcgcc.....",".....cccccc.....",".....crrcc......","......ccc.......","......cc........",".......c........","................","................","................"],
sun:[".......y........","..y....y....y...","...y.......y....",".....yyyyy......","....yyhhyyy.....","...yyhhyyyyy....","yy.yyhyyyyyy.yy.","...yyyyyyyyy....","...yyyyyyyyy....","....yyyyyyy.....",".....yyyyy......","...y.......y....","..y....y....y...",".......y........","................","................"],
};
// Each icon carries the card's colour, so the host only makes one pick.
const ICONS={
 turkey:{name:"Turkey",hero:"#e2582a",acc:"#f2b631"},
 pie:{name:"Pie",hero:"#2a6f6a",acc:"#f2b631"},
 pumpkin:{name:"Pumpkin",hero:"#2f4a3a",acc:"#f2a03a"},
 leaf:{name:"Leaf",hero:"#1f4e5f",acc:"#f2c230"},
 tree:{name:"Tree",hero:"#1f5c3a",acc:"#e63946"},
 gift:{name:"Gift",hero:"#b3202b",acc:"#ffd23f"},
 snowflake:{name:"Snow",hero:"#2b59c3",acc:"#a9e0ff"},
 bell:{name:"Bell",hero:"#1f4d36",acc:"#f2c230"},
 champagne:{name:"Bubbly",hero:"#17172a",acc:"#f2c230"},
 fireworks:{name:"Fireworks",hero:"#12133a",acc:"#ff5c93"},
 clock:{name:"Midnight",hero:"#2b2d6e",acc:"#ffd23f"},
 partyhat:{name:"Party hat",hero:"#3b4cca",acc:"#ffd23f"},
 cake:{name:"Cake",hero:"#ff5c93",acc:"#ffd23f"},
 balloons:{name:"Balloons",hero:"#00897b",acc:"#ffd23f"},
 star:{name:"Star",hero:"#1d2a6b",acc:"#f2c230"},
 heart:{name:"Heart",hero:"#2b1d3a",acc:"#ffd1dc"},
 smiley:{name:"Smiley",hero:"#7b2cbf",acc:"#ffd23f"},
 pizza:{name:"Pizza",hero:"#2e7d32",acc:"#ffd23f"},
 grill:{name:"Grill",hero:"#c0392b",acc:"#ffd166"},
 sun:{name:"Sun",hero:"#0a7fc2",acc:"#ffd23f"},
};
const EMOJI_HERO={hero:"#3b4cca",acc:"#ffd23f"};
const isEmoji=s=>!!s&&!ICONS[s];

const TEMPLATES={
 thanksgiving:{name:"Thanksgiving",title:"Thanksgiving",icon:"turkey",dishes:["Turkey","Stuffing","Mashed potatoes","Gravy","Mac and cheese","Green bean casserole","Cranberry sauce","Dinner rolls","Salad","Pumpkin pie","Wine"]},
 christmas:{name:"Christmas",title:"Christmas dinner",icon:"tree",dishes:["Prime rib","Ham","Mashed potatoes","Roasted vegetables","Dinner rolls","Salad","Eggnog","Wine","Christmas cookies","Pie"]},
 nye:{name:"New Year's Eve",title:"New Year's Eve",icon:"champagne",dishes:["Champagne","Cheese board","Shrimp cocktail","Sliders","Chips and dip","Dessert","Ice","Cups"]},
 birthday:{name:"Birthday",title:"Birthday party",icon:"cake",dishes:["Cake","Pizza","Chips and dip","Salad","Drinks","Ice cream","Plates and napkins"]},
 custom:{name:"Custom",title:"",icon:"smiley",dishes:[]},
};

function grid(rows){
  return rows.map((r,y)=>[...r.padEnd(16,".")].map((ch,x)=>PC[ch]?`<rect x="${x}" y="${y}" width="1" height="1" fill="${PC[ch]}"/>`:"").join("")).join("");
}
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
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
// Big card picture: a pixel icon id, or any emoji the host typed.
function sprite(id){
  if(id==="turkey")return turkey();
  if(isEmoji(id))return `<svg viewBox="0 0 16 16" aria-hidden="true"><text x="8" y="13.2" font-size="13" text-anchor="middle" class="anim-b">${esc(id)}</text></svg>`;
  const rows=ART[id]||ART.smiley;
  return `<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><g class="anim-b">${grid(rows.slice(0,5))}</g><g transform="translate(0 5)">${grid(rows.slice(5))}</g></svg>`;
}

// Little dish icons, picked from the dish name.
const DISH={
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
pizza:["BBBBBBBB",".cccccc.",".crcccr.","..cccc..","..crcc..","...cc...","...c....","........"],
cheese:["........","......yy","....yycy","..yycyyy","yyyyyyyy","yycyyycy","yyyyyyyy","........"],
icecream:["..pppp..",".pppppp.",".pwpppp.","..BBBB..","..BeBB..","...BB...","...BB...","........"],
gravy:["........","....kk..","kkkkkkk.","kbbbbbkk","kbbbbbk.",".kkkkk..","........","........"],
dish:["...kk...","..kkkk..",".kwkkkk.",".kkkkkk.","kkkkkkkk","dddddddd","........","........"]
};
const MATCH=[
 [/red wine|cabernet|pinot noir|merlot|malbec|zinfandel/,"redwine"],
 [/white wine|chardonnay|sauvignon|pinot gri|riesling|ros[eé]|champagne|prosecco|sparkling wine|bubbly|cava/,"whitewine"],
 [/wine/,"redwine"],[/beer|ipa|lager|seltzer|soju|sake/,"beer"],
 [/gin|vodka|whisk|tequila|rum|vermouth|bourbon|liquor|spirit|mezcal|bitters|eggnog|cider/,"spirits"],
 [/booze|cocktail|alcohol/,"booze"],
 [/soda|coke|sprite|juice|lemonade|water|la croix|tea|coffee|drinks?/,"soda"],
 [/chip|crisp|pretzel|popcorn|snack|cracker|dip|salsa|guac/,"chips"],
 [/ice cream|gelato/,"icecream"],
 [/cake|cupcake|brownie|dessert|tart|cheesecake/,"cake"],[/pie/,"pie"],[/cookie/,"cookies"],
 [/pizza/,"pizza"],[/cheese board|charcuterie|cheese plate/,"cheese"],[/gravy|sauce/,"gravy"],
 [/rib|brisket|pork|steak|beef|bbq|sausage|ham\b|roast beef|pot roast/,"ribs"],[/chicken|wing|turkey|drumstick/,"chicken"],
 [/burger|hot ?dog|slider|sandwich/,"burger"],[/dumpling|mandu|gyoza|wonton|bao|pot ?sticker/,"dumplings"],
 [/rice|noodle|japchae|pasta/,"rice"],[/mac|cheese/,"mac"],[/mash|potato/,"mash"],[/stuffing|dressing/,"stuffing"],
 [/salad|greens|slaw|veggie|vegetable|green bean|brussels/,"salad"],[/corn/,"corn"],[/bread|roll|bun|baguette|biscuit/,"bread"],
 [/fruit|apple|berr|grape|melon|orange|cranberr/,"fruit"],
 [/plate|fork|knife|spoon|utensil|napkin|foil|container/,"plates"],[/\bcups?\b/,"cups"],[/\bice\b/,"ice"]
];
const iconFor=name=>{const n=String(name||"").toLowerCase();for(const [re,k] of MATCH)if(re.test(n))return k;return "dish"};
const dishIcon=name=>{const rows=DISH[iconFor(name)];return `<svg viewBox="0 0 8 8" shape-rendering="crispEdges" aria-hidden="true">${rows.map((r,y)=>[...r].map((ch,x)=>PC[ch]?`<rect x="${x}" y="${y}" width="1" height="1" fill="${PC[ch]}"/>`:"").join("")).join("")}</svg>`};

function applyLook(id){
  const t=ICONS[id]||EMOJI_HERO,s=document.documentElement.style;
  s.setProperty("--hero",t.hero);s.setProperty("--acc",t.acc);
  return t;
}
function fmtWhen(date,time){
  if(!date)return "";
  const d=new Date(date+"T12:00:00");
  let out=d.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});
  if(time){const [h,m]=time.split(":").map(Number);out+=` · ${((h+11)%12)+1}${m?":"+String(m).padStart(2,"0"):""} ${h<12?"AM":"PM"}`}
  return out;
}
const mapsUrl=a=>"https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(a||"");
// Links made before the redesign: items/menu/place/address/theme.
function normalize(d){
  if(Array.isArray(d.dishes))return d;
  const icon={thanksgiving:"turkey",bbq:"grill",birthday:"cake",holiday:"tree",party:"balloons"}[d.theme]||"smiley";
  return {...d,icon,where:[d.place,d.address].filter(Boolean).join(", "),note:d.notes||"",dishes:(d.items||[]).map(i=>({k:i.k,n:i.n}))};
}
// Clipboard API first; falls back to a hidden textarea for embedded or older browsers.
async function copyText(t){
  try{await navigator.clipboard.writeText(t);return true}catch(e){}
  const a=document.createElement("textarea");a.value=t;a.setAttribute("readonly","");a.style.cssText="position:fixed;top:0;left:0;opacity:0";
  document.body.appendChild(a);a.select();a.setSelectionRange(0,t.length);
  let ok=false;try{ok=document.execCommand("copy")}catch(e){}
  a.remove();return ok;
}
window.G={copyText,ICONS,TEMPLATES,sprite,dishIcon,applyLook,isEmoji,esc,fmtWhen,mapsUrl,normalize};
})();
