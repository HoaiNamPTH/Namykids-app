import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

const roots = ["app", "src"];
const violations = [];
const checks = [
  {
    name: "secret-like credential",
    pattern: /service[_-]?role|SUPABASE_SECRET/i
  },
  {
    name: "prohibited permission or identifier",
    pattern: /(?:from\s*["']|require\s*\()["']expo-(location|contacts|camera|tracking-transparency)|react-native-device-info|advertisingId/i
  }
];

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? filesIn(path) : [path];
    })
  );
  return nested.flat();
}

for (const root of roots) {
  for (const path of await filesIn(root)) {
    if (!/\.(ts|tsx)$/.test(path)) continue;
    const source = await readFile(path, "utf8");
    for (const check of checks) {
      if (check.pattern.test(source)) {
        violations.push(`${relative(process.cwd(), path)}: ${check.name}`);
      }
    }

    if ((path.includes("app") || path.includes("engines")) && /\.(from|insert|update|upsert|delete|rpc)\s*\(/.test(source)) {
      violations.push(`${relative(process.cwd(), path)}: direct data write/access outside approved data boundary`);
    }
  }
}

if (violations.length > 0) {
  console.error("Foundation quality gate failed:");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exitCode = 1;
} else {
  console.log("Foundation quality gate passed: no secrets, prohibited identifiers, or screen/engine data access.");
}
