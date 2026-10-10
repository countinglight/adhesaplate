# Legacy URL inventory

Every page URL in the legacy site's sitemaps (`page-sitemap.xml`, `post-sitemap.xml`), read on
2026-10-10. The new site keeps these paths, trailing slash included, so rankings and inbound links
carry over at cutover without redirects. A path that will not be kept needs a line in
`website/public/_redirects`.

**Status**: *built* means the page exists in the new site (and is listed in
`website/src/lib/links.ts`); *legacy* means links to it still go to the WordPress site.

Legacy page titles follow the pattern `<Page name> - Adhesa Plate`, and the legacy pages that were
checked carry **no meta description**, so there are no descriptions to preserve; the new pages'
descriptions are new. The home page title is "Adhesa Plate - Industrial Custom Label Printing and
Design".

## Top level

| Path | Status | Note |
| --- | --- | --- |
| `/` | built |  |
| `/products/` | built |  |
| `/industries/` | built |  |
| `/materials/` | built |  |
| `/capabilities/` | built |  |
| `/about-us/` | built |  |
| `/faq/` | built |  |
| `/certifications/` | built | Legacy menu links to anchors `#ul`, `#ul969`, `#reach`, `#rohs`, `#conflict`, `#mil`; the new page keeps these ids. |
| `/contact-us/` | built |  |
| `/blog/` | legacy | Blog index. Posts live at the site root, not under `/blog/`. |

## Products

| Path | Status | Note |
| --- | --- | --- |
| `/products/agency-fcc-labels/` | legacy |  |
| `/products/back-panel-labels/` | legacy |  |
| `/products/barcode-qr-code-labels/` | built | Text checked against a current-design archive capture. |
| `/products/custom-application/` | legacy |  |
| `/products/custom-shape-labels/` | legacy |  |
| `/products/device-spacers-insulators/` | built | Text checked against a current-design archive capture. |
| `/products/dome-labels/` | legacy |  |
| `/products/equipment-labels/` | legacy |  |
| `/products/graphic-overlays/` | legacy |  |
| `/products/id-labels/` | legacy |  |
| `/products/imprintable-labels/` | legacy |  |
| `/products/instruction-labels/` | legacy |  |
| `/products/led-deadfront-clear-windows/` | legacy |  |
| `/products/membrane-switches/` | legacy |  |
| `/products/metallic-labels-nameplates/` | legacy |  |
| `/products/prototypes-rd/` | legacy |  |
| `/products/variable-data-labels/` | legacy |  |
| `/products/vinyl-cut-graphics-labels/` | legacy |  |
| `/products/warning-labels/` | legacy |  |
| `/products/window-decals-static-clings-labels/` | legacy |  |

## Industries

| Path | Status | Note |
| --- | --- | --- |
| `/industries/medical-device-mfg/` | legacy |  |
| `/industries/electronic-device-mfg/` | legacy |  |
| `/industries/industrial-equipment-mfg/` | legacy |  |
| `/industries/energy-device-mfg/` | legacy |  |

## Materials

| Path | Status | Note |
| --- | --- | --- |
| `/materials/polycarbonate-lexan/` | legacy |  |
| `/materials/polyester-mylar/` | legacy |  |
| `/materials/vinyl-2/` | legacy | Irregular slug (`vinyl-2`). Keep, or rename to `/materials/vinyl/` and redirect. |
| `/materials/aluminum-metallics/` | legacy |  |
| `/materials/adhesive-film-foam/` | legacy |  |

## Capabilities

| Path | Status | Note |
| --- | --- | --- |
| `/capabilities/screen-printing/` | built | Text checked against a current-design archive capture. |
| `/capabilities/uv-ink-jet-printing/` | legacy |  |
| `/capabilities/color-matching/` | legacy |  |
| `/capabilities/serializing-barcoding/` | legacy |  |
| `/capabilities/laminating/` | legacy |  |
| `/capabilities/dome-coating/` | legacy |  |
| `/capabilities/die-cutting/` | legacy |  |
| `/capabilities/laser-cutting/` | legacy |  |
| `/capabilities/plotter-cutting/` | legacy |  |
| `/capabilities/embossing/` | legacy |  |
| `/capabilities/combining-technologies/` | legacy |  |
| `/capabilities/full-service-art-dept/` | legacy |  |
| `/thermal-transfer/` | legacy | Irregular: a capability outside `/capabilities/`. Keep the path, or move it and redirect. |

## Blog posts

| Path | Status | Note |
| --- | --- | --- |
| `/what-are-the-benefits-of-custom-dome-labels/` | legacy |  |
| `/what-is-variable-data-printing/` | legacy |  |
| `/do-you-need-a-warning-label/` | legacy |  |
| `/new-wide-format-inkjet-printer-added-to-the-adhesa-plate-lineup/` | legacy |  |
| `/static-cling-window-decals-and-parking-permits/` | legacy |  |
| `/new-adhesaplate-com-website-launch/` | legacy |  |
| `/adhesive-labels-for-the-medical-industry/` | legacy |  |
| `/importance-of-labelling-industrial-machinery/` | legacy |  |
| `/adhesa-plate-graphic-overlay-solutions/` | legacy |  |
| `/labels-for-energy-device-manufacturing/` | legacy |  |
| `/using-polycarbonate-lexan-graphic-overlays/` | legacy |  |
| `/graphic-overlays-adhesive-labels/` | legacy |  |
| `/medical-device-labeling-in-the-news-fda-study/` | legacy |  |
| `/can-you-imagine-the-world-without-adhesive-labels/` | legacy |  |
| `/ul-label-certifier-buys-out-national-analysis-center/` | legacy |  |
| `/ul-label-background-of-ul-approved-label-and-why-it-matters/` | legacy |  |
| `/custom-product-labels-consistent-branding/` | legacy |  |
| `/custom-product-labels-help-to-maintain-safety/` | legacy |  |

## Utility

| Path | Status | Note |
| --- | --- | --- |
| `/ul-label-ordering/` | legacy |  |
| `/term-of-use/` | legacy |  |
| `/privacy-policy/` | legacy |  |
| `/customer-survey/` | legacy | Decide with the owner whether it is still used. |
| `/thank-you/` | legacy | Form confirmation page. Rebuild with the quote form (T1), `noindex`. |
| `/print-preview-page/` | legacy | WordPress leftover. Do not rebuild; let it 404. |
| `/test-product/` | legacy | WordPress leftover. Do not rebuild; let it 404. |

77 URLs in total, 12 built.
