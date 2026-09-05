// Generates one SVG summary-cover per content page: real section titles,
// top keywords and content stats pulled from the page body.
// Zero dependencies. Run from site root: node tools/generate-blog-covers.mjs
// Output: public/<collection>/<key>.svg (1200x630, site paper/ink).
import { readdirSync, readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SITE = process.cwd();

// Article-based collections. key() maps a content id to the svg basename.
// Template lookup mirrors it: blog -> /blog/<id>.svg,
// tutorials -> /tutorials/<id with '/' as '--'>.svg, etc.
const COLLECTIONS = [
	{ dir: join(SITE, 'src', 'content', 'blog'), out: join(SITE, 'public', 'blog'), label: 'WRITING', accent: '#2337ff', key: (rel) => rel.replace(/\.(md|mdx)$/, '') },
	{ dir: join(SITE, 'src', 'content', 'tutorials'), out: join(SITE, 'public', 'tutorials'), label: 'TUTORIAL', accent: '#15803d', key: (rel) => rel.replace(/\.(md|mdx)$/, '').split('/').join('--') },
	{ dir: join(SITE, 'src', 'content', 'projects'), out: join(SITE, 'public', 'projects'), label: 'CASE STUDY', accent: '#b45309', key: (rel) => rel.replace(/\.(md|mdx)$/, '') },
	{ dir: join(SITE, 'src', 'content', 'experiments'), out: join(SITE, 'public', 'experiments'), label: 'EXPERIMENT', accent: '#7c3aed', key: (rel) => rel.replace(/\.(md|mdx)$/, '') },
];

const INK = '#18181b';
const GRAY = '#63636b';
const FAINT = '#e4e4e7';
const PAPER = '#fbfbfa';
const ACCENT = '#2337ff';

function esc(s) {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const STOPWORDS = new Set(
	'about,after,before,between,could,should,would,there,their,these,those,with,from,that,this,what,when,where,which,while,have,has,into,onto,over,under,more,most,some,such,than,then,also,your,they,them,will,just,like,each,using,used,uses,make,makes,many,much,between,across,within,without,through,during,does,doing,done,being,been,were,your,yours,ours,theirs,itself,its,here,there,other,another,every,never,always,often,only,very,might,must,shall,need,needs,across,per,via,plus,minus,above,below,one,two,three,first,second,today,still,around,example,section,code,part,step,thing,things,while'.split(','),
);

function cleanHeading(s) {
	return s
		.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
		.replace(/[*_`~#]/g, '')
		.replace(/\s+/g, ' ')
		.trim();
}

// Pull a page summary out of the raw body: section titles, top keywords,
// and counts of code/diagram/callout blocks.
function summarize(body) {
	const noCode = body.replace(/```[\s\S]*?```/g, ' ');
	const chapters = [];
	for (const line of noCode.split('\n')) {
		const m = line.match(/^##\s+(.*)$/);
		if (m) {
			const t = cleanHeading(m[1]);
			if (t && !/^(table of contents|contents)$/i.test(t)) chapters.push(t);
		}
	}
	const code = (body.match(/```/g) || []).length / 2;
	const diagrams = (body.match(/<ArchitectureDiagram/g) || []).length;
	const examples = (body.match(/<CodeExample/g) || []).length;
	const notes = (body.match(/<Callout/g) || []).length;
	const prose = noCode
		.replace(/^import .*$/gm, ' ')
		.replace(/<[^>]+>/g, ' ')
		.replace(/https?:\S+/g, ' ')
		.replace(/[#*`_~>|[\]()]/g, ' ')
		.toLowerCase();
	const freq = new Map();
	for (const w of prose.split(/[^a-z0-9+]+/)) {
		if (w.length < 5 || STOPWORDS.has(w) || /^\d+$/.test(w)) continue;
		freq.set(w, (freq.get(w) || 0) + 1);
	}
	const keywords = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([w]) => w);
	// Concept graph: keywords that appear together in the same section link up.
	const sections = body.split(/^##\s+.*/m).slice(1);
	const present = sections.map((s) => {
		const low = s.toLowerCase();
		return keywords.filter((k) => new RegExp(`\\b${k.replace(/\+/g, '\\+')}\\b`).test(low));
	});
	const links = new Map();
	for (const set of present) {
		for (let i = 0; i < set.length; i++) {
			for (let j = i + 1; j < set.length; j++) {
				const k = [set[i], set[j]].sort().join('|');
				links.set(k, (links.get(k) || 0) + 1);
			}
		}
	}
	return { chapters: chapters.slice(0, 6), keywords, links, code: Math.round(code), diagrams, examples, notes };
}

function hashRand(seed) {
	let h = 2166136261;
	for (const c of seed) {
		h ^= c.codePointAt(0);
		h = Math.imul(h, 16777619);
	}
	return () => {
		h = Math.imul(h ^ (h >>> 15), 2246822507);
		h = Math.imul(h ^ (h >>> 13), 3266489909);
		h ^= h >>> 16;
		return (h >>> 0) / 4294967296;
	};
}

function arrowHead(x, y, dir, fill) {
	// Small triangular head pointing dir (1 = +x, -1 = -x).
	return `<polygon points="${x},${y} ${x - dir * 14},${y - 8} ${x - dir * 14},${y + 8}" fill="${fill}"/>`;
}

// Wordless geometric motifs. Zone: x 740..1120, vertically centered ~380.
// Each painter gets (accent, key, params) and returns SVG inner markup.
const MOTIFS = {
	// Scattered dots condensing into an ordered grid (mess -> inventory).
	scatterGrid(accent, key) {
		const rand = hashRand(key);
		let s = '';
		for (let i = 0; i < 9; i++) {
			s += `<circle cx="${(752 + rand() * 120).toFixed(1)}" cy="${(200 + rand() * 330).toFixed(1)}" r="7" fill="none" stroke="${INK}" stroke-width="2.5" opacity="0.55"/>`;
		}
		for (let r = 0; r < 4; r++) {
			for (let c = 0; c < 3; c++) {
				const hot = r === 1 && c === 1;
				s += `<rect x="${952 + c * 58}" y="${272 + r * 58}" width="42" height="42" rx="9" fill="${hot ? accent : 'none'}" stroke="${INK}" stroke-width="2.5"/>`;
			}
		}
		return s;
	},
	// Three stacked bars, one emphasized (afternoons, snapshots, steps).
	stack3(accent, key, p = {}) {
		const ys = [216, 316, 416];
		return ys.map((y, i) => `<rect x="795" y="${y}" width="280" height="72" rx="12" fill="${i === (p.accent ?? 1) ? accent : '#fff'}" ${i === (p.accent ?? 1) ? '' : 'fill-opacity="0.9" '}stroke="${INK}" stroke-width="3"/>`).join('');
	},
	// A cluster with one dashed missing node (have vs need gap).
	clusters(accent) {
		const pts = [[-40, -50], [30, -60], [62, 8], [-12, 58], [-72, 18]];
		let s = pts.map(([dx, dy]) => `<circle cx="${840 + dx}" cy="${380 + dy}" r="13" fill="#fff" stroke="${INK}" stroke-width="3"/>`).join('');
		s += `<circle cx="1030" cy="380" r="56" fill="none" stroke="${GRAY}" stroke-width="2.5" stroke-dasharray="9 8"/>`;
		s += `<circle cx="1030" cy="380" r="9" fill="${accent}"/>`;
		return s;
	},
	// One path bifurcating into two backends (local bridge routing).
	fork(accent) {
		return `<path d="M 750 380 H 860 L 1060 262 M 860 380 L 1060 498" fill="none" stroke="${INK}" stroke-width="3"/>` +
			`<circle cx="750" cy="380" r="9" fill="${INK}"/>` +
			`<circle cx="1060" cy="262" r="10" fill="${accent}" stroke="${INK}" stroke-width="3"/>` +
			`<circle cx="1060" cy="498" r="10" fill="#fff" stroke="${INK}" stroke-width="3"/>`;
	},
	// Two identical parallel paths: same input, same output (determinism).
	twin(accent) {
		const p = (y) => `<path d="M 750 ${y} h 80 v 70 h 80 v -70 h 100" fill="none" stroke="${INK}" stroke-width="3"/>`;
		return p(290) + p(440).replace('stroke=', 'stroke-opacity="0.55" stroke=') +
			`<circle cx="750" cy="290" r="9" fill="${accent}"/><circle cx="750" cy="440" r="9" fill="${accent}"/>` +
			`<circle cx="1010" cy="290" r="9" fill="${accent}"/><circle cx="1010" cy="440" r="9" fill="${accent}"/>`;
	},
	// Closed feedback loop (learning engine).
	loop(accent) {
		return `<circle cx="935" cy="380" r="112" fill="none" stroke="${INK}" stroke-width="3"/>` +
			`<polygon points="935,253 917,279 953,279" fill="${INK}"/>` +
			`<circle cx="935" cy="380" r="12" fill="${accent}"/>`;
	},
	// Horizontal stage pipeline, optional validation gate.
	pipeline(accent, key, p = {}) {
		const n = p.n || 3;
		const size = n > 4 ? 52 : 62;
		const step = n > 4 ? 76 : 92;
		const y = 380 - size / 2;
		let s = '';
		for (let i = 0; i < n; i++) {
			const x = 755 + i * step;
			const last = i === n - 1;
			s += `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="12" fill="${last ? accent : '#fff'}" stroke="${INK}" stroke-width="3"/>`;
			if (i < n - 1) {
				if (p.gate && i === 1) {
					const cx = x + size + 15;
					s += `<polygon points="${cx - 14},380 ${cx},366 ${cx + 14},380 ${cx},394" fill="#fff" stroke="${INK}" stroke-width="2.5"/>`;
				} else {
					s += `<line x1="${x + size}" y1="380" x2="${x + step}" y2="380" stroke="${INK}" stroke-width="2.5"/>`;
				}
			}
		}
		return s;
	},
	// Wide intent narrowing to a point or a clean result (parse, math).
	funnel(accent, key, p = {}) {
		let s = `<polygon points="760,230 760,530 950,438 950,322" fill="#fff" stroke="${INK}" stroke-width="3"/>`;
		if (p.lines) {
			for (const y of [300, 360, 420]) {
				const right = y < 322 ? 760 + 190 * ((y - 230) / 92) : 950;
				s += `<line x1="782" y1="${y}" x2="${(right - 12).toFixed(1)}" y2="${y}" stroke="${INK}" stroke-width="2.5" opacity="0.5"/>`;
			}
		}
		if (p.dot) {
			s += `<line x1="950" y1="380" x2="998" y2="380" stroke="${accent}" stroke-width="5"/>`;
			s += `<circle cx="1024" cy="380" r="17" fill="${accent}" stroke="${INK}" stroke-width="3"/>`;
		}
		return s;
	},
	// Many faint simulation paths converging into one band (Monte Carlo).
	fanBand(accent) {
		let s = '';
		for (let i = 0; i < 7; i++) {
			const yb = 285 + i * 36;
			s += `<path d="M 750 380 Q 875 ${(200 + i * 60).toFixed(1)} 1000 ${yb}" fill="none" stroke="${i === 3 ? accent : INK}" stroke-width="${i === 3 ? 3.5 : 2}" opacity="${i === 3 ? 0.9 : 0.35}"/>`;
		}
		return s + `<rect x="1000" y="262" width="86" height="236" rx="10" fill="${accent}" fill-opacity="0.16" stroke="${INK}" stroke-width="3"/>`;
	},
	// Domain core: concentric rings around one center.
	concentric(accent) {
		return `<circle cx="935" cy="380" r="122" fill="none" stroke="${INK}" stroke-width="2.5"/>` +
			`<circle cx="935" cy="380" r="82" fill="none" stroke="${INK}" stroke-width="2.5"/>` +
			`<circle cx="935" cy="380" r="42" fill="${accent}" fill-opacity="0.14" stroke="${INK}" stroke-width="3"/>` +
			`<circle cx="935" cy="380" r="11" fill="${accent}"/>`;
	},
	// Ascending snapshot steps with a derived trend (net worth).
	stepsTrend(accent) {
		let s = '';
		const hs = [70, 120, 170, 220];
		hs.forEach((h, i) => {
			s += `<rect x="${756 + i * 86}" y="${520 - h}" width="64" height="${h}" rx="8" fill="#fff" stroke="${INK}" stroke-width="3"/>`;
		});
		return s + `<line x1="756" y1="468" x2="1086" y2="252" stroke="${accent}" stroke-width="4"/>` + arrowHead(1086, 252, 1, accent);
	},
	// Foundation pyramid: wide base, deliberate apex (repo + method).
	pyramid(accent) {
		return [310, 230, 150].map((w, i) =>
			`<rect x="${935 - w / 2}" y="${200 + i * 86}" width="${w}" height="66" rx="10" fill="${i === 0 ? accent : '#fff'}" stroke="${INK}" stroke-width="3"/>`).join('');
	},
	// Overlapping tour screens.
	screens(accent) {
		return `<rect x="750" y="230" width="210" height="150" rx="12" fill="none" stroke="${INK}" stroke-width="2.5" opacity="0.35"/>` +
			`<rect x="825" y="295" width="210" height="150" rx="12" fill="none" stroke="${INK}" stroke-width="2.5" opacity="0.6"/>` +
			`<rect x="900" y="360" width="210" height="150" rx="12" fill="#fff" stroke="${INK}" stroke-width="3"/>` +
			`<rect x="918" y="378" width="120" height="16" rx="8" fill="${accent}"/>`;
	},
	// Two stores in sync (offline-first).
	sync(accent) {
		return `<rect x="748" y="315" width="140" height="110" rx="12" fill="#fff" stroke="${INK}" stroke-width="3"/>` +
			`<rect x="992" y="315" width="140" height="110" rx="12" fill="#fff" stroke="${INK}" stroke-width="3"/>` +
			`<line x1="902" y1="368" x2="978" y2="368" stroke="${accent}" stroke-width="3.5"/>` +
			arrowHead(902, 368, -1, accent) + arrowHead(978, 368, 1, accent) +
			`<circle cx="818" cy="370" r="9" fill="${accent}"/>`;
	},
	// Parts converging on a whole (capstone, assembly).
	converge(accent, key, p = {}) {
		let s = '';
		for (let i = 0; i < 5; i++) {
			const y = 210 + i * 85;
			s += `<line x1="750" y1="${y}" x2="958" y2="380" stroke="${INK}" stroke-width="2.5" opacity="0.5"/>`;
			s += `<circle cx="750" cy="${y}" r="9" fill="#fff" stroke="${INK}" stroke-width="2.5"/>`;
		}
		if (p.ring) s += `<circle cx="985" cy="380" r="66" fill="none" stroke="${INK}" stroke-width="2" stroke-dasharray="8 7" opacity="0.5"/>`;
		return s + `<circle cx="985" cy="380" r="25" fill="${accent}" stroke="${INK}" stroke-width="3"/>`;
	},
	// One solid monolith on a baseline.
	singleBlock(accent) {
		return `<rect x="815" y="258" width="240" height="240" rx="18" fill="#fff" stroke="${INK}" stroke-width="3.5"/>` +
			`<rect x="815" y="528" width="240" height="14" rx="7" fill="${accent}"/>`;
	},
	// Validation gates with pass checks (security, testing).
	gates(accent) {
		let s = '';
		[810, 935, 1060].forEach((x, i) => {
			const last = i === 2;
			s += `<polygon points="${x},332 ${x + 46},380 ${x},428 ${x - 46},380" fill="#fff" stroke="${INK}" stroke-width="3"/>`;
			s += `<polyline points="${x - 16},380 ${x - 4},392 ${x + 18},366" fill="none" stroke="${last ? accent : INK}" stroke-width="4" opacity="${last ? 1 : 0.55}"/>`;
		});
		return s;
	},
	// Allocation ring (holdings).
	donut(accent) {
		const pol = (r, deg) => {
			const a = ((deg - 90) * Math.PI) / 180;
			return `${(935 + r * Math.cos(a)).toFixed(1)},${(380 + r * Math.sin(a)).toFixed(1)}`;
		};
		const arc = (a0, a1, color, w, op) =>
			`<path d="M ${pol(105, a0)} A 105 105 0 ${(a1 - a0) > 180 ? 1 : 0} 1 ${pol(105, a1)}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" opacity="${op}"/>`;
		return arc(-90, 30, INK, 32, 1) + arc(45, 150, INK, 32, 0.4) + arc(165, 255, accent, 32, 1);
	},
	// Source square deriving thin history lines (snapshots -> history).
	sourceDerive(accent) {
		return `<rect x="880" y="212" width="110" height="110" rx="12" fill="${accent}" stroke="${INK}" stroke-width="3"/>` +
			`<line x1="935" y1="322" x2="935" y2="368" stroke="${INK}" stroke-width="3"/>` +
			`<polygon points="935,388 926,370 944,370" fill="${INK}"/>` +
			[414, 446, 478].map((y) => `<line x1="855" y1="${y}" x2="1015" y2="${y}" stroke="${INK}" stroke-width="2.5" opacity="0.55"/>`).join('');
	},
	// Kept grid with rejects falling away (exclusion scan).
	filter(accent, key) {
		const rand = hashRand(key);
		let s = '';
		for (let r = 0; r < 3; r++) {
			for (let c = 0; c < 4; c++) {
				const hot = r === 0 && c === 0;
				s += `<rect x="${800 + c * 60}" y="${220 + r * 60}" width="44" height="44" rx="9" fill="${hot ? accent : 'none'}" stroke="${INK}" stroke-width="2.5"/>`;
			}
		}
		for (let i = 0; i < 4; i++) {
			const x = 810 + rand() * 190;
			const y = 440 + rand() * 90;
			s += `<line x1="${x.toFixed(1)}" y1="404" x2="${x.toFixed(1)}" y2="${(y - 14).toFixed(1)}" stroke="${INK}" stroke-width="2" opacity="0.3"/>`;
			s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="7" fill="none" stroke="${INK}" stroke-width="2" opacity="0.45"/>`;
		}
		return s;
	},
};

// Curated motif per page: [painter, params]. Chosen from the article's thesis.
const MODELS = {
	'inventory-80-projects': ['scatterGrid', {}],
	'production-fastapi': ['stack3', { accent: 1 }],
	'agent-skills-field-guide': ['clusters', {}],
	'networth-app--01-problem-and-architecture': ['fork', {}],
	'networth-app--02-implementation': ['twin', {}],
	'networth-app--03-api-and-persistence': ['sourceDerive', {}],
	'networth-app--04-client-tour': ['screens', {}],
	'networth-app--05-offline-and-sync': ['sync', {}],
	'networth-app--06-capstone': ['converge', {}],
	'data-eng-mastery--01-repo-and-method': ['pyramid', {}],
	'data-eng-mastery--02-learning-engine': ['loop', {}],
	'data-eng-mastery--03-api-and-data': ['pipeline', { n: 3 }],
	'data-eng-mastery--04-content-pipeline': ['pipeline', { n: 4, gate: true }],
	'data-eng-mastery--05-knowledge-capstone': ['converge', { ring: true }],
	'mutual-fund-360--01-method-and-monolith': ['singleBlock', {}],
	'mutual-fund-360--02-domain-core': ['concentric', {}],
	'mutual-fund-360--03-money-math': ['funnel', { dot: true }],
	'mutual-fund-360--04-ingestion': ['funnel', { lines: true }],
	'mutual-fund-360--05-api-security-testing': ['gates', {}],
	'networth-app': ['stepsTrend', {}],
	'data-eng-mastery': ['pipeline', { n: 5 }],
	'mutual-fund-360': ['donut', {}],
	'exclusion-first-scan': ['filter', {}],
	'seeded-monte-carlo': ['fanBand', {}],
};

function wrap(title, max = 22) {
	const words = title.split(/\s+/);
	const lines = [];
	let cur = '';
	for (const w of words) {
		if ((cur + ' ' + w).trim().length > max && cur) {
			lines.push(cur);
			cur = w;
		} else {
			cur = (cur + ' ' + w).trim();
		}
	}
	if (cur) lines.push(cur);
	return lines.slice(0, 4);
}

function trunc(s, n) {
	return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s;
}

function cover({ title, date, label, accent, motif, sections }) {
	const lines = wrap(title, 20).slice(0, 4);
	const titleSvg = lines
		.map((ln, i) => `<text x="80" y="${210 + i * 72}" font-family="Georgia, 'Times New Roman', serif" font-size="62" font-weight="700" fill="${INK}">${esc(ln)}</text>`)
		.join('\n    ');
	return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="720" viewBox="0 0 1200 720" role="img" aria-label="${esc(title)}">
  <rect width="1200" height="720" fill="${PAPER}"/>
  <g fill="${FAINT}">${Array.from({ length: 17 }, (_, r) => Array.from({ length: 30 }, (_, c) => `<circle cx="${20 + c * 40}" cy="${20 + r * 44}" r="1.6"/>`).join('')).join('')}</g>
  <line x1="710" y1="80" x2="710" y2="650" stroke="${FAINT}" stroke-width="2"/>
  <rect x="80" y="88" width="44" height="8" fill="${accent}"/>
  <text x="80" y="132" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="23" letter-spacing="4" fill="${GRAY}">ENGINEERING NOTEBOOK</text>
  <text x="1120" y="132" text-anchor="end" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="23" fill="${GRAY}">${label}</text>
    ${titleSvg}
  <text x="80" y="664" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="23" fill="${GRAY}">${date ? esc(date) + ' · ' : ''}${sections} sections</text>
  ${motif}
</svg>
`;
}

function frontmatter(path) {
	const raw = readFileSync(path, 'utf8').replace(/^﻿/, '');
	const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
	const fm = m ? m[1] : '';
	const body = m ? raw.slice(m[0].length) : raw;
	const get = (k) => (fm.match(new RegExp(`^${k}:\\s*"([^"]+)"`, 'm')) || [])[1] || '';
	const date = (fm.match(/^pubDate:\s*(\S+)/m) || [])[1] || (fm.match(/^updatedDate:\s*(\S+)/m) || [])[1] || '';
	return { title: get('title'), body, date };
}

function walk(dir, base = '') {
	const out = [];
	for (const name of readdirSync(dir)) {
		const rel = base ? `${base}/${name}` : name;
		if (statSync(join(dir, name)).isDirectory()) out.push(...walk(join(dir, name), rel));
		else if (name.endsWith('.md') || name.endsWith('.mdx')) out.push(rel);
	}
	return out;
}

// Handcrafted heroes the generator must never overwrite (see docs/heroes/).
const HANDMADE = new Set(['postgres-for-everything']);

for (const col of COLLECTIONS) {
	mkdirSync(col.out, { recursive: true });
	for (const rel of walk(col.dir)) {
		const key = col.key(rel);
		if (HANDMADE.has(key)) {
			console.log(`KEEP ${key} [handmade]`);
			continue;
		}
		const { title, body, date } = frontmatter(join(col.dir, ...rel.split('/')));
		if (!title) {
			console.log(`SKIP ${rel}: no title`);
			continue;
		}
		const { chapters } = summarize(body);
		const [painter, params] = MODELS[key] || ['concentric', {}];
		const motif = MOTIFS[painter](col.accent, key, params);
		writeFileSync(join(col.out, `${key}.svg`), cover({ title, date, label: col.label, accent: col.accent, motif, sections: chapters.length }));
		console.log(`OK ${key} [${painter}]`);
	}
}
