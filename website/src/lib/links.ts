import { site } from "../site.config";

// Paths that exist in this build. Every internal link goes through href(), so
// a page that has not been rebuilt yet still resolves: it points at the same
// path on the legacy site. Hand-built pages are listed here; pages in the
// `pages` content collection are picked up from their front matter.
const migrated = import.meta.glob<{ path: string }>("../content/pages/**/*.md", {
  eager: true,
  import: "frontmatter",
});

const built = new Set([
  "/",
  "/products/",
  "/industries/",
  "/materials/",
  "/capabilities/",
  "/about-us/",
  "/faq/",
  "/certifications/",
  "/contact-us/",
  "/blog/",
  ...Object.values(migrated).map((frontmatter) => frontmatter.path),
]);

export function isBuilt(path: string): boolean {
  return built.has(path.split("#")[0]);
}

export function href(path: string): string {
  return isBuilt(path) ? path : `${site.legacyOrigin}${path}`;
}
