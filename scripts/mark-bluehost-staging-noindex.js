#!/usr/bin/env node

// Apache on Bluehost does not read Cloudflare's _headers file. Mark each HTML
// page in the staging build directly so it cannot compete with production.
const fs = require("node:fs");
const path = require("node:path");

const dist = path.resolve(__dirname, "../website/dist");
const robotsTag = '<meta name="robots" content="noindex, nofollow">';
let pages = 0;

function visit(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      visit(file);
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      const html = fs.readFileSync(file, "utf8");
      if (!/<head\b[^>]*>/i.test(html)) {
        throw new Error(`Missing <head> in ${file}`);
      }
      const marked = html.includes(robotsTag)
        ? html
        : html.replace(/<head\b[^>]*>/i, `$&${robotsTag}`);
      fs.writeFileSync(file, marked);
      pages += 1;
    }
  }
}

if (!fs.existsSync(path.join(dist, "index.html"))) {
  throw new Error("Build output missing: website/dist/index.html");
}
visit(dist);
if (pages === 0) throw new Error("No HTML pages were marked noindex");
console.log(`Marked ${pages} staging HTML pages noindex`);
