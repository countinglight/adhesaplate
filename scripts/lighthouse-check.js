#!/usr/bin/env node

// Runs Lighthouse in its default mobile mode (a mid-range phone on slow 4G)
// against the built site and fails if a category drops below its budget.
// Serves website/dist itself, on a local port, with gzip as the Worker does.
// Uses the Chrome already installed on this machine, headless, with a
// throwaway profile. Nothing is uploaded; reports are written locally.

const fs = require("fs");
const http = require("http");
const path = require("path");
const zlib = require("zlib");

const distPath = path.join(process.cwd(), "website", "dist");
const reportPath = path.join(process.cwd(), "lighthouse-reports");

// One page of each kind: home, an index, a content page, a plain page.
const pages = ["/", "/products/", "/products/barcode-qr-code-labels/", "/contact-us/"];

// Scores are 0 to 100. Performance is the median of several runs because a
// single run varies by a few points.
const budgets = { performance: 90, accessibility: 95, "best-practices": 95, seo: 95 };
const runs = Number((process.argv.find((arg) => arg.startsWith("--runs=")) || "--runs=3").slice(7));

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".xml": "application/xml",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".woff2": "font/woff2",
};
const compressible = new Set([".html", ".css", ".js", ".json", ".xml", ".txt", ".svg"]);

function serve() {
  const server = http.createServer((request, response) => {
    const urlPath = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    let filePath = path.join(distPath, urlPath);
    if (!filePath.startsWith(distPath)) {
      response.writeHead(403).end();
      return;
    }
    if (urlPath.endsWith("/")) {
      filePath = path.join(filePath, "index.html");
    }
    let status = 200;
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(distPath, "404.html");
      status = 404;
    }
    const extension = path.extname(filePath);
    const headers = { "Content-Type": types[extension] || "application/octet-stream" };
    let body = fs.readFileSync(filePath);
    if (compressible.has(extension) && /\bgzip\b/.test(request.headers["accept-encoding"] || "")) {
      body = zlib.gzipSync(body);
      headers["Content-Encoding"] = "gzip";
    }
    if (urlPath.startsWith("/_astro/")) {
      headers["Cache-Control"] = "public, max-age=31536000, immutable";
    }
    response.writeHead(status, headers).end(body);
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

async function main() {
  if (!fs.existsSync(path.join(distPath, "index.html"))) {
    console.error("website/dist not found. Run npm run build:site first.");
    process.exit(1);
  }

  const { default: lighthouse } = await import("lighthouse");
  const chromeLauncher = await import("chrome-launcher");

  const server = await serve();
  const origin = `http://127.0.0.1:${server.address().port}`;
  const chrome = await chromeLauncher.launch({ chromeFlags: ["--headless=new"] });
  fs.mkdirSync(reportPath, { recursive: true });

  const failures = [];
  try {
    for (const page of pages) {
      const results = [];
      for (let run = 0; run < runs; run += 1) {
        const result = await lighthouse(`${origin}${page}`, {
          port: chrome.port,
          output: "html",
          logLevel: "error",
        });
        results.push(result);
      }

      const scores = {};
      for (const category of Object.keys(budgets)) {
        scores[category] = median(
          results.map((result) => Math.round(result.lhr.categories[category].score * 100)),
        );
      }
      // Keep the report of the run whose performance score is the median.
      const kept = results.find(
        (result) => Math.round(result.lhr.categories.performance.score * 100) === scores.performance,
      );
      const name = page === "/" ? "home" : page.replace(/^\/|\/$/g, "").replace(/\//g, "_");
      fs.writeFileSync(path.join(reportPath, `${name}.html`), kept.report);

      const audits = kept.lhr.audits;
      const line = Object.entries(scores)
        .map(([category, score]) => {
          const failed = score < budgets[category];
          if (failed) {
            failures.push(`${page} ${category} ${score} < ${budgets[category]}`);
          }
          return `${category} ${score}${failed ? " FAIL" : ""}`;
        })
        .join("  ");
      console.log(page);
      console.log(`  ${line}`);
      console.log(
        `  LCP ${audits["largest-contentful-paint"].displayValue}  ` +
          `CLS ${audits["cumulative-layout-shift"].displayValue}  ` +
          `TBT ${audits["total-blocking-time"].displayValue}  ` +
          `weight ${audits["total-byte-weight"].displayValue.replace("Total size was ", "")}`,
      );
    }
  } finally {
    await chrome.kill();
    server.close();
  }

  console.log(`\nReports: ${path.relative(process.cwd(), reportPath)}${path.sep}`);
  if (failures.length > 0) {
    console.error(`\nBelow budget:\n- ${failures.join("\n- ")}`);
    process.exitCode = 1;
  } else {
    console.log("All pages within budget.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
