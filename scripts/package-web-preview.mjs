// Turns `expo export --platform web` output into a preview that works from any folder or host
// (for example a private claude.ai artifact):
// - small pictures (under 200 KB) are inlined into the script, so the preview has few files;
// - other asset and script URLs are resolved from the page's own address at load time;
// - the bundle moves out of "_expo" because some hosts reserve names that start with "_".
// Usage: node scripts/package-web-preview.mjs dist
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";

const dist = process.argv[2] ?? "dist";
const jsDir = join(dist, "_expo/static/js/web");
const bundle = readdirSync(jsDir).find((f) => f.endsWith(".js"));
if (!bundle) throw new Error("No web bundle found in " + jsDir);

const INLINE_LIMIT = 200 * 1024;
const MIME = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg" };
const source = readFileSync(join(jsDir, bundle), "utf8");
let inlined = 0;
let relative = 0;
const patched = source.replace(/(uri:|\.exports=)"\/assets\/([^"]+)"/g, (_m, lead, path) => {
  const file = join(dist, "assets", path);
  const mime = MIME[extname(path).toLowerCase()];
  if (mime && existsSync(file) && statSync(file).size < INLINE_LIMIT) {
    inlined += 1;
    const data = readFileSync(file).toString("base64");
    rmSync(file);
    return `${lead}"data:${mime};base64,${data}"`;
  }
  relative += 1;
  return `${lead}(globalThis.__NK_BASE||"")+"/assets/${path}"`;
});

const outName = "app-" + bundle.replace(/^entry-/, "");
mkdirSync(join(dist, "js"), { recursive: true });
writeFileSync(join(dist, "js", outName), patched);
rmSync(join(dist, "_expo"), { recursive: true, force: true });
rmSync(join(dist, "metadata.json"), { force: true });

const indexPath = join(dist, "index.html");
const html = readFileSync(indexPath, "utf8")
  .replace(/<script src="\/_expo[^"]*" defer><\/script>/, "")
  .replace('<html lang="en">', '<html lang="vi">')
  .replace("</body>", `<script>
window.__NK_BASE = location.href.replace(/[#?].*$/, "").replace(/\\/[^/]*$/, "");
var s = document.createElement("script"); s.src = window.__NK_BASE + "/js/${outName}"; document.body.appendChild(s);
</script>
</body>`);
writeFileSync(indexPath, html);
console.log(`Packaged ${outName}: ${inlined} pictures inlined, ${relative} asset URLs made relative to the page.`);
