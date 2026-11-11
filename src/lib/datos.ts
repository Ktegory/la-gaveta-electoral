// Acceso a los datos. Todas las páginas leen de aquí, así que las reglas de rigor
// (validar.ts) se ejecutan siempre antes de generar una sola página.
import { getCollection, type CollectionEntry } from 'astro:content';
import { validar } from './validar';

export type Partido = CollectionEntry<'partidos'>;
export type Tema = CollectionEntry<'temas'>;
export type Fuente = CollectionEntry<'fuentes'>;
export type Propuesta = CollectionEntry<'propuestas'>;
export type Cambio = CollectionEntry<'cambios'>;
export type Votacion = CollectionEntry<'votaciones'>;
export type Representacion = CollectionEntry<'representacion'>;

export interface Datos {
  partidos: Partido[]; // orden alfabético por nombre (neutralidad)
  temas: Tema[]; // por `orden`
  fuentes: Map<string, Fuente>;
  propuestas: Propuesta[]; // solo vigentes
  cambios: Cambio[]; // más reciente primero
  ubicaciones: CollectionEntry<'ubicaciones'>[];
  votaciones: Votacion[]; // más reciente primero
  representacion: Map<string, Representacion>; // por partido
}

let cache: Promise<Datos> | null = null;

export function datos(): Promise<Datos> {
  return (cache ??= cargar());
}

async function cargar(): Promise<Datos> {
  const [partidos, temas, fuentes, propuestas, cambios, ubicaciones, votaciones, representacion] = await Promise.all([
    getCollection('partidos'),
    getCollection('temas'),
    getCollection('fuentes'),
    getCollection('propuestas'),
    getCollection('cambios'),
    getCollection('ubicaciones'),
    getCollection('votaciones'),
    getCollection('representacion'),
  ]);
  const d: Datos = {
    partidos: partidos.sort((a, b) => a.data.nombre.localeCompare(b.data.nombre, 'es')),
    temas: temas.sort((a, b) => a.data.orden - b.data.orden),
    fuentes: new Map(fuentes.map((f) => [f.id, f])),
    propuestas: propuestas.filter((p) => p.data.estado === 'vigente'),
    cambios: cambios.sort((a, b) => +b.data.fecha - +a.data.fecha),
    ubicaciones,
    votaciones: votaciones.sort((a, b) => +b.data.fecha - +a.data.fecha),
    representacion: new Map(representacion.map((r) => [r.id, r])),
  };
  validar(d, propuestas);
  return d;
}

// ---------- consultas ----------

export const propuestasDe = (d: Datos, partido: string) =>
  d.propuestas.filter((p) => p.data.partido.id === partido);

export const destacadasDe = (d: Datos, partido: string) =>
  propuestasDe(d, partido)
    .filter((p) => p.data.destacada)
    .sort((a, b) => (a.data.orden ?? 99) - (b.data.orden ?? 99));

export const fuentesDe = (d: Datos, partido: string) =>
  [...d.fuentes.values()]
    .filter((f) => f.data.partido.id === partido && f.data.tipo !== 'programa-anterior')
    .sort((a, b) => +b.data.fechaPublicacion - +a.data.fechaPublicacion);

export const fuentesDePropuesta = (d: Datos, p: Propuesta) =>
  p.data.fuentes.map((r) => ({ fuente: d.fuentes.get(r.fuente.id)!, pagina: r.pagina, cita: r.cita }));

/** La fuente «más fuerte» de una propuesta decide su etiqueta principal. */
const RANGO = ['programa-29n', 'avance-oficial', 'documento-oficial', 'anuncio-oficial', 'prensa', 'programa-anterior'];
export const fuentePrincipal = (d: Datos, p: Propuesta) =>
  fuentesDePropuesta(d, p).sort((a, b) => RANGO.indexOf(a.fuente.data.tipo) - RANGO.indexOf(b.fuente.data.tipo))[0];

/**
 * Con el programa publicado, la relación de cada propuesta con él:
 * - «en-programa»: está en el programa.
 * - «fuera»: la anunció antes, pero no la incluyó en el programa.
 * - «posterior»: la anunció después de publicar el programa (anuncio de campaña).
 * `undefined` si el partido aún no ha publicado su programa.
 */
export type RelacionPrograma = 'en-programa' | 'fuera' | 'posterior';
export function relacionPrograma(d: Datos, p: Propuesta): RelacionPrograma | undefined {
  const partido = d.partidos.find((x) => x.id === p.data.partido.id);
  if (partido?.data.estadoPrograma !== 'publicado') return undefined;
  const fs = fuentesDePropuesta(d, p);
  if (fs.some((x) => x.fuente.data.tipo === 'programa-29n')) return 'en-programa';
  const programa = [...d.fuentes.values()].find((f) => f.data.partido.id === partido.id && f.data.tipo === 'programa-29n');
  const desde = partido.data.fechaProgramaPublicado ?? programa?.data.fechaPublicacion;
  return desde && p.data.fechaAnuncio > desde ? 'posterior' : 'fuera';
}

/**
 * Fuentes que se enseñan junto a la propuesta, la principal primero.
 * Si está en el programa publicado, solo el programa: las anteriores siguen en «Fuentes» y en el historial.
 */
export const fuentesVisibles = (d: Datos, p: Propuesta) => {
  const todas = fuentesDePropuesta(d, p).sort((a, b) => RANGO.indexOf(a.fuente.data.tipo) - RANGO.indexOf(b.fuente.data.tipo));
  return relacionPrograma(d, p) === 'en-programa' ? todas.filter((x) => x.fuente.data.tipo === 'programa-29n') : todas;
};

