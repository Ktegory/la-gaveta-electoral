// Tipos y criterios de «Promesas y hechos».
// Cada promesa: cita literal del programa con su página del PDF, qué pasó y la norma del BOE que lo prueba.

export const ESTADOS = {
  hecho: { corto: 'Se aprobó', explica: 'una norma en vigor hace lo que se prometía.' },
  parte: { corto: 'Se aprobó una parte', explica: 'una norma hace una parte concreta; decimos cuál falta.' },
  revertido: { corto: 'Se aprobó y se deshizo', explica: 'se aprobó y el mismo Gobierno lo retiró en esa legislatura.' },
  no: { corto: 'No se aprobó', explica: 'no hubo ninguna norma en esa legislatura.' },
  'sin-concreto': { corto: 'Nada concreto que comprobar', explica: 'la promesa no fija una medida, una cifra ni un plazo.' },
} as const;
export type Estado = keyof typeof ESTADOS;

export interface Norma { nombre: string; url: string; cita?: string; donde?: string }
export interface Votacion {
  que: string; // «Votación final en el Congreso, 23 may 2013»
  resultado: string; // «Aprobada, 180–150»
  url: string;
  grupos: { grupo: string; voto: 'si' | 'no' | 'abstencion' | 'dividido' }[];
}
export interface Promesa {
  id: string;
  subtema?: string; // id de un subtema del tema en temas.yaml; sin él va a «Otras promesas»
  titulo: string; // infinitivo, sin adjetivos
  cita: string;
  pagina: string;
  estado: Estado;
  quePaso: string;
  normas: Norma[];
  votacion?: Votacion;
  nota?: string;
}
export interface Bloque {
  partido: 'pp' | 'psoe';
  legislatura: string;
  periodo: string;
  contexto: string;
  programa: { titulo: string; url: string; nota?: string };
  promesas: Promesa[];
}

export const PP11 = 'https://www.pp.es/storage/2013/11/5742-20111031195458.pdf';
export const PSOE19 = 'https://www.psib-psoe.org/wp-content/uploads/Programa-PSOE-10N.pdf';
export interface Tema {
  id: string; // ruta: /historia/<id>
  nombre: string;
  lead: string;
  bloques: Bloque[];
}

/** Datos comunes de cada legislatura: el programa cambia de nota según el tema. */
export const LEG_PP = {
  partido: 'pp',
  legislatura: 'X legislatura',
  periodo: 'dic 2011 – oct 2015',
  contexto: 'Gobierno de Mariano Rajoy con mayoría absoluta del PP: 186 de 350 escaños.',
} as const;
export const LEG_PSOE = {
  partido: 'psoe',
  legislatura: 'XIV legislatura',
  periodo: 'dic 2019 – may 2023',
  contexto: 'Gobierno de coalición de Pedro Sánchez (PSOE y Unidas Podemos), en minoría: 155 de 350 escaños, con apoyos de otros grupos en cada votación.',
} as const;
