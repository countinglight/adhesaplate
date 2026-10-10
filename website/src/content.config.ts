import { defineCollection } from "astro:content";
import { file } from "astro/loaders";
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

export const collections = {
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