export const AVISO_PROGRAMA: Record<Exclude<RelacionPrograma, 'en-programa'>, string> = {
  fuera: 'No está en su programa',
  posterior: 'Anuncio de campaña · No está en su programa',
};

/** Recuento real de propuestas por tema y partido, para el mapa. */
export function recuento(d: Datos) {
  const m = new Map<string, Map<string, number>>();
  for (const t of d.temas) m.set(t.id, new Map(d.partidos.map((p) => [p.id, 0])));
  for (const p of d.propuestas) {
    const fila = m.get(p.data.tema.id)!;
    fila.set(p.data.partido.id, (fila.get(p.data.partido.id) ?? 0) + 1);
  }
  return m;
}

export const propuestasDeTema = (d: Datos, tema: string) => d.propuestas.filter((p) => p.data.tema.id === tema);

/** Votaciones del Congreso sobre un subtema. */
export const votacionesDe = (d: Datos, tema: string, subtema: string) =>
  d.votaciones.filter((v) => v.data.tema.id === tema && v.data.subtema === subtema);

/** Votaciones cuyo texto contenía la misma medida que esta propuesta. */
export const votacionesDePropuesta = (d: Datos, p: Propuesta) =>
  d.votaciones.flatMap((v) => v.data.propuestas.filter((x) => x.propuesta.id === p.id).map((x) => ({ votacion: v, ...x })));

/**
 * Diputados de un partido en el Congreso saliente: los que cuentan para él en la última
 * votación del Pleno, con las reglas de representacion.yaml. Sin dato, undefined.
 */
export const diputadosActuales = (d: Datos, partido: string) => {
  const v = d.votaciones[0];
  const r = v?.data.partidos[partido];
  return r ? { n: r.si + r.no + r.abstencion + r.noVota, fecha: v.data.fecha } : undefined;
};

// ---------- presentación ----------

export const ESTADO = {
  publicado: { etiqueta: 'Programa publicado', corto: 'Con programa', clase: 'pub' },
  avance: { etiqueta: 'Avance publicado', corto: 'Solo un avance', clase: 'ava' },
  pendiente: { etiqueta: 'Programa sin publicar', corto: 'Sin programa', clase: 'pen' },
} as const;

/** Cómo se anuncia el estado del programa en tarjetas y marquesina (con IconoEstado). */
export const TITULAR_ESTADO = {
  publicado: 'Ya tiene programa',
  avance: 'Solo un avance',
  pendiente: 'Aún sin programa',
} as const;
/** Detalle bajo el titular: fecha y páginas del programa si lo tiene; si no, su frase de estado. */
export function detalleEstado(d: Datos, p: Partido) {
  const prog = p.data.estadoPrograma === 'publicado'
    ? [...d.fuentes.values()].find((f) => f.data.partido.id === p.id && f.data.tipo === 'programa-29n')
    : undefined;
  if (!prog) return p.data.resumenEstado;
  return `${fecha(prog.data.fechaPublicacion)}${prog.data.paginas ? ` · ${prog.data.paginas} págs.` : ''}`;
}

export const TIPO = {
  'programa-29n': { etiqueta: 'Programa 29N', clase: 'p29' },
  'avance-oficial': { etiqueta: 'Avance oficial', clase: 'av' },
  'documento-oficial': { etiqueta: 'Documento del partido', clase: 'doc' },
  'anuncio-oficial': { etiqueta: 'Anuncio oficial', clase: 'an' },
  prensa: { etiqueta: 'Según la prensa', clase: 'pr' },
  'programa-anterior': { etiqueta: 'Programa anterior', clase: 'p23' },
} as const;

export const TIPO_VOTACION = {
  'toma-en-consideracion': 'Toma en consideración',
  convalidacion: 'Convalidación de decreto',
  'votacion-final': 'Votación final',
  enmiendas: 'Enmiendas',
  mocion: 'Moción',
  pnl: 'Proposición no de ley',
  otra: 'Votación',
} as const;

/** Qué significa cada tipo, para quien no conoce el Congreso. */
export const EXPLICA_VOTACION = {
  'toma-en-consideracion': 'Se vota si se empieza a tramitar una ley propuesta por un grupo. Aún no es la ley final.',
  convalidacion: 'El Gobierno aprueba un decreto-ley y el Congreso vota si sigue en vigor o se deroga.',
  'votacion-final': 'Votación del texto definitivo de la ley.',
  enmiendas: 'Se votan cambios a un texto en tramitación.',
  mocion: 'Pide al Gobierno que haga algo. No obliga.',
  pnl: 'Pide al Gobierno que haga algo. No obliga.',
  otra: '',
} as const;

export const VOTO = {
  si: { corto: 'Sí', largo: 'Votó sí' },
  no: { corto: 'No', largo: 'Votó no' },
  abstencion: { corto: 'Abst.', largo: 'Se abstuvo' },
  dividido: { corto: 'Dividido', largo: 'Votó dividido' },
  ausente: { corto: 'No votó', largo: 'No votó' },
} as const;

/** Variables CSS de color de un partido, para `style`. */
export const varsPartido = (p: Partido) =>
  `--pc:${p.data.color};--pt:${p.data.colorTexto === 'blanco' ? '#fff' : 'var(--ink)'}`;

const fmt = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', timeZone: 'Europe/Madrid' });
const fmtLargo = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Madrid' });
export const fecha = (f: Date) => fmt.format(f).replace('.', '');
export const fechaLarga = (f: Date) => fmtLargo.format(f);
export const iso = (f: Date) => f.toISOString().slice(0, 10);

export const ELECCIONES = new Date('2026-11-29T09:00:00+01:00');
