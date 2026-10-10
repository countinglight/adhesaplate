# A static website on Cloudflare Workers: the recipe

How to set up a new static website so that it builds, previews, deploys and reaches production the
same way every time. Written from the Adhesa Plate redesign, which follows the LucidDream setup;
point a new project at this file and replace the names.

Names used below, to substitute:

| Placeholder   | Adhesa Plate value              | Meaning                                         |
| ------------- | ------------------------------- | ----------------------------------------------- |
| `<project>`   | `adhesaplate`                   | Repository and Worker name prefix               |
| `<zone>`      | `countinglight.com`             | A zone already in the Cloudflare account        |
| `<review>`    | `adhesaplate.countinglight.com` | Hostname the owner reviews on                   |
| `<production>`| `adhesaplate.com`               | Hostname the site will finally serve            |

## 1. Principles

- **Scripts, not dashboard clicks.** A Worker is created by `wrangler deploy` from a checked-in
  `wrangler.<name>.jsonc`, run through an npm script. The dashboard is used only where there is no
  alternative: connecting the Git repository, Access policies, DNS conflicts.
- **One Worker per surface, each with its own configuration and domain.** The full set for a project
  is three: the marketing **website**, the **production web app**, and a **prototype** web app where
  customers try unreleased branches. A project that is only a website starts with the first and adds
  the others when an app exists.
- **Production from the first commit.** Canonical URLs, the sitemap and page paths are those of the
  production address even while the site is only on a review hostname. Nothing is rewritten at
  cutover.
- **Work flows one way:** working branch → `master` → `deploy`. Only a push to `deploy` publishes.
- **GitHub pushes and pulls are done by the owner of the repository**, never by tooling on its own.
- **No new cost without review.** Static assets on Workers are free on the Free plan; anything that
  is not is built dormant and switched on deliberately.

## 2. Repository layout

```
<project>/
  package.json            root scripts; npm workspaces
  wrangler.site.jsonc     the website Worker
  .nvmrc                  exact Node version
  .gitattributes          LF everywhere
  scripts/                build and check helpers, with a README
  website/                the site (its own npm workspace)
  doc/
    guides/               how-to documents such as this one
    plans/                specifications, open issues
    dev_process/          decision records, named <topic>-MMDDYY.md
    seo/                  legacy URL inventory
  README.md               what this is, where things are
  BUILD.md                build, deploy, operate
```

The site lives in a subdirectory from the start, so a client-side app can be added as a sibling
workspace (`app/`, with `wrangler.jsonc` and `wrangler.prototype.jsonc` at the root) without moving
anything. npm workspaces keep one lockfile at the root, so a single `npm ci` there installs
everything, which is also what the Cloudflare build runs.

`README.md` and `BUILD.md` describe the current state only. Status, dated notes and the story of how
a decision was reached go to `doc/dev_process/`.

## 3. The site

