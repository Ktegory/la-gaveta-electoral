// Genera dist/sitemap.xml a partir de las páginas compiladas.
// Se salta las que llevan <meta name="robots" content="noindex">.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const SITIO = 'https://lagavetaelectoral.netlify.app'; // el mismo que `site` en astro.config.mjs
const DIST = 'dist';
const urls = [];
const recorrer = (dir) => {
  for (const n of readdirSync(dir)) {
    const ruta = join(dir, n);
    if (statSync(ruta).isDirectory()) { if (!['_astro', 'pagefind', 'img'].includes(n)) recorrer(ruta); continue; }
    if (n !== 'index.html') continue;
    if (/<meta name="robots" content="noindex"/.test(readFileSync(ruta, 'utf8'))) continue;
    const camino = relative(DIST, dir).split(sep).join('/');
    urls.push(`${SITIO}/${camino ? camino + '/' : ''}`);
  }
};
recorrer(DIST);
urls.sort();
writeFileSync(join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}\n</urlset>\n`);
console.log(`✓ sitemap.xml con ${urls.length} páginas`);
