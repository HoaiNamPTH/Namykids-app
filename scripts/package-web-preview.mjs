// Turns `expo export --platform web` output into a preview that works from any folder or host
// (for example a private claude.ai artifact): asset and script URLs are resolved from the page's
// own address at load time instead of the site root. Usage: node scripts/package-web-preview.mjs dist
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dist = process.argv[2] ?? "dist";
const jsDir = join(dist, "_expo/static/js/web");
const bundle = readdirSync(jsDir).find((f) => f.endsWith(".js"));
if (!bundle) throw new Error("No web bundle found in " + jsDir);

const bundlePath = join(jsDir, bundle);
const source = readFileSync(bundlePath, "utf8");
const assetUrl = /(uri:|\.exports=)"\/assets\//g;
const patched = source.replace(assetUrl, '$1(globalThis.__NK_BASE||"")+"/assets/');
writeFileSync(bundlePath, patched);

const indexPath = join(dist, "index.html");
const html = readFileSync(indexPath, "utf8")
  .replace(/<script src="\/_expo[^"]*" defer><\/script>/, "")
  .replace('<html lang="en">', '<html lang="vi">')
  .replace("</body>", `<script>
window.__NK_BASE = location.href.replace(/[#?].*$/, "").replace(/\\/[^/]*$/, "");
var s = document.createElement("script"); s.src = window.__NK_BASE + "/_expo/static/js/web/${bundle}"; document.body.appendChild(s);
</script>
</body>`);
writeFileSync(indexPath, html);
console.log(`Packaged ${bundle}: ${(source.match(assetUrl) ?? []).length} asset URLs made relative to the page.`);
