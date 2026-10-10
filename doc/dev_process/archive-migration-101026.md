# Migrating pages from the Internet Archive, 2026-10-10

Process record. The outcome is in [the open issues](../plans/open-issues.md) (T3, O1).

## The request

While the owner prepares a content export (expected in two days), migrate every remaining page from
the Internet Archive, on the assumption that the site has not changed in months and the Archive
therefore holds its current state.

## What the Archive actually holds

Its capture index for `adhesaplate.com` (4,704 HTML captures, back to 1997) shows:

- **Current design, current URLs (2022 to 2025):** the home page, `/products/`, `/capabilities/`,
  `/about-us/`, `/faq/`, `/contact-us/`, and three detail pages:
  `/products/barcode-qr-code-labels/`, `/products/device-spacers-insulators/`,
  `/capabilities/screen-printing/`.
- **Everything else:** newest copies are from the pre-2020 site (Enfold theme, late 2018 to 2019),
  where detail pages sat at the root (`/dome-labels/`, `/die-cutting/`).
- **Not held at all in a usable form:** UL label ordering, customer survey, the current terms of use
  and privacy policy (only 2015 versions), and two of the 18 blog posts.

## Check: did the text change between the two designs?

For the two pages captured in both designs, the extracted text was compared word by word:

| Page                      | Old design | Current design | Result                                    |
| ------------------------- | ---------- | -------------- | ----------------------------------------- |
| Barcode & QR Code Labels  | 2019-06-27 | 2022-12-29     | identical (167 words)                     |
| Device Spacers/Insulators | 2019-06-27 | 2023-06-07     | identical apart from the repeated heading |

Screen Printing has two current-design captures (2022, 2023) with identical text. This suggests the
2020 redesign carried the text over unchanged, but two pages are a small sample.

## Decision

Vlad: migrate only what can be validated this way, and wait for the owner's export for the rest.

The three pages above are migrated as Markdown under `website/src/content/pages/`. The bulk download
was stopped part-way; nothing from the unvalidated copies is in the repository.

Built for all of them and ready for the export: the `pages` content collection, the
`[...slug].astro` template (hero with breadcrumb, text, photo, quote card, sibling links, blog-post
variant), and automatic link resolution from each page's front matter.

If the export does not arrive, the 2018 to 2019 copies are the fallback. The converter used here
(HTML to Markdown, with link and image rewriting) was a throwaway script outside the repository and
would have to be written again.
