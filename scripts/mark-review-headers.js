#!/usr/bin/env node

// Adds a noindex rule to the built site unless the Worker it is about to be
// deployed to serves the production hostname. The decision is read from the
// routes in wrangler.site.jsonc, so pointing that route at the production
// domain is all it takes to make the site indexable: there is no flag to
// forget. Runs as the last step of `npm run build:site`.

const fs = require("fs");
const path = require("path");

const productionHost = "adhesaplate.com";
const configPath = path.join(process.cwd(), "wrangler.site.jsonc");
const distPath = path.join(process.cwd(), "website", "dist");
const headersPath = path.join(distPath, "_headers");
const marker = "# review deployment: keep out of search engines";

if (!fs.existsSync(distPath)) {
  console.error("website/dist not found. Run the Astro build first.");
  process.exit(1);
}

// wrangler.site.jsonc is JSON with comments and trailing commas.
const config = JSON.parse(
  fs
    .readFileSync(configPath, "utf8")
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/,(\s*[}\]])/g, "$1"),
);

const hosts = (config.routes || []).map((route) => route.pattern);
const isProduction = hosts.some(
  (host) => host === productionHost || host === `www.${productionHost}`,
);

if (isProduction) {
  console.log(`Routes include ${productionHost}: site left indexable.`);
  process.exit(0);
}

const existing = fs.existsSync(headersPath)
  ? fs.readFileSync(headersPath, "utf8")
  : "";

if (!existing.includes(marker)) {
  const rule = `${marker}\n/*\n  X-Robots-Tag: noindex, nofollow\n`;
  const next = existing.trim() ? `${existing.trimEnd()}\n\n${rule}` : rule;
  fs.writeFileSync(headersPath, next);
}

console.log(
  `Marked website/dist as a review build for ${hosts.join(", ") || "no route"} (X-Robots-Tag: noindex).`,
);
