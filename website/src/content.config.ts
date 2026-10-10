import { defineCollection } from "astro:content";
import { file, glob } from "astro/loaders";
import { z } from "astro/zod";

// Catalog entries. `id` is the URL slug on the legacy site, kept so paths do
// not change at cutover. `summary` doubles as the card text and, later, as the
// starting point for each page's meta description.
const entry = z.object({
  id: z.string(),
  title: z.string(),
  path: z.string().startsWith("/").endsWith("/"),
  group: z.string().optional(),
  summary: z.string().optional(),
  image: z.string().optional(),
  icon: z.string().optional(),
});

const catalog = (name: string) =>
  defineCollection({ loader: file(`src/data/${name}.json`), schema: entry });

// Full pages migrated from the legacy site, one Markdown file each. `path` is
// the page's URL and must match the legacy path; the catch-all route in
// src/pages/[...slug].astro builds a page for every entry.
const pages = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "src/content/pages" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string().max(200),
      path: z.string().startsWith("/").endsWith("/"),
      section: z.enum(["products", "industries", "materials", "capabilities", "blog"]),
      image: image().optional(),
      imageAlt: z.string().optional(),
      date: z.coerce.date().optional(),
      // Where the text came from, until the owner's export replaces it.
      source: z.string().optional(),
    }),
});

export const collections = {
  pages,
  products: catalog("products"),
  industries: catalog("industries"),
  materials: catalog("materials"),
  capabilities: catalog("capabilities"),
  faq: defineCollection({
    loader: file("src/data/faq.json"),
    schema: z.object({
      id: z.string(),
      topic: z.string(),
      question: z.string(),
      answer: z.string(),
    }),
  }),
};
