import { site } from "../site.config";

// Paths that exist in this build. Every internal link goes through href(), so
// a page that has not been rebuilt yet still resolves: it points at the same
// path on the legacy site. Adding a page here (and under src/pages) is all it
// takes to bring its links home.
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
]);

export function isBuilt(path: string): boolean {
  return built.has(path.split("#")[0]);
}

export function href(path: string): string {
  return isBuilt(path) ? path : `${site.legacyOrigin}${path}`;
}
