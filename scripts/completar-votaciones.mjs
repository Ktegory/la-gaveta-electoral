// Añade a las votaciones ya publicadas el voto de los partidos que aún no tienen
// (por ejemplo, al incorporar un partido nuevo a representacion.yaml).
// Recalcula solo esos partidos, con los datos oficiales (urlDatos) y la misma regla
// que scripts/votacion.mjs. No toca nada más del archivo.
//
//   node scripts/completar-votaciones.mjs
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { parse, parseDocument } from 'yaml';

const RAIZ = new URL('../src/content/', import.meta.url).pathname;
const VOTO = { 'Sí': 'si', No: 'no', 'Abstención': 'abstencion', 'No vota': 'noVota' };

const contar = (lista) => {
  const r = { si: 0, no: 0, abstencion: 0, noVota: 0 };
  for (const v of lista) {
    const k = VOTO[v.voto];
    if (!k) throw new Error(`Voto desconocido «${v.voto}» de ${v.diputado}`);
    r[k]++;
  }
  const emitidos = r.si + r.no + r.abstencion;
  const [masVotada] = ['si', 'no', 'abstencion'].sort((a, b) => r[b] - r[a]);
  const voto = emitidos === 0 ? 'ausente' : r[masVotada] * 2 > emitidos ? masVotada : 'dividido';
  return { voto, ...r };
};

const representacion = parse(readFileSync(`${RAIZ}representacion.yaml`, 'utf8'));
const dir = `${RAIZ}votaciones/`;
for (const f of readdirSync(dir).filter((x) => x.endsWith('.yaml'))) {
  const texto = readFileSync(dir + f, 'utf8');
  const doc = parseDocument(texto);
  const ya = doc.get('partidos').toJSON();
  const faltan = representacion.filter((r) => !ya[r.id]);
  if (!faltan.length) continue;
  // Las votaciones por llamamiento no tienen JSON: se completan a mano desde el Diario de Sesiones.
  if (!String(doc.get('urlDatos')).endsWith('.json')) { console.warn(`! ${f}: sin JSON (${faltan.map((p) => p.id).join(', ')}), complétalo a mano`); continue; }
  const r = await fetch(doc.get('urlDatos'), { headers: { 'User-Agent': 'gaveta-programas (script de votaciones)' } });
  if (!r.ok) { console.error(`✗ ${f}: ${r.status}`); continue; }
  const votos = (await r.json()).votaciones;
  const partidos = { ...ya };
  for (const p of faltan) {
    const suyos = votos.filter((v) =>
      (p.diputados ?? []).includes(v.diputado) ||
      ((p.grupos ?? []).includes(v.grupo) && !(p.excluir ?? []).includes(v.diputado)));
    if (!suyos.length) console.warn(`! ${f}: ningún diputado para «${p.id}»`);
    partidos[p.id] = contar(suyos);
  }
  // Mismo orden que el resto de archivos: alfabético por id.
  doc.set('partidos', doc.createNode(Object.fromEntries(Object.keys(partidos).sort().map((k) => [k, partidos[k]]))));
  writeFileSync(dir + f, doc.toString({ lineWidth: 0 }));
  console.log(`✓ ${f}: ${faltan.map((p) => `${p.id} ${partidos[p.id].voto} (${partidos[p.id].si}/${partidos[p.id].no}/${partidos[p.id].abstencion}/${partidos[p.id].noVota})`).join(' · ')}`);
}
