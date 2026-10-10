# Building, deploying and operating the Adhesa Plate site

The general recipe this repository follows, with the reasoning behind each choice, is
[doc/guides/static-site-on-cloudflare.md](doc/guides/static-site-on-cloudflare.md). This file is the
short, repository-specific version.

## What gets published where

| Surface | Address                         | Built from                      | Published by                                                                    |
| ------- | ------------------------------- | ------------------------------- | ------------------------------------------------------------------------------- |
| Website | `adhesaplate.countinglight.com` | `website/` (Astro, static HTML) | Workers Build `adhesaplate-site` on push to `deploy`, and `npm run deploy:site` |

Every Wrangler command uses the pinned version `npx wrangler@4.129.0`. Run
`npx wrangler@4.129.0 whoami` and confirm the account that owns `countinglight.com` before any
deploy; `npm run deploy:site` prints it as part of the run.

## Branches

Work moves in one direction, by fast-forward:

```
working branch (vlads-dev)  ->  master  ->  deploy
```

- Development happens on working branches.
- `master` is the stable branch. It is not a deployment trigger.
- `deploy` only ever follows `master`: **a push to it publishes the website.** No direct commits.

```bash
git switch deploy
git merge --ff-only master
git push origin deploy
git switch vlads-dev
```

## Toolchain

- Node `22.20.0` (`.nvmrc`). Astro needs 22.12 or newer.
- npm workspaces: one `npm ci` at the repository root installs everything. `website/` is a workspace;
  a future app is another one.

## Commands

Run from the repository root.

| Command                | What it does                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| `npm run dev`          | Astro dev server with hot reload, `http://localhost:4321`                                  |
| `npm run build:site`   | Builds `website/dist`, then marks it as a review build (see [Search engines](#search-engines)) |
| `npm run preview:site` | Builds, then serves `website/dist` through Wrangler exactly as the Worker will, port 8787   |
| `npm run check`        | Type and template check (`astro check`) and the LF line-ending check                        |
| `npm run deploy:site`  | Builds, prints the Cloudflare account, deploys with `-c wrangler.site.jsonc`                |

**Never run a bare `npx wrangler deploy`.** Always name the configuration.

## Deploying with Cloudflare

### One-time setup

1. Check Cloudflare > `countinglight.com` > DNS for an existing record named `adhesaplate`. A Worker
   Custom Domain creates its own record and certificate and conflicts with an existing one.
2. Create the Worker with one manual deploy: `npx wrangler@4.129.0 login`, then
   `npm run deploy:site`. The first deploy creates the custom domain from `wrangler.site.jsonc`.
3. Connect Git, in the dashboard: **Workers & Pages** > `adhesaplate-site` > **Settings** >
   **Builds** > **Connect**. Grant the Cloudflare GitHub app access to `countinglight/adhesaplate`.
   - Production branch: `deploy`. Root directory: `/`.
   - Build command: `npm run build:site`.
   - Deploy command: `npx wrangler@4.129.0 deploy -c wrangler.site.jsonc`.
   - Build variable `NODE_VERSION` = `22.20.0`, exactly.
   - Leave non-production branch builds off.
4. Protect `deploy` in GitHub (Settings > Branches): no force pushes, no deletion.

Step 3 is the only step that needs the dashboard.

### Verification

```bash
curl -I https://adhesaplate.countinglight.com/
```

The response must be `200` and, while this is a review deployment, include
`x-robots-tag: noindex, nofollow`. Then open `/`, `/products/` and `/contact-us/` in a private
window, on a phone as well as a desktop. A small "Review build" badge shows on every hostname other
than `adhesaplate.com`.

### Rollback

**Workers & Pages** > `adhesaplate-site` > **Deployments** > last good version > **Rollback**. Then
revert the bad commit, or the next push to `deploy` publishes it again.

| Symptom                                      | Cause and fix                                                                    |
| -------------------------------------------- | -------------------------------------------------------------------------------- |
| Build fails at `Installing nodejs <version>` | `NODE_VERSION` is not an exact version. Set `22.20.0`.                           |
| `website/dist` missing at deploy             | The build command is empty or wrong. It must be `npm run build:site`.            |
| Custom domain conflict                       | Remove the conflicting DNS record or the hostname from its previous Worker.      |
| Site appears in search results before cutover | The deploy bypassed `build:site`. Rebuild with it and check the header as above. |

## Search engines

The site is built for the production address from the start: canonical URLs, the sitemap and Open
Graph URLs all name `https://adhesaplate.com` (`site` in `website/astro.config.mjs`), and page paths
match the legacy site.

Until cutover the deployment must not be indexed, or it competes with the live site as duplicate
content. `scripts/mark-review-headers.js` runs at the end of every `build:site`. It reads the routes
in `wrangler.site.jsonc` and, unless one of them is `adhesaplate.com`, appends an
`X-Robots-Tag: noindex, nofollow` rule to the built `_headers`. Changing the route to the production
hostname is therefore the whole switch.

The cutover steps are in the guide:
[Cutover](doc/guides/static-site-on-cloudflare.md#9-cutover-to-the-production-domain).

## Adding a page

**A content page** (product, industry, material, capability, blog post) is one Markdown file under
`website/src/content/pages/<section>/`. Its front matter gives the `title`, `description`, `section`
and `path`; `path` is the page's URL and must be the legacy page's path
([doc/seo/url-inventory.md](doc/seo/url-inventory.md)). `website/src/pages/[...slug].astro` renders
it, and links to it across the site stop pointing at the legacy site automatically. The front matter
is checked at build time by `website/src/content.config.ts`.

**A hand-built page** (an index or a page with its own layout):

1. Create `website/src/pages/<path>/index.astro`, using the legacy path. Wrap it in the `Base`
   layout and give it a `title` and a `description`.
2. Add the path to the `built` set in `website/src/lib/links.ts`.

Catalog cards (the entries listed on the index pages) and the FAQ are data files under
`website/src/data/`.
