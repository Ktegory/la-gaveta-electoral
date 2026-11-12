// Esquemas del contenido (arquitectura §5). Si un archivo no cumple, la compilación falla.
import { defineCollection, reference } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

const fecha = z.coerce.date();

export const ESTADOS_PROGRAMA = ['publicado', 'avance', 'pendiente'] as const;
export const TIPOS_FUENTE = [
  'programa-29n',
  'avance-oficial',
  'documento-oficial',
  'anuncio-oficial',
  'prensa',
  'programa-anterior',
] as const;

const partidos = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/partidos' }),
  schema: z.object({
    nombre: z.string(),
    nombreCompleto: z.string().optional(),
    siglas: z.string().max(5),
    color: z.string().regex(/^#[0-9A-F]{6}$/i),
    colorTexto: z.enum(['blanco', 'tinta']), // decisión de diseño (nov 2026): blanco en todos, aunque en colores claros el contraste baje de 4,5:1
    colorOrigen: z.object({ fuente: z.string(), verificado: z.boolean() }),
    // url: dónde se obtuvo; archivo: copia local optimizada que usa la web (sin peticiones a terceros)
    logo: z.object({ url: z.url(), archivo: z.string().regex(/^\/img\/partidos\/[a-z0-9-]+\.(svg|webp)$/), origen: z.string() }).optional(),
    candidatura: z.string(),
    lema: z.string().optional(),
    web: z.url(),
    estadoPrograma: z.enum(ESTADOS_PROGRAMA),
    resumenEstado: z.string(), // frase corta: «Presenta su programa el mar 10 nov»
    explicacionEstado: z.string(), // admite <b>…</b>
    fechaProgramaPrevista: fecha.optional(),
    fechaProgramaPublicado: fecha.optional(),
    candidaturas: z.array(z.object({ territorio: z.string(), marca: z.string() })).default([]),
    // Quién forma el partido o la coalición (p. ej. los partidos de una coalición), con su fuente.
    composicion: z.object({ texto: z.string(), fuentes: z.array(reference('fuentes')).min(1) }).optional(),
    referenciaAnterior: z
      .object({ titulo: z.string(), detalle: z.string(), fuente: reference('fuentes') })
      .optional(),
    ultimaRevision: fecha,
  }),
});

const temas = defineCollection({
  loader: file('src/content/temas.yaml'),
  schema: z.object({
    nombre: z.string(),
    pregunta: z.string(),
    orden: z.number().int(),
    subtemas: z.array(z.object({ id: z.string(), nombre: z.string(), pregunta: z.string() })).min(1),
  }),
});

const fuentes = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/fuentes' }),
  schema: z.object({
    partido: reference('partidos'),
    titulo: z.string(),
    tipo: z.enum(TIPOS_FUENTE),
    medio: z.string().optional(), // obligatorio en la práctica para «prensa» (lo comprueba validar.ts)
    url: z.url().optional(), // si falta, la fuente queda «pendiente de enlace»
    urlArchivada: z.url().optional(),
    sha256: z.string().length(64).optional(),
    fechaPublicacion: fecha,
    fechaConsulta: fecha,
    paginas: z.number().int().positive().optional(),
    notas: z.string().optional(),
  }),
});

const propuestas = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/propuestas' }),
  schema: z.object({
    partido: reference('partidos'),
    tema: reference('temas'),
    subtema: z.string(),
    titulo: z.string().max(120),
    resumen: z.string().optional(),
    citaLiteral: z.string().optional(),
    fuentes: z
      // cita: el pasaje exacto de esa fuente que respalda la propuesta. Solo se enseña en /revisar/ (local), no en la web.
      .array(z.object({ fuente: reference('fuentes'), pagina: z.string().optional(), cita: z.string().optional() }))
      .min(1, 'Toda propuesta necesita al menos una fuente'),
    fechaAnuncio: fecha,
    destacada: z.boolean().default(false),
    orden: z.number().int().optional(), // orden dentro de las destacadas
    estado: z.enum(['vigente', 'sustituida']).default('vigente'),
    sustituidaPor: reference('propuestas').optional(),
    revisadaPor: z.string().optional(),
    fechaRevision: fecha.optional(),
    // Comprobación previa a la revisión: si el pasaje aparece en la fuente. Solo se ve en /revisar/.
    comprobacion: z
      .object({ estado: z.enum(['encontrada', 'parcial', 'no-encontrada']), nota: z.string().optional() })
      .optional(),
  }),
});