[Astro](https://astro.build), static output. It ships HTML and CSS with no client JavaScript unless
a page asks for it, which is most of what page speed needs.

Settings that matter, in `website/astro.config.mjs`:

- `site: "https://<production>"`. Every absolute URL the build writes comes from this.
- `trailingSlash` and `build.format` chosen to reproduce the legacy site's URL shape exactly.
- `@astrojs/sitemap`.

Structure inside `website/src`:

| Path                      | Role                                                                                   |
| ------------------------- | -------------------------------------------------------------------------------------- |
| `site.config.ts`          | Company facts, navigation, hostnames, analytics id. One edit changes them everywhere.   |
| `layouts/Base.astro`      | The page shell. Every page uses it.                                                     |
| `components/Seo.astro`    | All head metadata. See [section 8](#8-search-engine-groundwork).                         |
| `lib/links.ts`            | `href()`: internal path if the page exists in this build, legacy URL if not.             |
| `content.config.ts`       | Schemas for content data, checked at build time.                                         |
| `data/*.json`             | Content as data: catalog entries, FAQ.                                                   |
| `assets/img/`             | Source images. Astro resizes and re-encodes them; nothing is hand-optimised.             |
| `styles/global.css`       | Design tokens (colour, type, spacing) and shared classes.                                |
| `public/`                 | Files copied as they are: `_headers`, `robots.txt`, favicon.                             |

Fonts are self-hosted through `@fontsource-variable/*` packages, so no request leaves the site.

### Rebuilding page by page

A legacy site is replaced a few pages at a time. `lib/links.ts` holds the set of paths that exist in
the new build; every internal link goes through `href()`, which returns the local path for a built
page and the same path on the legacy origin otherwise. Adding a page is: create it at the legacy
path, add the path to the set. No link is ever dead and none needs revisiting.

## 4. The Worker configuration

`wrangler.site.jsonc`:

```jsonc
{
  "name": "<project>-site",
  "compatibility_date": "2026-09-05",
  "assets": {
    "directory": "./website/dist",
    "html_handling": "force-trailing-slash",
    "not_found_handling": "404-page",
  },
  "workers_dev": false,
  "preview_urls": false,
  "routes": [{ "pattern": "<review>", "custom_domain": true }],
}
```

- There is no Worker script. Requests for static assets are free and unlimited.
- `html_handling` matches the site's trailing-slash choice, so `/products` redirects to `/products/`.
- `workers_dev` and `preview_urls` are off so the site is reachable only at its custom domain.
- The review hostname is a **one-level** subdomain of a zone already in the account. Universal SSL
  covers `*.<zone>` and nothing deeper.
- The production zone is not added to Cloudflare until cutover.

## 5. npm scripts

In the root `package.json`, Wrangler pinned to an exact version:

```json
{
  "workspaces": ["website"],
  "scripts": {
    "dev": "npm run dev -w website",
    "build:site": "npm run build -w website && node ./scripts/mark-review-headers.js",
    "check": "npm run check -w website && npm run line-endings:check",
    "preview:site": "npm run build:site && npx wrangler@4.129.0 dev -c wrangler.site.jsonc",
    "deploy:site": "npm run build:site && npx wrangler@4.129.0 whoami && npx wrangler@4.129.0 deploy -c wrangler.site.jsonc"
  }
}
```

- `deploy:site` prints the logged-in account before it deploys. Read it.
- Every deploy names its configuration with `-c`. A bare `wrangler deploy` is never run: once a
  project has an app, the default configuration is the production app.
- `preview:site` serves the built files through Wrangler, so `_headers`, redirects and the 404 page
  behave as they will in production. `dev` is for editing.

When the app Workers are added they follow the same shape: `build:web`, `deploy:web`, and
`deploy:prototype`, which builds, marks the build `noindex` and deploys with
`-c wrangler.prototype.jsonc`.

## 6. Deployment

### First deploy (creates the Worker and its domain)

1. In Cloudflare > `<zone>` > DNS, confirm no record exists for the review subdomain. A Worker
   Custom Domain creates its own record and certificate.
2. `npx wrangler@4.129.0 login` once per machine, then `npm run deploy:site`.
3. `curl -I https://<review>/` and check the status and headers.

### Automatic deploys (dashboard, once)

**Workers & Pages** > `<project>-site` > **Settings** > **Builds** > **Connect** the repository.

| Setting                 | Value                                                |
| ----------------------- | ---------------------------------------------------- |
| Production branch       | `deploy`                                             |
| Root directory          | `/`                                                  |
| Build command           | `npm run build:site`                                 |
| Deploy command          | `npx wrangler@4.129.0 deploy -c wrangler.site.jsonc` |
| Variable `NODE_VERSION` | the exact version in `.nvmrc`                        |
| Non-production branches | off                                                  |

**One build project per Worker.** A Workers Build deploys to the Worker its project is connected to,
whatever configuration file it is given, so each project's deploy command names exactly one
configuration. If Cloudflare offers to "keep settings consistent" by renaming a Worker in another
configuration file, decline.

The prototype Worker has **no** build project. Only its deploy script publishes it.

### The loop

- Design round: work on the working branch, `npm run deploy:site`, send the owner the review link.
- Approved state: fast-forward `master`, then `deploy`; the push to `deploy` publishes the same thing
  from a clean build.

### Rollback

**Workers & Pages** > the Worker > **Deployments** > last good version > **Rollback**, then revert
the commit so the next push does not republish it.

## 7. Keeping the review site out of search

A review copy of a live site is duplicate content. It is kept out of the index by a response header,
not by `robots.txt` (a crawler must be allowed to fetch a page to see that it is `noindex`).

`scripts/mark-review-headers.js` runs as the last step of `build:site`. It reads the routes in
`wrangler.site.jsonc`; unless one is the production hostname it appends

```
/*
  X-Robots-Tag: noindex, nofollow
```

to the built `_headers`. The rule is derived from the route, so there is no separate flag that could
be left in the wrong state at cutover.

A hostname-scoped rule written directly in `_headers` was tried first and rejected: under
`wrangler dev` it applied to every hostname, and a mistake in that direction would deindex the
production site.

For orientation on the page itself, the layout adds a small "Review build" badge whenever the
hostname is not the production one. That is decided in the browser at runtime, so the same build
serves both.

## 8. Search engine groundwork

Built into the skeleton so that later content work has somewhere to land.

- **Stable URLs.** Inventory the legacy site's URLs from its sitemap into `doc/seo/`. New pages use
  the same paths, trailing slash included. Paths that must change get an entry in
  `website/public/_redirects` (`/old/ /new/ 301`).
- **One head component.** `Seo.astro` writes the title, meta description, canonical link, Open Graph
  and social-card tags for every page. Canonical and `og:url` use the production origin. Each page
  passes its own `title` and `description`; there is a site-wide default description.
- **Structured data.** `lib/structured-data.ts` builds JSON-LD: the business (name, address, phone,
  founding date) on the home page, breadcrumbs on inner pages, `FAQPage` on the FAQ. Product markup
  is added with the product pages.
- **Sitemap and robots.txt** generated or served from the build, both naming the production origin.
- **Content as data.** Repeating content is a typed collection (`content.config.ts`) rather than
  hand-written markup, so each later page is a data entry with required fields, and a missing field
  fails the build.
- **Speed.** No client JavaScript by default, self-hosted fonts, images served as WebP at several
  widths with explicit dimensions, the first image loaded eagerly and the rest lazily.
- **Semantics.** One `h1` per page, headings in order, landmarks, a skip link, alt text on every
  content image.
- **Analytics slot.** `Analytics.astro` loads Google Tag Manager only when an id is configured *and*
  the hostname is the production one. Review and local builds send nothing and need no consent
  banner.
- **Baseline.** Before changing anything, record the legacy titles, descriptions and (with the
  owner's access) the Search Console pages and queries that bring traffic, so there is something to
  compare against after cutover.

### Reading a legacy site politely

Fetch a live site one page at a time with a pause between requests, or better, ask the owner for an
export of the content. A burst of parallel requests is indistinguishable from an attack: on the
Adhesa Plate site it tripped the security plugin and blocked the requesting address. The Internet
Archive (`https://web.archive.org/web/2025id_/<url>`) serves page and image copies without touching
the live server.

## 9. Cutover to the production domain

Done once the full site is on the review hostname and the owner has approved it.

1. Add the production zone to the Cloudflare account and move its nameservers. Recreate the existing
   DNS records first, mail (MX, SPF, DKIM) above all.
2. Complete `website/public/_redirects` for every legacy URL whose path changed, checking against
   `doc/seo/url-inventory.md`.
3. In `wrangler.site.jsonc`, replace the review route with the production hostname (and `www`).
   `build:site` now reports "site left indexable".
4. Set the analytics id in `site.config.ts` if tracking is wanted, and add a consent banner if the
   tags require one.
5. Deploy. Verify with `curl -I https://<production>/` that the status is 200 and there is **no**
   `x-robots-tag` header.
6. Submit `https://<production>/sitemap-index.xml` in Search Console. Watch coverage and the 404
   report for a few weeks.
7. Keep the review hostname, if wanted, as a separate Worker with its own configuration; it stays
   `noindex` because its route is not the production one.

## 10. Checklist for a new site

- [ ] Repository created; working branch created; `master` and `deploy` reserved
- [ ] Root `package.json` with workspaces and the five scripts; `.nvmrc`; `.gitattributes`; `.gitignore`
- [ ] `website/` Astro project with `site`, trailing-slash policy and sitemap set
- [ ] `site.config.ts`, `Base` layout, `Seo`, `Analytics`, `links.ts`
- [ ] `wrangler.site.jsonc` with a one-level review subdomain; `workers_dev` off
- [ ] `scripts/mark-review-headers.js` with the project's production hostname
- [ ] Legacy URL inventory in `doc/seo/`
- [ ] `npm run check` and `npm run preview:site` clean; phone and desktop looked at
- [ ] `wrangler whoami` confirmed; first `npm run deploy:site`; headers verified with `curl -I`
- [ ] Workers Build connected to `deploy` (dashboard)
- [ ] `README.md`, `BUILD.md`, `scripts/README.md`, open-issues list written
