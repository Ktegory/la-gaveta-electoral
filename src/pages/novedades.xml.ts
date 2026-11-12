import type { APIRoute } from 'astro';
import { datos } from '../lib/datos';
import { TIPO_CAMBIO, propuestasDeCambio, urlPropuesta } from '../lib/novedades';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const GET: APIRoute = async ({ site }) => {
  const d = await datos();
  const base = site!;
  const nombre = (id?: string) => (id ? d.partidos.find((p) => p.id === id)?.data.nombre : undefined) ?? 'La Gaveta';
  const items = d.cambios.slice(0, 100).map((c) => {
    const ps = propuestasDeCambio(d, c);
    const html =
      `<p>${esc(c.data.descripcion)}</p>` +
      (ps.length ? `<ul>${ps.map((p) => `<li><a href="${new URL(urlPropuesta(p), base).href}">${esc(p.data.titulo)}</a></li>`).join('')}</ul>` : '');
    return `    <item>
      <title>${esc(`${nombre(c.data.partido?.id)} · ${TIPO_CAMBIO[c.data.tipo]}`)}</title>
      <link>${new URL(`/novedades/#${c.id}`, base).href}</link>
      <guid isPermaLink="false">${esc(c.id)}</guid>
      <pubDate>${c.data.fecha.toUTCString()}</pubDate>
      <description>${esc(html)}</description>
    </item>`;
  });
  const ultima = d.cambios[0]?.data.fecha ?? new Date();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>La Gaveta electoral · Novedades</title>
    <link>${new URL('/novedades/', base).href}</link>
    <atom:link href="${new URL('/novedades.xml', base).href}" rel="self" type="application/rss+xml" />
    <description>Propuestas nuevas, programas publicados y correcciones de los partidos para las elecciones generales del 29N, con su fuente.</description>
    <language>es-ES</language>
    <lastBuildDate>${ultima.toUTCString()}</lastBuildDate>
${items.join('\n')}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
