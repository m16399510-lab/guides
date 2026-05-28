import { mkdir, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const version = pkg.version ?? "0.0.0";
const builtAt = new Date().toISOString();

const buildMeta = {
  version,
  buildId: `${version}-${Date.now()}`,
  builtAt
};

const publicDir = new URL("../public/", import.meta.url);
await mkdir(publicDir, { recursive: true });
await writeFile(new URL("version.json", publicDir), JSON.stringify(buildMeta, null, 2), "utf8");

console.log(`Prepared build meta ${buildMeta.buildId}`);
