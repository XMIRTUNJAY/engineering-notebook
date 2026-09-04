// Base-aware URL helper for GitHub Pages project sites.
// import.meta.env.BASE_URL is '/' locally and '/engineering-notebook/' in build.
const base = import.meta.env.BASE_URL.replace(/\/$/, '');

export function siteUrl(path: string = '/'): string {
	if (!path.startsWith('/')) {
		path = '/' + path;
	}
	return `${base}${path}`;
}
