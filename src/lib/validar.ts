// Reglas de rigor (arquitectura §5) que un esquema no puede expresar solo.
// - Errores: la compilación falla siempre.
// - Avisos: datos sin verificar del todo. Se muestran al compilar y, con
//   PUBLICACION_ESTRICTA=1 (producción en Netlify), también hacen fallar la compilación.
// - Notas: situaciones aceptadas a propósito y visibles en la web. Solo se muestran.
import type { Datos, Propuesta } from './datos';

const ESTRICTA = process.env.PUBLICACION_ESTRICTA === '1';
let yaValidado = false;

export function validar(d: Datos, todas: Propuesta[]) {
  if (yaValidado) return;
  yaValidado = true;
  const errores: string[] = [];
  const avisos: string[] = [];
  const notas: string[] = [];
  const temas = new Map(d.temas.map((t) => [t.id, t]));

  // Fuentes
  for (const f of d.fuentes.values()) {
    const id = `fuentes/${f.id}`;
    if (!d.partidos.some((p) => p.id === f.data.partido.id)) errores.push(`${id}: el partido «${f.data.partido.id}» no existe`);
    if (f.data.tipo === 'prensa' && !f.data.medio) errores.push(`${id}: una fuente de prensa necesita «medio»`);
    if (!f.data.url) avisos.push(`${id}: falta el enlace (url)`);
    // No bloquea: a veces Internet Archive no consigue guardar una página. Hay que reintentarlo.
    else if (!f.data.urlArchivada) notas.push(`${id}: falta la copia archivada (urlArchivada)`);
    if (f.data.fechaConsulta < f.data.fechaPublicacion) errores.push(`${id}: fechaConsulta es anterior a fechaPublicacion`);
  }

  // Propuestas
  for (const p of todas) {
    const id = `propuestas/${p.id}`;
    const tema = temas.get(p.data.tema.id);
    if (!tema) errores.push(`${id}: el tema «${p.data.tema.id}» no existe`);
    else if (!tema.data.subtemas.some((s) => s.id === p.data.subtema))
      errores.push(`${id}: el subtema «${p.data.subtema}» no existe en «${tema.id}»`);
    if (!p.id.startsWith(`${p.data.partido.id}/`)) errores.push(`${id}: está en la carpeta de otro partido`);

    const fs = p.data.fuentes.map((r) => d.fuentes.get(r.fuente.id));
    fs.forEach((f, i) => {
      if (!f) errores.push(`${id}: la fuente «${p.data.fuentes[i].fuente.id}» no existe`);
      else if (f.data.partido.id !== p.data.partido.id) errores.push(`${id}: la fuente «${f.id}» es de otro partido`);
    });
    const validas = fs.filter((f) => f != null);
    if (p.data.destacada) {
      if (validas.every((f) => f.data.tipo === 'prensa'))
        // Aceptado: la web la marca «según la prensa» y quitarle la estrella desequilibraría las destacadas.
        notas.push(`${id}: destacada que solo consta en prensa (se muestra como «según la prensa»)`);
      if (validas.every((f) => f.data.tipo === 'programa-anterior'))
        errores.push(`${id}: una propuesta del programa anterior no puede ser destacada`);
      const partido = d.partidos.find((x) => x.id === p.data.partido.id);
      if (partido?.data.estadoPrograma === 'publicado' && !validas.some((f) => f.data.tipo === 'programa-29n'))
        errores.push(`${id}: con el programa publicado, una propuesta que no está en él no puede ser destacada`);
    }
    if (p.data.estado === 'sustituida' && !p.data.sustituidaPor) errores.push(`${id}: sustituida sin «sustituidaPor»`);
    if (!p.data.revisadaPor) avisos.push(`${id}: sin segunda revisión (revisadaPor)`);
    if (!!p.data.revisadaPor !== !!p.data.fechaRevision) errores.push(`${id}: revisadaPor y fechaRevision van siempre juntos`);
  }

  // Mismo número de destacadas por partido (±1)
  const n = d.partidos.map((p) => ({ id: p.id, n: d.propuestas.filter((x) => x.data.partido.id === p.id && x.data.destacada).length }));
  const min = Math.min(...n.map((x) => x.n));
  const max = Math.max(...n.map((x) => x.n));
  if (max - min > 1) errores.push(`Destacadas desequilibradas: ${n.map((x) => `${x.id} ${x.n}`).join(', ')} (máximo ±1)`);

  // Votaciones del Congreso
  for (const v of d.votaciones) {
    const id = `votaciones/${v.id}`;
    const pendiente = JSON.stringify(v.data).includes('PENDIENTE');
    if (pendiente) errores.push(`${id}: queda algo marcado PENDIENTE`);
    const tema = temas.get(v.data.tema.id);
    if (!tema) errores.push(`${id}: el tema «${v.data.tema.id}» no existe`);
    else if (!tema.data.subtemas.some((s) => s.id === v.data.subtema)) errores.push(`${id}: el subtema «${v.data.subtema}» no existe en «${tema.id}»`);
    for (const p of d.partidos) if (!v.data.partidos[p.id]) errores.push(`${id}: falta el voto de «${p.id}» (rehaz el archivo con npm run votacion)`);
    for (const x of v.data.propuestas) {
      const p = todas.find((y) => y.id === x.propuesta.id);
      if (!p) errores.push(`${id}: la propuesta «${x.propuesta.id}» no existe`);
      if (x.coincide === 'parcial' && !x.parte) errores.push(`${id}: «${x.propuesta.id}» coincide en parte; falta «parte» (qué parte estaba en el texto votado)`);
    }
    if (!v.data.revisadaPor) avisos.push(`${id}: sin segunda revisión (revisadaPor)`);
    if (!!v.data.revisadaPor !== !!v.data.fechaRevision) errores.push(`${id}: revisadaPor y fechaRevision van siempre juntos`);
  }
  for (const p of d.partidos) if (!d.representacion.has(p.id)) errores.push(`representacion: falta «${p.id}»`);

  // Referencias de los partidos
  for (const p of d.partidos) {
    const ref = p.data.referenciaAnterior?.fuente.id;
    if (ref && d.fuentes.get(ref)?.data.tipo !== 'programa-anterior')
      errores.push(`partidos/${p.id}: referenciaAnterior debe apuntar a una fuente de tipo programa-anterior`);
  }

  informar(errores, avisos, notas);
}

