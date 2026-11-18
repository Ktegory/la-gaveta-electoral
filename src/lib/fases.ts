// Fases de la web alrededor del 29N. La web es estática, así que la fase se decide en el navegador
// (hora de Madrid) con el script de <head> de Base.astro; al compilar solo se pone la de partida.
// Así el cambio a reflexión, votación y escrutinio no depende de publicar ese día.
//
// - campana: hasta el viernes 27 (la campaña acaba a las 24:00; RD 806/2026, art. 4).
// - reflexion: sábado 28. Sin campaña (LOREG, art. 53) y sin novedades aquí.
// - votacion: domingo 29, de 9:00 a 20:00 (LOREG, art. 84.1).
// - escrutinio: domingo 29 desde las 20:00. En Canarias cierran a las 20:00 de allí (21:00 en Madrid).
// - despues: desde el lunes 30.
// Aparte, la veda de encuestas: del 24 al 28 no se publican sondeos (LOREG, art. 69.7).
export const FASES = ['campana', 'reflexion', 'votacion', 'escrutinio', 'despues'] as const;
export type Fase = (typeof FASES)[number];

export const NOMBRE_FASE: Record<Fase, string> = {
  campana: 'Campaña (hasta el 27 nov)',
  reflexion: 'Jornada de reflexión (28 nov)',
  votacion: 'Jornada de votación (29 nov, hasta las 20:00)',
  escrutinio: 'Escrutinio (29 nov, desde las 20:00)',
  despues: 'Después de las elecciones (desde el 30 nov)',
};

// Momento que simula cada vista previa de /fases/ (solo en local), para que la cuenta atrás cuadre.
export const MOMENTO_PREVIA: Record<Fase, string> = {
  campana: '2026-11-20T12:00:00+01:00',
  reflexion: '2026-11-28T12:00:00+01:00',
  votacion: '2026-11-29T12:00:00+01:00',
  escrutinio: '2026-11-29T21:30:00+01:00',
  despues: '2026-11-30T12:00:00+01:00',
};

export const CALENDARIO = {
  vedaDesde: '2026-11-24',
  reflexion: '2026-11-28',
  votacion: '2026-11-29',
  cierre: '20:00',
};

// Sesiones constitutivas del Congreso y el Senado (RD 806/2026, art. 5).
export const CORTES = new Date('2026-12-23T10:00:00+01:00');

const LOREG = 'https://www.boe.es/buscar/act.php?id=BOE-A-1985-11672';
export const ENLACES = {
  // Consulta de mesa y local electoral del INE: sin identificarse; pide provincia, municipio e inicial del primer apellido.
  mesa: 'https://sede.ine.gob.es/tramite/consulta_mesas_locales/',
  telefonoCenso: '900 343 232',
  // Web oficial de la convocatoria (Ministerio del Interior). Comprobar el 29 que es donde salen los resultados.
  resultados: 'https://www.29neleccionesgenerales.es/',
  loreg53: `${LOREG}#acincuentaytres`,
  loreg69: `${LOREG}#asesentaynueve`,
  loreg84: `${LOREG}#aochentaycuatro`,
  loreg85: `${LOREG}#aochentaycinco`,
  loreg98: `${LOREG}#anoventayocho`,
  loreg166: `${LOREG}#acientosesentayseis`,
  ce99: 'https://www.boe.es/buscar/act.php?id=BOE-A-1978-31229#a99',
};

/** Fase de partida al compilar (luego la corrige el navegador). */
export function faseAl(fecha: Date): Fase {
  const [dia, hora] = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Madrid', dateStyle: 'short', timeStyle: 'short' }).format(fecha).split(' ');
  if (dia < CALENDARIO.reflexion) return 'campana';
  if (dia === CALENDARIO.reflexion) return 'reflexion';
  if (dia === CALENDARIO.votacion) return hora < CALENDARIO.cierre ? 'votacion' : 'escrutinio';
  return 'despues';
}

// Fase con la que se compila. Lo que no se ve en ella queda fuera del buscador interno (Pagefind),
// para que no salga «¡Hemos votado!» al buscar antes de tiempo.
export const FASE_COMPILADA = faseAl(new Date());
/** Atributos de un elemento que solo se ve en esas fases: `{...solo('reflexion votacion')}`. */
export const solo = (fases: string) => ({
  'data-fase-solo': fases,
  'data-pagefind-ignore': fases.split(' ').includes(FASE_COMPILADA) ? undefined : 'all',
});
