import { defineConfig } from "astro/config";
import { readFileSync } from "node:fs";
import remarkDirective from "remark-directive";
import remarkYuqueCallouts from "./src/plugins/remarkYuqueCallouts.mjs";

const isGitHubPages = process.env.GITHUB_PAGES === "true";
const basePath = isGitHubPages ? "/guides" : "/";
const buildMeta = createBuildMeta();

function createBuildMeta() {
  const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));
  const version = pkg.version ?? "0.0.0";
  const fallback = {
    version,
    buildId: `${version}-${Date.now()}`,
    builtAt: new Date().toISOString()
  };

  try {
    return JSON.parse(readFileSync(new URL("./public/version.json", import.meta.url), "utf8"));
  } catch {
    return fallback;
  }
}

function appVersionPlugin(buildMeta) {
  return {
    name: "app-version-plugin",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = new URL(req.url ?? "/", "http://localhost").pathname;

        if (pathname === "/version.json") {
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.setHeader("Cache-Control", "no-store");
          res.end(JSON.stringify(buildMeta));
          return;
        }

        next();
      });
    }
  };
}

function remarkPublicAssetBase(base) {
  const normalizedBase = base === "/" ? "" : base.replace(/\/$/, "");

  return (tree) => {
    walkMarkdown(tree, (node) => {
      if (node.type === "image" && typeof node.url === "string" && node.url.startsWith("/assets/")) {
        node.url = `${normalizedBase}${node.url}`;
      }
    });
  };
}

function walkMarkdown(node, visitor) {
  if (!node) return;

  visitor(node);

  if (!Array.isArray(node.children)) return;

  for (const child of node.children) {
    walkMarkdown(child, visitor);
  }
}

export default defineConfig({
  site: isGitHubPages ? "https://m16399510-lab.github.io" : undefined,
  base: basePath,
  vite: {
    plugins: [appVersionPlugin(buildMeta)]
  },
  markdown: {
    remarkPlugins: [remarkDirective, remarkYuqueCallouts, [remarkPublicAssetBase, basePath]]
  }
});
