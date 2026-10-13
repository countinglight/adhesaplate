# Visual themes

The prototype currently has two selectable themes: `blue-gold` (the original Astro design) and `graphite-orange` (the owner's October 2026 home-page study). The selector in the header applies a theme to every page without rebuilding. It saves the choice in browser storage. For a review link, add `?theme=graphite-orange` or `?theme=blue-gold` to any page URL; the URL choice takes precedence over the saved choice. The selector updates the URL as well.

## How it works

- `website/src/themes.ts` is the list of IDs and labels. IDs are persistent browser values; don't rename one without a migration.
- `website/src/layouts/Base.astro` applies the selected ID to `<html data-theme="…">` before the page renders. It also loads the font files and handles storage and review links.
- `website/src/styles/global.css` defines the original design tokens and shared components. `website/src/styles/themes.css` contains the graphite token overrides and the few site-wide component changes that tokens cannot express. New themes should primarily set tokens for color, type, radii and shadows.
- `website/src/components/ThemeSwitcher.astro` renders the control. Its options come from the registry.
- The graphite study calls for a different home-page composition, so `website/src/components/GraphiteHome.astro` renders it. `website/src/pages/index.astro` shows the applicable home composition for each theme. Both home pages read copy and catalog entries from `website/src/homeContent.ts`; only visual treatment came from the mockup. Other pages keep their content and use the shared themed components. The image extracted from the owner's HTML study is `website/src/assets/img/graphite-hero.jpg`.

The theme is a presentation choice, not a content fork. Contact details, navigation, page routes, blog entries, and SEO metadata remain shared. In particular, do not duplicate business facts into a new theme unless the layout needs a short excerpt; check those against `website/src/site.config.ts` and the content data.

## Add a theme

1. Add a stable ID and human-readable label to `website/src/themes.ts`.
2. Add `html[data-theme="your-id"]` rules in `website/src/styles/themes.css`, starting with the color, font, radius, shadow, and gradient tokens. Check contrast and keyboard focus colors.
3. If the design needs a structurally different home page, add a home component and its visibility rule to `website/src/pages/index.astro`. Read copy and catalog entries from `website/src/homeContent.ts`; keep routes and factual content shared. Use the existing `Header`, `Footer`, and inner-page components unless a genuine layout change requires overrides.
4. Check the home page, a product detail, the blog, and the contact page at desktop and phone widths in each theme. Verify the selector, storage, shareable URL, links, keyboard navigation, and `npm run check` / `npm run build:site`.

The graphite home is intentionally a visual experiment. Its quote button currently uses the prototype's `mailto:` quote link; theme work does not add form handling. Before publishing a final design, review the owner's marketing copy, image rights, and all standards claims.
