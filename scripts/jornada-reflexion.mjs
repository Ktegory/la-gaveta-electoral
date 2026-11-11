// Bloquea la publicación durante la jornada de reflexión (28 nov) y el día de la votación (29 nov).
// Excepción documentada, solo para corregir errores: FORZAR_PUBLICACION=correccion
const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(new Date());
const bloqueados = ['2026-11-28', '2026-11-29'];
if (bloqueados.includes(hoy) && process.env.FORZAR_PUBLICACION !== 'correccion') {
  console.error(`\n⛔ ${hoy}: jornada de reflexión o de votación. No se publica contenido nuevo.\n   Solo para corregir un error: FORZAR_PUBLICACION=correccion\n`);
  process.exit(1);
}
console.log(`✓ ${hoy}: publicación permitida.`);
