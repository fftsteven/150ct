// Builds dist/preview.html: the whole site in one file, with the real API logic
// (core/handler.js) running in the browser against an in-memory store.
// Used for sharing a clickable preview without a deploy. `npm run preview`
import { build } from "esbuild";
import { readFile, writeFile, mkdir } from "node:fs/promises";

const pub = (p) => readFile("public/" + p, "utf8");

// 1. Bundle the server handler for the browser, with Redis swapped for the mock.
const api = await build({
  stdin: {
    contents: `import { mockRedis } from "./test/mock-redis.js";
      const m = mockRedis();
      try { const saved = JSON.parse(localStorage.getItem("150ct-preview-db") || "null"); if (saved) m.load(saved); } catch {}
      globalThis.__MOCK_REDIS = m;
      export { handle } from "./core/handler.js";
      export const save = () => { try { localStorage.setItem("150ct-preview-db", JSON.stringify(m.dump())); } catch {} };`,
    resolveDir: ".", loader: "js",
  },
  bundle: true, format: "iife", globalName: "API", write: false, platform: "browser",
  plugins: [{ name: "no-upstash", setup(b) { b.onResolve({ filter: /^@upstash\/redis$/ }, () => ({ path: "x", namespace: "stub" })); b.onLoad({ filter: /.*/, namespace: "stub" }, () => ({ contents: "export class Redis {}" })); } }],
});

// 2. Inline each page's local assets and route location/history through the shim.
async function page(path) {
  let html = await inline(await pub(path));
  html = html.replace(/\blocation\.(href|origin|hash|search|pathname)\b/g, "__LOC.$1").replace(/history\.replaceState\(/g, "__LOC.replace(");
  return html.replace("<head>", "<head><script>" + SHIM + "</script>");
}
async function inline(html) {
  const out = [];
  let last = 0;
  for (const m of html.matchAll(/<script src="(\/[^"]+)"><\/script>|<link rel="stylesheet" href="(\/[^"]+)">|<link rel="icon"[^>]*>/g)) {
    out.push(html.slice(last, m.index));
    if (m[1]) out.push("<script>" + (await pub(m[1].slice(1))) + "</script>");
    else if (m[2]) out.push("<style>" + (await pub(m[2].slice(1))) + "</style>");
    last = m.index + m[0].length;
  }
  return out.join("") + html.slice(last);
}

// Runs first inside each page (an iframe). Talks to the shell in the parent.
const SHIM = `(function(){
  var P=parent, R=P.__ROUTE;
  window.__LOC={
    get pathname(){return R.path}, get search(){return R.search}, get hash(){return R.hash},
    get origin(){return P.__ORIGIN},
    get href(){return P.__ORIGIN+R.path+R.search+R.hash}, set href(v){P.__NAV(v)},
    replace:function(a,b,url){R.hash=""}
  };
  window.fetch=function(u,o){return P.__FETCH(u,o)};
  document.addEventListener("click",function(e){
    var a=e.target.closest&&e.target.closest("a[href]");if(!a||a.target==="_blank")return;
    var h=a.getAttribute("href");
    if(h.charAt(0)==="/"||h.indexOf(P.__ORIGIN)===0){e.preventDefault();P.__NAV(h)}
  });
})();`;

const pages = {
  landing: await page("index.html"),
  create: await page("apps/potluck/new.html"),
  view: await page("apps/potluck/view.html"),
};

// Written as a page fragment: the artifact host adds the document skeleton.
const shell = `<title>150ct preview</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
:root{color-scheme:light dark;--bar:light-dark(#3c3a4f,#0f0e18);--barInk:#fff}
:root[data-theme=light]{color-scheme:light}:root[data-theme=dark]{color-scheme:dark}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]){--bar:#0f0e18}}
html,body{margin:0;height:100%;background:var(--bar)}
:root[data-theme=dark]{--bar:#0f0e18}
body{display:flex;flex-direction:column;font:13px/1.4 system-ui,sans-serif}
.bar{background:var(--bar);color:var(--barInk);display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding-block:6px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
.bar code{opacity:.75;overflow-wrap:anywhere;flex:1 1 200px}
.bar button{font:inherit;color:inherit;background:transparent;border:1px solid rgba(255,255,255,.35);border-radius:6px;min-height:32px;padding:0 10px;cursor:pointer}
iframe{flex:1;border:0;width:100%;background:#fff}
</style>
<div class="bar"><button id="back" type="button" aria-label="Back">←</button><code id="url"></code><button id="other" type="button">Be a different guest</button><button id="reset" type="button">Reset data</button></div>
<iframe id="f" title="150ct"></iframe>
<script>${api.outputFiles[0].text}</script>
<script>
var PAGES=${JSON.stringify(pages).replace(/<\//g, "<\\/")};
window.__ORIGIN="https://150ct.com";
var stack=[];
function route(u){
  var x=new URL(u, __ORIGIN);
  window.__ROUTE={path:x.pathname,search:x.search,hash:x.hash};
  var p=x.pathname.replace(/\\/$/,"")||"/";
  var key=p==="/"?"landing":p==="/potluck"?"create":/^\\/potluck\\/[a-z0-9]+$/.test(p)?"view":"landing";
  document.getElementById("url").textContent="150ct.com"+(p==="/"?"/":p)+x.search;
  document.getElementById("f").srcdoc=PAGES[key];
}
window.__NAV=function(u){stack.push(__ORIGIN+__ROUTE.path+__ROUTE.search);route(u)};
window.__FETCH=async function(u,o){
  o=o||{};
  var r=await API.handle(new Request(new URL(u,__ORIGIN),{method:o.method||"GET",headers:o.headers,body:o.body}));
  API.save();return r;
};
document.getElementById("back").onclick=function(){if(stack.length)route(stack.pop())};
document.getElementById("other").onclick=function(){try{localStorage.removeItem("150ct-me");Object.keys(localStorage).filter(function(k){return k.indexOf("150ct-host-")===0}).forEach(function(k){localStorage.removeItem(k)})}catch(e){}route(__ORIGIN+__ROUTE.path+__ROUTE.search)};
document.getElementById("reset").onclick=function(){try{localStorage.clear()}catch(e){}location.reload()};
route("/");
</script>`;

await mkdir("dist", { recursive: true });
await writeFile("dist/preview.html", shell);
console.log("dist/preview.html", (shell.length / 1024).toFixed(0) + " KB");
