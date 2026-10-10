# Reverse briefing and first build, 2026-10-10

Process record for step 1 of the Adhesa Plate redesign. The settled outcome is in
[BUILD.md](../../BUILD.md), [the guide](../guides/static-site-on-cloudflare.md) and
[the open issues](../plans/open-issues.md); this file records the questions, the answers and why.

## The request

Modernise `adhesaplate.com` (WordPress with Elementor, about 77 pages): presentation, aesthetics,
mobile friendliness. Step 1 is a real working process, not a proof of concept: repository
organisation, a Cloudflare Worker, local scripts and automated deployment, all as in LucidDream, plus
a reusable document for future static sites. As content: the home page in Astro, smoother icons, a
more gradient colour scheme. Later added: prepare the parts future SEO work will need.

## Questions and answers

| #   | Question                                                         | Answer (Vlad)                                                                                                   |
| --- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 1   | Review URL; is the `adhesaplate.com` zone in Cloudflare?         | Do not create the zone yet. Do it when a working v1 (full site on the subdomain) has the owner's general approval. Review on `adhesaplate.countinglight.com`. |
| 2   | `noindex` on the review site until cutover?                      | Yes.                                                                                                            |
| 3   | Deploy on push to `deploy` (Workers Build) plus a manual script? | Yes, both.                                                                                                      |
| 4   | Same `vlads-dev → master → deploy` flow?                         | Yes. It applies to all of Vlad's repositories.                                                                  |
| 5   | Copy the legacy site's images into the repository?               | Yes, for now. The owner supplies high-resolution assets once the overall design is comfortable.                 |
| 6   | Keep copy as is, fix typos, drop the percentage bars, list changes? | Yes.                                                                                                         |
| 7   | Menu items for pages not yet rebuilt                             | If it is contained work, also build the top-level pages the home page links to; inside them, keep links to the live site. |
| 8   | "Get a quote" as phone and e-mail links, form deferred?          | Yes; noted as an open issue.                                                                                    |
| 9   | No Tag Manager, Ads or cookie banner on the review site?         | Yes; noted as an open issue.                                                                                    |
| 10  | Brand constraints?                                               | None yet. The owner wants to see a proposal and comment on it rather than state preferences.                    |
| 11  | May the assistant screenshot the local preview itself?           | Yes, in this project, in the built-in sandboxed browser rather than the system browser.                         |
| 12  | Is Wrangler logged in?                                           | It is set up on the machine for LucidDream.                                                                     |
| 13  | Search Console and Analytics access?                             | Open. Tracked as O4.                                                                                            |
| 14  | Are Google Ads campaigns running?                                | Open. Tracked as O5.                                                                                            |

## Decisions made while building

- **Astro adds a build step that LucidDream's site does not have.** The Worker serves
  `website/dist`; the Workers Build gets `npm run build:site` as its build command.
- **npm workspaces** rather than a separate install in `website/`: one lockfile, one `npm ci`, which
  is also all the Cloudflare build runs. A future app is another workspace.
- **Only the website Worker for now.** The production-app and prototype Workers of the three-Worker
  layout are added with the first app; the guide documents all three.
- **Top-level menu only.** The legacy menu has about 50 sub-items; they are listed as cards on the
  eight top-level pages and link to the legacy site through `href()` until rebuilt.
- **`noindex` by build script, not by a hostname rule in `_headers`.** The first attempt was a rule
  scoped to `https://adhesaplate.countinglight.com/*`. Under `wrangler dev` it was applied to
  `localhost` as well, so its behaviour on other hostnames could not be trusted, and the failure
  mode (production deindexed) is the expensive one. `scripts/mark-review-headers.js` derives the
  rule from the route in `wrangler.site.jsonc` instead; both cases were exercised locally.
- **Design direction**, proposed for the owner's reaction: deep navy to blue to cyan gradient taken
  from the logo's tile, one amber accent reserved for the quote button, Manrope for headings and
  Inter for text (self-hosted), white cards with soft shadows, a single line-icon set drawn by hand.
- **Logo** redrawn as SVG from the raster original, with live text for the wordmark.
- **Certification marks** left unaltered; RoHS and REACH set as text because the legacy badge files
  could not be retrieved.

## Incident: the live site blocked the build machine

To record the legacy titles and descriptions, about 80 pages of `adhesaplate.com` were fetched in
parallel from the browser. The site's security plugin answered with "access limited" (HTTP 503) for
the requesting address, and the host returned HTTP 507 for part of the burst. Nothing was changed on
the site, but the address was blocked for a time and the server was briefly loaded.

What changed as a result:

- The live server was not contacted again. Page text and images for this step came from the Internet
  Archive, one request at a time.
- Archived copies are of different ages (2018 to 2025). The Certifications text in particular is
  from 2018 and is flagged for confirmation (O7).
- Vlad will ask the owner for an export of the content tree (O1), so later pages are rebuilt from
  files.
- The guide carries the rule: read a legacy site one page at a time, or not at all.

## Verification done

- `npm run check`: 0 errors, 0 warnings.
- Built output: 9 pages in the sitemap, all with canonical URLs on `https://adhesaplate.com`;
  JSON-LD on the home page (business), inner pages (breadcrumbs) and FAQ; the 404 page `noindex`.
- Served through `wrangler dev`: `/products` redirects to `/products/`; unknown paths return 404 with
  the 404 page; `/_astro/*` is cached immutably; the review `noindex` header is present.
- Looked at in the built-in browser at 1366 px and 375 px: home page top to bottom, mobile menu,
  product cards, Certifications. No horizontal overflow at 375 px.
