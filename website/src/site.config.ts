// Single source of site-wide facts. Pages, the SEO head, structured data and
// the footer all read from here, so a change of phone number or address is one
// edit.

export const site = {
  name: "Adhesa Plate",
  legalName: "Adhesa Plate Manufacturing",
  tagline: "Custom Labels",
  // Production origin. Canonical and Open Graph URLs are built from this even
  // on the review deployment.
  productionHost: "adhesaplate.com",
  // Origin of the legacy WordPress site. Pages not rebuilt yet link there; see
  // src/lib/links.ts.
  legacyOrigin: "https://adhesaplate.com",
  defaultDescription:
    "Adhesa Plate manufactures custom labels, product markings, graphic overlays, membrane switches, insulators and shields. UL 969 tested and approved, serving manufacturers since 1954.",
  founded: 1954,
  phone: { display: "1 (206) 682-0141", href: "tel:+12066820141" },
  tollFree: { display: "1-800-634-9701", href: "tel:+18006349701" },
  email: "sales@adhesaplate.com",
  artEmail: "art@adhesaplate.com",
  address: {
    street: "378 Upland Dr",
    city: "Tukwila",
    region: "WA",
    postalCode: "98188",
    country: "US",
  },
  // Production tracking remains off until cutover. The separate review
  // container loads only when a tester explicitly opts in for this tab.
  analytics: {
    gtmId: "",
    previewHost: "adhesaplate.countinglight.com",
    previewGtmId: "GTM-TNPKNNTS",
  },
} as const;

export const quoteHref = `mailto:${site.email}?subject=${encodeURIComponent("Quote request")}`;

export const nav = [
  { label: "Products", path: "/products/" },
  { label: "Industries", path: "/industries/" },
  { label: "Materials", path: "/materials/" },
  { label: "Capabilities", path: "/capabilities/" },
  { label: "About", path: "/about-us/" },
  { label: "FAQ", path: "/faq/" },
  { label: "Certifications", path: "/certifications/" },
  { label: "Blog", path: "/blog/" },
  { label: "Contact", path: "/contact-us/" },
] as const;
