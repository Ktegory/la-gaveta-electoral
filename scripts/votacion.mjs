// Crea el archivo de una votación del Pleno del Congreso a partir de los datos oficiales.
//
//   npm run votacion -- <enlace> --tema vivienda --subtema okupacion [--expediente 173/000076]
//
// <enlace>: el JSON, XML o PDF de la votación, tal como aparece en
// https://www.congreso.es/es/opendata/votaciones (cualquiera de los tres sirve).
//
// Lo que hace solo: lee la página de ese día para sacar el expediente y el tipo de
// votación, descarga el JSON con el voto de cada diputado y calcula el de cada partido
// según src/content/representacion.yaml.
// Lo que queda a mano (marcado PENDIENTE): el título, el resumen, el texto votado
// y las propuestas que contienen la misma medida. Se guarda como borrador (_nombre.yaml),
// que la web ignora; cuando esté completo, quita el «_» del nombre para publicarlo.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { parse, stringify } from 'yaml';

const RAIZ = new URL('../src/content/', import.meta.url).pathname;
const CONGRESO = 'https://www.congreso.es';
const args = process.argv.slice(2);
const opcion = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined; };
const enlace = args.find((a) => a.startsWith('http'));
const tema = opcion('tema');
const subtema = opcion('subtema');
const forzar = args.includes('--forzar');
// En las votaciones por puntos la página no siempre enlaza el expediente: se puede dar a mano.
const expedienteManual = opcion('expediente');

const salir = (m) => { console.error(`✗ ${m}`); process.exit(1); };
if (!enlace || !tema || !subtema) salir('Uso: npm run votacion -- <enlace JSON/XML/PDF> --tema <tema> --subtema <subtema> [--forzar]');

const temas = parse(readFileSync(`${RAIZ}temas.yaml`, 'utf8'));
const t = temas.find((x) => x.id === tema);
if (!t) salir(`No existe el tema «${tema}». Temas: ${temas.map((x) => x.id).join(', ')}`);
if (!t.subtemas.some((s) => s.id === subtema)) salir(`«${subtema}» no es un subtema de ${tema}: ${t.subtemas.map((s) => s.id).join(', ')}`);

// .../votaciones/Leg15/Sesion119/20250617/Votacion001/VOT_...
const m = enlace.match(/\/votaciones\/Leg(\d+)\/Sesion(\d+)\/(\d{8})\/Votacion(\d+)\//);
if (!m) salir('El enlace no parece una votación de congreso.es/webpublica/opendata/votaciones');
const [, leg, sesion, dia, numero] = m;
const carpeta = m[0];

const pedir = async (url) => {
  const r = await fetch(url, { headers: { 'User-Agent': 'gaveta-programas (script de votaciones)' } });
  if (!r.ok) salir(`${r.status} al pedir ${url}`);
  return r;
};

// 1. La página del día: expediente, sección (tipo) y enlaces PDF/JSON de esta votación.
const ROMANOS = { 14: 'XIV', 15: 'XV', 16: 'XVI' };
const fechaBarras = `${dia.slice(6)}/${dia.slice(4, 6)}/${dia.slice(0, 4)}`;
const pagina = await (await pedir(`${CONGRESO}/es/opendata/votaciones?p_p_id=votaciones&p_p_lifecycle=0&p_p_state=normal&p_p_mode=view&targetLegislatura=${ROMANOS[leg] ?? leg}&targetDate=${fechaBarras}`)).text();
const limpiar = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n)).replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const TOK = /<h4>([\s\S]*?)<\/h4>|<h5[^>]*>([\s\S]*?)<\/h5>|_iniciativas_id=([0-9/]+)|href="([^"]+\.(?:pdf|json))"/g;
let seccion, expediente, pdf, json;
{
  let sec, exp;
  for (const x of pagina.matchAll(TOK)) {
    if (x[1]) { sec = limpiar(x[1]); exp = undefined; }
    else if (x[2]) exp = undefined;
    else if (x[3]) exp = x[3];
    else if (x[4] && x[4].includes(carpeta)) {
      seccion = sec; expediente = exp;
      if (x[4].endsWith('.pdf')) pdf = CONGRESO + x[4]; else json = CONGRESO + x[4];
    }
  }
}
if (!json) salir(`No encuentro la votación ${numero} en la página del ${fechaBarras}.`);
if (expedienteManual) expediente = expedienteManual;

// 2. El voto de cada diputado.
const datos = await (await pedir(json)).json();
const info = datos.informacion;
const votos = datos.votaciones;
const VOTO = { 'Sí': 'si', No: 'no', 'Abstención': 'abstencion', 'No vota': 'noVota' };

