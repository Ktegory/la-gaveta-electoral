// Segunda revisión de propuestas, desde la terminal.
// Más cómodo en el navegador: con `npm run dev`, abre http://localhost:4321/revisar/
//
//   npm run revisar            → va una a una por las propuestas sin revisar
//   npm run revisar -- --lista → solo las lista
//   npm run revisar -- pp      → solo las de un partido
//
// Por cada propuesta enseña lo que se publicará y sus fuentes. Si la firmas,
// añade al final de su archivo `revisadaPor` y `fechaRevision` (hoy).
// El nombre del revisor sale de la variable REVISOR (por defecto, el autor).
import { readFileSync, readdirSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { parse } from 'yaml';

const REVISOR = process.env.REVISOR || 'Khiustin Tornés';
const RAIZ = new URL('../src/content/', import.meta.url).pathname;
const args = process.argv.slice(2);
const soloLista = args.includes('--lista');
const partido = args.find((a) => !a.startsWith('--'));

const hoy = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Madrid' }).format(new Date());
const leer = (ruta) => parse(readFileSync(ruta, 'utf8'));
const b = (s) => `\x1b[1m${s}\x1b[0m`;
const gris = (s) => `\x1b[2m${s}\x1b[0m`;

const temas = new Map(leer(join(RAIZ, 'temas.yaml')).map((t) => [t.id, t]));

const pendientes = [];
for (const p of readdirSync(join(RAIZ, 'propuestas')).sort()) {
  if (partido && p !== partido) continue;
  const dir = join(RAIZ, 'propuestas', p);
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.yaml')).sort()) {
    const ruta = join(dir, f);
    const d = leer(ruta);
    if (!d.revisadaPor) pendientes.push({ id: `${p}/${f.replace(/\.yaml$/, '')}`, ruta, d });
  }
}

if (!pendientes.length) {
  console.log('✓ No queda ninguna propuesta sin revisar.');
  process.exit(0);
}

if (soloLista) {
  for (const x of pendientes) console.log(`${x.d.destacada ? '★' : ' '} ${x.id}  ${gris(x.d.titulo)}`);
  console.log(`\n${pendientes.length} sin revisar${partido ? ` en ${partido}` : ''}. ★ = destacada.`);
  process.exit(0);
}

const rl = createInterface({ input: process.stdin, output: process.stdout });
// Leer línea a línea (y no con rl.question) para no perder respuestas si llegan
// varias de golpe, por ejemplo al pegar o desde un script.
const lineas = rl[Symbol.asyncIterator]();
async function preguntar(texto) {
  process.stdout.write(texto);
  const { value, done } = await lineas.next();
  if (done) fin();
  return value;
}
let firmadas = 0;
console.log(`\n${pendientes.length} propuestas sin revisar. Firmarás como «${REVISOR}» con fecha ${hoy}.`);
console.log(gris('Comprueba título y resumen contra la fuente. Si algo está mal, sáltala y corrige el archivo.\n'));

for (const [i, x] of pendientes.entries()) {
  const { d } = x;
  const tema = temas.get(d.tema);
  const subtema = tema?.subtemas.find((s) => s.id === d.subtema);
  const fuentes = d.fuentes.map((r) => ({ ...leer(join(RAIZ, 'fuentes', `${r.fuente}.yaml`)), pagina: r.pagina }));

  console.log(`\n${gris(`── ${i + 1}/${pendientes.length} · ${x.id}`)}`);
  console.log(`${b(d.partido.toUpperCase())} · ${tema?.nombre ?? d.tema} › ${subtema?.nombre ?? d.subtema}${d.destacada ? ' · ★ destacada' : ''}`);
  console.log(b(d.titulo));
  if (d.resumen) console.log(d.resumen);
  if (d.citaLiteral) console.log(`«${d.citaLiteral}»`);
  console.log(gris(`Anunciada el ${d.fechaAnuncio}`));
  fuentes.forEach((f, n) => {
    console.log(`  [${n + 1}] ${f.tipo}${f.medio ? ` · ${f.medio}` : ''} · ${f.titulo}${f.pagina ? ` · p. ${f.pagina}` : ''}`);
    console.log(`      ${f.url ?? '(sin enlace todavía)'}`);
  });

  for (;;) {
    const r = (await preguntar('¿Firmas? [s]í · [n]o, saltar · [a]brir fuente · [q] salir: ')).trim().toLowerCase();
    if (r === 'a' || /^a?\d$/.test(r)) {
      const f = fuentes[(Number(r.replace('a', '')) || 1) - 1];
      if (f?.url) execFile('open', [f.url]);
      else console.log('Esa fuente no tiene enlace.');
      continue;
    }
    if (r === 's') {
      appendFileSync(x.ruta, `revisadaPor: "${REVISOR}"\nfechaRevision: "${hoy}"\n`);
      firmadas++;
      console.log('✓ Firmada.');
    }
    if (r === 'q') {
      rl.close();
      fin();
    }
    if (['s', 'n', ''].includes(r)) break;
  }
}
rl.close();
fin();

function fin() {
  console.log(`\nFirmadas en esta pasada: ${firmadas}. Quedan ${pendientes.length - firmadas} sin revisar.`);
  process.exit(0);
}
