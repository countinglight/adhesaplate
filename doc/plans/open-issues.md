# Open issues and TODO

Living list for the redesign. Decisions and their reasons are in
[../dev_process/reverse-briefing-101026.md](../dev_process/reverse-briefing-101026.md).

## Waiting on the owner

| #   | Item                                                                                                           | Needed for                         |
| --- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| O1  | **Content tree export** from the WordPress site (pages, posts, media), so pages are rebuilt from files rather than by reading the live site | Every remaining page               |
| O2  | **High-resolution assets**: vector logo, product photos, facility and equipment photos, certification marks. Current images are the legacy site's small copies (product shots about 380×600) | Final design                       |
| O3  | **Design feedback** on the first round: colour scheme, typography, logo redraw, icon style                      | Next design round                  |
| O4  | **Search Console and Analytics access**, to see which pages and queries bring traffic today                     | SEO baseline before cutover        |
| O5  | **Google Ads**: are campaigns running? The legacy site loads Ads scripts. If so, quote-request conversion tracking must survive cutover | Quote form priority (T1)           |
| O6  | **Facts to confirm** (see [Copy changes](#copy-changes-to-confirm))                                             | Home page                          |
| O7  | **Certifications text** is taken from a 2018 archived copy of the page. Confirm file numbers, REACH/RoHS dates and constructions are current | Certifications page                |

## To build

| #   | Item                                                                                                                                                 |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| T1  | **Quote request form.** A static site needs a backend for it (a small Worker that sends e-mail). Until then "Get a quote" is an e-mail link and a phone link. The legacy form's fields are recorded below. Decide on spam protection and review any cost before enabling. |
| T2  | **Analytics and consent.** The Cloudflare review site has a separate Tag Manager container that loads only after a tester opens `?analytics=on` in that tab. Confirm the container has a published GA4 tag, then verify a test visit in Realtime. Production tracking is still off. Before cutover, configure its own ID and a consistent consent flow across Astro and WordPress; check that each page loads the tag once. |
| T3  | **Remaining pages**: 18 product pages, 4 industries, 5 materials, 12 capabilities, blog (18 posts), UL label ordering, terms of use, privacy policy. Paths in [../seo/url-inventory.md](../seo/url-inventory.md). They wait for the owner's content export (O1): the Internet Archive holds current-design copies of only three detail pages (barcode labels, device spacers, screen printing), which are migrated. For the rest its newest copies are from the pre-2020 site (2018 to 2019); for the two pages where both exist the text is identical, so those copies are a usable fallback if the export does not arrive. The page template (`website/src/pages/[...slug].astro`) and the `pages` content collection are ready: a page is one Markdown file. |
| T4  | **Menu dropdowns** for the product, material and capability sub-pages once those pages exist. The header currently has top-level links only.           |
| T11 | **Files linked from legacy pages** (3M data sheet PDFs and similar under `/wp-content/uploads/`): bring them over from the export and host them with the site. |
| T5  | **Redirects** (`website/public/_redirects`) for legacy paths that will not be kept, decided per the inventory.                                         |
| T6  | **Meta descriptions.** The legacy pages have none. Each new page has a first draft; review them once the content is settled.                           |
| T7  | **Product structured data** with the product pages.                                                                                                   |
| T8  | **Production cutover**: add the `adhesaplate.com` zone to Cloudflare, DNS and mail records, route change. Not before the full site is on the review hostname and approved. Steps in [the guide](../guides/static-site-on-cloudflare.md#9-cutover-to-the-production-domain). |
| T9  | **Client-side apps**: add as a sibling workspace with the production-app and prototype Workers when the first one is specified.                        |
| T10 | **Workers Build**: connect the repository to `adhesaplate-site` in the Cloudflare dashboard ([BUILD.md](../../BUILD.md#one-time-setup), step 3).       |

### Legacy quote form fields (for T1)

Full name, phone, e-mail, company name, describe your label, intended surface for the label, size and
shape, number of colors (1 to 10+), quantity needed (1-100, 100-500, 500-1,000, 1,000-2,500+),
application environments (indoor, outdoor, high contact area, heat, fire, cold, ice, water, extreme
environments).

## Performance ideas, not scheduled

`npm run lighthouse` scores all tested pages 99 to 100 for performance in mobile mode, at 83 to
214 KiB per page. These are held back until a problem is actually seen on a physical phone or tablet:

| Idea                                                                    | Would help with                                  |
| ----------------------------------------------------------------------- | ------------------------------------------------ |
| Preload the two font files, or use one family instead of two            | Text appearing in the fallback font first; saves up to 25 KB |
| Inline the CSS into each page                                           | Two fewer requests on first visit                |
| Serve AVIF to browsers that support it                                  | Image weight on photo-heavy pages                |
| Remove the blur effect on the sticky header                             | Scrolling that feels heavy on older phones       |

The larger risk is what gets added later: Tag Manager, Ads tags, a consent banner and form spam
protection each cost more than a whole page does today (T1, T2). Re-run the check when any of them
goes in.

## Copy changes to confirm

The home page text is the legacy text with these changes. Each needs the owner's yes or a correction.

| Legacy                                                              | Now                                                                 | Why                                                                              |
| ------------------------------------------------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| "8,5000+ projects completed"                                        | "8,500+"                                                            | The legacy figure is a typo. It could equally mean 85,000. **Confirm the number.** |
| "60+ years in business"                                             | "Serving manufacturers since 1954", and the years computed from 1954 | 60+ is out of date                                                               |
| "140,000 cups of coffee"                                            | removed; replaced by "UL 969 tested and approved"                   | Filler                                                                           |
| Progress bars "Needs 30%, Materials 35%, Design 45%"                | Three steps: Needs, Materials, Design, each with one new sentence   | The percentages carry no meaning. **The three sentences are new copy.**          |
| "we always try to give 110% for each client"                        | "we always give our best for each client"                           | Tone                                                                             |
| Hero: "We make amazing labels" with no supporting line              | Same headline, plus one sentence drawn from "Our specialty"         | Tells a first-time visitor what the company makes                                |
| Section headings ("What sets us apart", "Our products & services")  | Kept as small labels, with a new larger heading under each          | Page structure and search. **The larger headings are new copy.**                 |
| Graphic Overlays card: same text as Agency & FCC Labels             | A short description of overlays                                     | The legacy text is a copy-paste. **New copy.**                                   |
| Product card texts                                                  | Shortened to two or three lines each                                | Card length. Full text returns on each product page.                             |
| Certifications button "More info"                                    | "View our certifications"                                           | Link text that names its destination (accessibility and search)                  |
| "Quality" paragraph: "In search for machinery…that…requires?"       | Grammar corrected                                                   |                                                                                  |

Other pages: the FAQ drops a duplicated shipping question; About and Contact keep the legacy text with
spelling and grammar fixes ("business module" → "business model", "non-reoccurring" → "non-recurring").
The toll-free number 1-800-634-9701 appears on the legacy About and FAQ pages but not on its home
page; confirm it is still in service.

## Design notes for the next round

- Logo: redrawn as a vector from the 340×58 raster. Replace with the owner's vector file (O2).
- Icons: one hand-drawn line set, 24px grid. No generated artwork.
- Certification marks (UL, CE) are used unaltered; RoHS and REACH are set in type until official
  artwork is supplied.
- Colour tokens are at the top of `website/src/styles/global.css`; a palette change is an edit there.
