// Para /revisar/ (solo en local): saca del historial de git la última vez que REVISOR firmó
// cada propuesta y qué ha cambiado desde entonces. Así se distingue una propuesta nueva
// de una que vuelve a revisión porque se tocó después de firmarla.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
// Campos que no cuentan como cambio de contenido: la firma y la nota de comprobación.
const IGNORAR = new Set(['revisadaPor', 'fechaRevision', 'comprobacion']);
const NOMBRE = {
  titulo: 'título', resumen: 'resumen', fuentes: 'fuentes', tema: 'tema', subtema: 'subtema',
  destacada: 'destacada', orden: 'orden', estado: 'estado', sustituidaPor: 'sustituida por',
  fechaAnuncio: 'fecha de anuncio', citaLiteral: 'cita',
};

/** Mapa ruta → { commit, fecha } de la última firma de `revisor` en cada archivo. */
function firmas(revisor) {
  const out = new Map();
  let log;
  try {
    log = git('log', '--format=@@%H %ad', '--date=short', '--no-renames', '-p', '-U0',
      `-G^revisadaPor: "${revisor}"`, '--', 'src/content/propuestas');
  } catch { return out; }
  let commit = '', fecha = '', ruta = '', firma = null;
  const cerrar = () => { if (firma && ruta && !out.has(ruta)) out.set(ruta, firma); firma = null; };
  for (const l of log.split('\n')) {
    if (l.startsWith('@@') && !l.startsWith('@@ ')) { cerrar(); [commit, fecha] = l.slice(2).split(' '); ruta = ''; continue; }
    if (l.startsWith('diff --git ')) { cerrar(); ruta = l.split(' b/')[1] ?? ''; continue; }
    if (l === `+revisadaPor: "${revisor}"`) firma = { commit, fecha };
    else if (firma && l.startsWith('+fechaRevision: ')) firma.fecha = l.slice(16).replace(/"/g, '');
  }
  cerrar();
  return out;
}

const fuentesTxt = (fs = []) => fs.map((f) => (typeof f === 'string' ? f : `${f.fuente}${f.pagina ? ` (p. ${f.pagina})` : ''}`));

/** Lista legible de lo que cambió entre la versión firmada y la actual. */
function diferencias(antes, ahora) {
  const cambios = [];
  const claves = new Set([...Object.keys(antes), ...Object.keys(ahora)]);
  for (const k of claves) {
    if (IGNORAR.has(k) || JSON.stringify(antes[k]) === JSON.stringify(ahora[k])) continue;
    const c = { campo: NOMBRE[k] ?? k };
    if (k === 'titulo' || k === 'resumen') c.antes = antes[k] ?? '(sin texto)';
    if (k === 'fuentes') {
      const a = fuentesTxt(antes.fuentes), b = fuentesTxt(ahora.fuentes);
      const mas = b.filter((x) => !a.includes(x)), menos = a.filter((x) => !b.includes(x));
      c.detalle = [mas.length && `añadida: ${mas.join(', ')}`, menos.length && `quitada: ${menos.join(', ')}`].filter(Boolean).join(' · ') || 'cambian las citas o el orden';
    }
    cambios.push(c);
  }
  return cambios;
}

/**
 * Para cada ruta pendiente que REVISOR ya había firmado: { fecha, cambios[] }.
 * `pendientes` son rutas relativas a la raíz del proyecto (p. ej. src/content/propuestas/fa/x.yaml).
 */
export function firmasPrevias(revisor, pendientes) {
  const todas = firmas(revisor);
  const res = new Map();
  for (const ruta of pendientes) {
    const f = todas.get(ruta);
    if (!f) continue;
    let cambios = [];
    try { cambios = diferencias(parse(git('show', `${f.commit}:${ruta}`)), parse(readFileSync(ruta, 'utf8'))); } catch {}
    res.set(ruta, { fecha: f.fecha, cambios });
  }
  return res;
}