const ubicaciones = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/ubicaciones' }),
  schema: z.object({
    partido: reference('partidos'),
    origen: z.enum(['cis', 'ches', 'manifesto']),
    valor: z.number(),
    escala: z.enum(['0-10', '1-10']),
    intervalo: z.tuple([z.number(), z.number()]).optional(),
    fecha: fecha,
    n: z.number().int().optional(),
    url: z.url(),
    notas: z.string().optional(),
  }),
});

// ---------- Congreso ----------
// Quién cuenta como cada partido al calcular su voto (ver representacion.yaml).
const representacion = defineCollection({
  loader: file('src/content/representacion.yaml'),
  schema: z.object({
    nombreGrupo: z.string(),
    explicacion: z.string(),
    grupos: z.array(z.string()).default([]),
    diputados: z.array(z.string()).default([]),
    excluir: z.array(z.string()).default([]),
  }),
});

export const TIPOS_VOTACION = ['toma-en-consideracion', 'convalidacion', 'votacion-final', 'enmiendas', 'mocion', 'pnl', 'otra'] as const;
export const VOTOS = ['si', 'no', 'abstencion', 'dividido', 'ausente'] as const;
const recuento = z.object({ si: z.number().int(), no: z.number().int(), abstencion: z.number().int(), noVota: z.number().int() });

// Una votación del Pleno, con el voto de cada partido calculado de los datos oficiales
// (lo escribe `npm run votacion`) y las propuestas que contienen la MISMA medida.
const votaciones = defineCollection({
  // Los archivos que empiezan por «_» son borradores: la web los ignora hasta quitarles el «_».
  loader: glob({ pattern: '**/[!_]*.yaml', base: './src/content/votaciones' }),
  schema: z.object({
    fecha: fecha,
    sesion: z.number().int(),
    numero: z.number().int(),
    expediente: z.string().optional(),
    tipo: z.enum(TIPOS_VOTACION),
    tituloOficial: z.string(),
    subtituloOficial: z.string().optional(),
    // Escrito a mano, sin adjetivos: qué se votaba exactamente.
    titulo: z.string().max(120),
    resumen: z.string().min(1),
    // Si el texto mezclaba otras medidas (decretos «ómnibus»…), se dice aquí.
    incluiaAdemas: z.string().optional(),
    textoVotado: z.object({ url: z.url(), pagina: z.string().optional(), nombre: z.string() }),
    urlVotacion: z.url(), // detalle oficial (PDF) con el voto de cada diputado
    urlDatos: z.url(), // los mismos datos en JSON
    resultado: z.enum(['aprobada', 'rechazada']),
    totales: recuento,
    partidos: z.record(z.string(), recuento.extend({ voto: z.enum(VOTOS) })),
    tema: reference('temas'),
    subtema: z.string(),
    propuestas: z
      .array(z.object({ propuesta: reference('propuestas'), coincide: z.enum(['si', 'parcial']), pasaje: z.string(), parte: z.string().optional() }))
      .default([]),
    revisadaPor: z.string().optional(),
    fechaRevision: fecha.optional(),
  }),
});

const cambios = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/cambios' }),
  schema: z.object({
    fecha: fecha,
    partido: reference('partidos').optional(),
    tipo: z.enum(['fuente-nueva', 'estado-programa', 'propuestas', 'correccion', 'sitio']),
    descripcion: z.string(),
    // Propuestas a las que se refiere el cambio (se enlazan en /novedades/ y en el RSS).
    propuestas: z.array(reference('propuestas')).optional(),
  }),
});

export const collections = { partidos, temas, fuentes, propuestas, ubicaciones, cambios, representacion, votaciones };
