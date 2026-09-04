import { getCollection } from 'astro:content';

const SITE = 'https://xmirtunjay.github.io/engineering-notebook';

function entry(title: string, description: string, path: string, extra = ''): string {
	return `- [${title}](${SITE}${path}): ${description}${extra}`;
}

export async function GET(): Promise<Response> {
	const lines: string[] = [
		'# Engineering Notebook',
		'',
		'Engineering notes on data systems, AI agents, and the tools built to understand them.',
		'Every project was actually built. Claims are backed by code, tests, or measurements.',
		'',
		'Full URL list: ' + SITE + '/sitemap-index.xml',
		'',
	];

	const projects = await getCollection('projects', ({ data }) => !data.draft);
	lines.push('## Projects', '');
	for (const p of projects) {
		lines.push(
			entry(
				p.data.title,
				p.data.description,
				`/projects/${p.id}/`,
				` [${p.data.category}; ${p.data.status}; stack: ${p.data.stack.join(', ')}]`
			)
		);
	}
	lines.push('');

	const lessons = await getCollection('tutorials', ({ data }) => !data.draft);
	lines.push('## Tutorials', '');
	const seen = new Set<string>();
	for (const l of [...lessons].sort((a, b) => a.data.series.localeCompare(b.data.series) || a.data.part - b.data.part)) {
		if (!seen.has(l.data.series)) {
			seen.add(l.data.series);
			lines.push(`### Series: ${l.data.series} (${SITE}/tutorials/${l.data.series}/)`);
		}
		lines.push(
			entry(
				`Part ${l.data.part}: ${l.data.title}`,
				l.data.description,
				`/tutorials/${l.data.series}/${l.id.split('/').slice(1).join('/')}/`,
				` [difficulty: ${l.data.difficulty}; tech: ${l.data.technologies.join(', ')}]`
			)
		);
	}
	lines.push('');

	const posts = await getCollection('blog');
	lines.push('## Writing', '');
	for (const p of [...posts].sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())) {
		lines.push(entry(p.data.title, p.data.description, `/blog/${p.id}/`));
	}
	lines.push('');

	const experiments = await getCollection('experiments', ({ data }) => !data.draft);
	lines.push('## Experiments', '');
	for (const e of [...experiments].sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())) {
		lines.push(
			entry(
				e.data.title,
				e.data.description,
				`/experiments/${e.id}/`,
				` [status: ${e.data.status}; hypothesis: ${e.data.hypothesis}]`
			)
		);
	}
	lines.push('');

	return new Response(lines.join('\n'), {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
}
