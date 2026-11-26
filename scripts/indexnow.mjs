// Tells Bing, Yandex and other IndexNow engines that every page in the sitemap changed.
// Runs from GitHub Actions after a push to main. Usage: node scripts/indexnow.mjs
import { readFile } from "node:fs/promises";
const KEY = "1bbf1cf38d203cb33ad5332469806db5"; // also served at https://150ct.com/1bbf1cf38d203cb33ad5332469806db5.txt
const HOST = "150ct.com";
const xml = await readFile(new URL("../public/sitemap.xml", import.meta.url), "utf8");
const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList }),
});
console.log("IndexNow", res.status, urlList.length, "urls");
if (res.status >= 400) process.exit(1);
