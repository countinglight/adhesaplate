# adhesaplate

The redesigned Adhesa Plate website, built with [Astro](https://astro.build) and served as static
files from a Cloudflare Worker.

| Surface | Address                                 | Source     |
| ------- | --------------------------------------- | ---------- |
| Website | `https://adhesaplate.countinglight.com` | `website/` |

The legacy WordPress site at `adhesaplate.com` stays live until cutover. Pages not rebuilt yet link
to it.

## Quick start

```bash
npm ci
npm run dev
```

The site opens at `http://localhost:4321`.

## Where things are

| Path                   | What                                                               |
| ---------------------- | ------------------------------------------------------------------ |
| `website/`             | The Astro site: pages, components, content data, images            |
| `wrangler.site.jsonc`  | The website Worker's configuration                                 |
| `scripts/`             | Build and check helpers ([reference](scripts/README.md))           |
| `doc/guides/`          | Reusable guides, including the static-site-on-Cloudflare recipe    |
| `doc/plans/`           | Open issues and plans                                              |
| `doc/dev_process/`     | Decision records: reverse briefings, options considered, reviews   |
| `doc/seo/`             | The legacy URL inventory used to keep addresses stable at cutover  |

Building, previewing, deploying and the branch flow are in [BUILD.md](BUILD.md). Client-side apps,
when they come, get their own directory and npm workspace beside `website/`.
