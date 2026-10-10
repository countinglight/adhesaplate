import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// `site` is the production origin, not the review hostname: canonical URLs,
// the sitemap and Open Graph URLs must all name the address that will rank.
export default defineConfig({
  site: "https://adhesaplate.com",
  // The live WordPress site uses trailing slashes; keeping them means the
  // cutover needs no redirects for pages that keep their path.
  trailingSlash: "always",
  build: { format: "directory" },
  integrations: [sitemap()],
});