function informar(errores: string[], avisos: string[], notas: string[]) {
  const agrupar = (xs: string[]) => {
    // Resume los avisos repetidos para que la salida sea legible
    const porTipo = new Map<string, number>();
    for (const x of xs) {
      const k = x.replace(/^[^:]+: /, '');
      porTipo.set(k, (porTipo.get(k) ?? 0) + 1);
    }
    return [...porTipo].map(([k, v]) => `  · ${k}${v > 1 ? ` (×${v})` : ''}`).join('\n');
  };
  if (avisos.length) {
    console.warn(`\n⚠ ${avisos.length} avisos de verificación${ESTRICTA ? ' (modo estricto: cuentan como errores)' : ''}:\n${agrupar(avisos)}\n`);
    if (process.env.AVISOS_DETALLE === '1') console.warn(avisos.map((a) => `  - ${a}`).join('\n'));
  }
  if (notas.length) console.log(`\nℹ ${notas.length} notas (no bloquean):\n${agrupar(notas)}\n`);
  const fatales = ESTRICTA ? [...errores, ...avisos] : errores;
  if (fatales.length) {
    throw new Error(`\n✗ La validación del contenido ha fallado (${fatales.length}):\n${fatales.map((e) => `  - ${e}`).join('\n')}\n`);
  }
  console.log(`✓ Contenido validado (${errores.length} errores, ${avisos.length} avisos, ${notas.length} notas).`);
}
