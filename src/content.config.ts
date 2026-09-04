import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			// Transform string to Date object
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: z.optional(image()),
		}),
});

const projects = defineCollection({
	// One file per project in `src/content/projects/`, scaffolded from
	// the project inventory. Body = condensed archaeology (hub page).
	loader: glob({ base: './src/content/projects', pattern: '**/*.{md,mdx}' }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			repo: z.string().optional(),
			demo: z.string().optional(),
			stack: z.array(z.string()).default([]),
			category: z.string().default('Other'),
			status: z.string().default(''),
			portfolioScore: z.number().min(0).max(100).optional(),
			featured: z.boolean().default(false),
			draft: z.boolean().default(false),
			cover: z.string().optional(),
			language: z.string().optional(),
			focus: z.array(z.string()).default([]),
			updatedDate: z.coerce.date().optional(),
			heroImage: z.optional(image()),
		}),
});

const tutorials = defineCollection({
	// Lessons in `src/content/tutorials/<series>/<nn>-<slug>.{md,mdx}`.
	// Series landing pages assemble from `series` + `part`.
	loader: glob({ base: './src/content/tutorials', pattern: '**/*.{md,mdx}' }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			series: z.string(),
			part: z.number(),
			project: z.string(),
			category: z.string().default(''),
			tags: z.array(z.string()).default([]),
			technologies: z.array(z.string()).default([]),
			difficulty: z.string().default('intermediate'),
			status: z.string().default(''),
			featured: z.boolean().default(false),
			draft: z.boolean().default(true),
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: z.optional(image()),
		}),
});

const experiments = defineCollection({
	// Research-note style entries in `src/content/experiments/`.
	loader: glob({ base: './src/content/experiments', pattern: '**/*.{md,mdx}' }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		category: z.string().default('Experiment'),
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		status: z.string().default('Complete'),
		hypothesis: z.string().default(''),
		technologies: z.array(z.string()).default([]),
		tags: z.array(z.string()).default([]),
		featured: z.boolean().default(false),
		draft: z.boolean().default(true),
	}),
});

export const collections = { blog, projects, tutorials, experiments };
