// Guest pages (/potluck/<slug>, /meet/<slug>) with the event name in the link preview,
// so a link pasted in a group chat shows "Thanksgiving at Dana's" instead of just "Potluck".
// The page itself is the static view.html; only <title> and og:title change.
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { loadLink, SLUG_RE } from "./links.js";

const APPS = new Set(["potluck", "meet"]);
const cache = {};
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

async function viewHtml(app) {
  return (cache[app] ??= await readFile(join(process.cwd(), "public/apps", app, "view.html"), "utf8"));
}

export async function page(request) {
  const url = new URL(request.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const app = url.searchParams.get("app") || parts[0];
  const slug = url.searchParams.get("slug") || parts.at(-1) || "";
  if (!APPS.has(app)) return new Response("Not found", { status: 404 });
  let html = await viewHtml(app);
  try {
    const link = SLUG_RE.test(slug) ? await loadLink(slug) : null;
    const title = link?.type === app ? link.data?.title : "";
    if (title) {
      html = html
        .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)} · 150ct</title>`)
        .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(title)}">`);
    }
  } catch (e) {
    console.error(e);
  }
  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=0, s-maxage=60" },
  });
}
