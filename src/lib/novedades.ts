import type { Cambio, Datos, Propuesta } from './datos';

export const TIPO_CAMBIO = {
  propuestas: 'Propuestas nuevas',
  correccion: 'Corrección',
  'fuente-nueva': 'Fuente nueva',
  'estado-programa': 'Programa',
  sitio: 'La web',
} as const;

/** Propuestas vigentes a las que se refiere un cambio, en el orden del archivo. */
export const propuestasDeCambio = (d: Datos, c: Cambio): Propuesta[] =>
  (c.data.propuestas ?? [])
    .map((r) => d.propuestas.find((p) => p.id === r.id))
    .filter((p): p is Propuesta => Boolean(p));

/** Enlace a una propuesta dentro de la ficha del partido, en su tema. */
export const urlPropuesta = (p: Propuesta) =>
  `/partidos/${p.data.partido.id}/${p.data.tema.id}/#${p.id.replace('/', '-')}`;
