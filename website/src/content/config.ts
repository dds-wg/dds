import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { docsSchema } from "@astrojs/starlight/schema";

// Spec documents loaded from the canonical ../spec/ directory.
// generateId prefixes each entry with 'spec/' so Starlight routes them to /spec/*.
const docs = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "../spec",
    generateId: ({ entry }) => `spec/${entry.replace(/\.md$/, "")}`,
  }),
  schema: docsSchema({
    extend: z.object({
      status: z.string().optional(),
      order: z.number().optional(),
      created: z.string().optional(),
    }),
  }),
});

const blog = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "./src/content/blog",
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    author: z.string(),
    date: z.string(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { docs, blog };