const contar = (lista) => {
  const r = { si: 0, no: 0, abstencion: 0, noVota: 0 };
  for (const v of lista) {
    const k = VOTO[v.voto];
    if (!k) salir(`Voto desconocido «${v.voto}» de ${v.diputado}`);
    r[k]++;
  }
  // El voto del partido es el de la mayoría de sus diputados que votaron.
  // «Dividido» solo si ninguna opción pasa de la mitad. Las excepciones se ven en el recuento.
  const emitidos = r.si + r.no + r.abstencion;
  const [masVotada] = ['si', 'no', 'abstencion'].sort((a, b) => r[b] - r[a]);
  const voto = emitidos === 0 ? 'ausente' : r[masVotada] * 2 > emitidos ? masVotada : 'dividido';
  return { voto, ...r };
};

const representacion = parse(readFileSync(`${RAIZ}representacion.yaml`, 'utf8'));
const partidos = {};
for (const r of representacion) {
  const suyos = votos.filter((v) =>
    (r.diputados ?? []).includes(v.diputado) ||
    ((r.grupos ?? []).includes(v.grupo) && !(r.excluir ?? []).includes(v.diputado)),
  );
  if (!suyos.length) console.warn(`! Ningún diputado cuenta para «${r.id}» en esta votación. Revisa representacion.yaml.`);
  partidos[r.id] = contar(suyos);
}
const tot = contar(votos);
delete tot.voto;

// 3. Tipo de votación según la sección del orden del día.
const texto = info.textoExpediente ?? '';
const sub = [info.tituloSubGrupo, info.textoSubGrupo].filter(Boolean).join(' · ');
const tipo =
  /^Tramitación como Proyecto de Ley/i.test(texto) ? 'otra'
  : /toma en consideraci/i.test(seccion) ? 'toma-en-consideracion'
  : /convalidaci/i.test(seccion) ? 'convalidacion'
  : /moci[oó]n/i.test(seccion) ? 'mocion'
  : /no de ley/i.test(seccion) ? 'pnl'
  : /conjunto|final/i.test(sub) ? 'votacion-final'
  : /enmienda/i.test(seccion + sub) ? 'enmiendas'
  : 'otra';
// Votación final de una ley orgánica: hace falta mayoría absoluta (176).
const organica = tipo === 'votacion-final' && /org[aá]nica/i.test(texto);
const resultado = (organica ? tot.si >= 176 : tot.si > tot.no) ? 'aprobada' : 'rechazada';

// 4. El archivo.
const fecha = `${dia.slice(0, 4)}-${dia.slice(4, 6)}-${dia.slice(6)}`;
const punto = sub.match(/Punto ([\w.]+)/i)?.[1];
const id = `${fecha}-${expediente ? expediente.replace('/', '-') : `s${sesion}`}${punto ? `-p${punto.replace(/\./g, '')}` : !expediente ? `-v${Number(numero)}` : ''}`;
mkdirSync(`${RAIZ}votaciones`, { recursive: true });
const ruta = `${RAIZ}votaciones/_${id}.yaml`;
if ((existsSync(ruta) || existsSync(ruta.replace('/_', '/'))) && !forzar) salir(`Ya existe la votación ${id}. Usa --forzar para rehacer el borrador (perderás lo escrito a mano).`);

const doc = {
  fecha,
  sesion: Number(sesion),
  numero: Number(numero),
  ...(expediente && { expediente }),
  tipo,
  tituloOficial: texto,
  ...(sub && { subtituloOficial: sub }),
  titulo: 'PENDIENTE: qué se votaba, en una frase sin adjetivos (máx. 120)',
  resumen: 'PENDIENTE: qué contenía el texto votado y qué tipo de votación era',
  textoVotado: { nombre: 'PENDIENTE: BOCG / BOE…', url: 'https://www.congreso.es/', pagina: 'PENDIENTE' },
  urlVotacion: pdf ?? json,
  urlDatos: json,
  resultado,
  totales: tot,
  partidos,
  tema,
  subtema,
  propuestas: [],
};
writeFileSync(ruta, `# Votación del Pleno · ${seccion}\n# Generado por scripts/votacion.mjs. Rellena lo marcado PENDIENTE.\n${stringify(doc, { lineWidth: 0 })}`);
console.log(`✓ Borrador: ${ruta.replace(RAIZ, 'src/content/')} (quita el «_» cuando esté completo)`);
console.log(`  ${texto}`);
console.log(`  ${resultado.toUpperCase()} · ${tot.si} sí, ${tot.no} no, ${tot.abstencion} abst.`);
for (const [p, r] of Object.entries(partidos)) console.log(`  ${p.padEnd(5)} ${r.voto.padEnd(10)} (${r.si} sí · ${r.no} no · ${r.abstencion} abst. · ${r.noVota} no votan)`);
