// Revisión de propuestas desde el navegador. Solo existe con `npm run dev`:
// no se publica, no llega a Netlify y no añade nada a la web compilada.
//
// - Página /revisar/ con las propuestas, sus fuentes y un botón para firmar.
// - Punto /__revisar que escribe la firma (revisadaPor + fechaRevision) en el YAML.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';

const RAIZ = resolve('src/content/propuestas');
export const REVISOR = process.env.REVISOR || 'Khiustin Tornés';
const hoy = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Madrid' }).format(new Date());

export default function revisionLocal() {
  return {
    name: 'revision-local',
    hooks: {
      'astro:config:setup': ({ command, injectRoute, updateConfig }) => {
        if (command !== 'dev') return;
        injectRoute({ pattern: '/revisar', entrypoint: './src/revision/revisar.astro' });
        // Vista previa de la portada en cada fase del 29N (lib/fases.ts).
        injectRoute({ pattern: '/fases', entrypoint: './src/revision/fases.astro' });
        injectRoute({ pattern: '/fases/[fase]', entrypoint: './src/revision/fase.astro' });
        updateConfig({
          vite: {
            plugins: [{ name: 'revision-local', configureServer(s) { s.middlewares.use('/__revisar', firmar); sinRecargaTrasFirmar(s); } }],
          },
        });
      },
    },
  };
}

// Al escribir el YAML, Astro manda recargar la página entera, y el salto es incómodo.
// /revisar/ ya pinta la firma por su cuenta, así que esa recarga se omite durante unos segundos
// después de firmar. Si editas un archivo a mano, la recarga funciona como siempre.
let ultimaFirma = 0;
const ESPERA_MS = 4000;
function sinRecargaTrasFirmar(server) {
  const canales = new Set([server.ws, server.environments?.client?.hot].filter(Boolean));
  for (const canal of canales) {
    const enviar = canal.send.bind(canal);
    canal.send = (...args) => {
      if (args[0]?.type === 'full-reload' && Date.now() - ultimaFirma < ESPERA_MS) return;
      return enviar(...args);
    };
  }
}

/** POST /__revisar  { id: "pp/millon-viviendas", firmar: true|false } */
async function firmar(req, res) {
  const responder = (codigo, cuerpo) => {
    res.statusCode = codigo;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(cuerpo));
  };
  // Solo desde la propia página: otra web no puede escribir aquí aunque el servidor esté en marcha.
  if (req.method !== 'POST') return responder(405, { error: 'Solo POST' });
  if (req.headers.origin !== `http://${req.headers.host}`) return responder(403, { error: 'Origen no permitido' });
  if (!req.headers['content-type']?.startsWith('application/json')) return responder(415, { error: 'Se espera JSON' });

  let datos;
  try {
    let cuerpo = '';
    for await (const trozo of req) cuerpo += trozo;
    datos = JSON.parse(cuerpo);
  } catch {
    return responder(400, { error: 'JSON no válido' });
  }
  const { id, firmar: firma } = datos ?? {};
  if (typeof id !== 'string' || !/^[a-z0-9-]+\/[a-z0-9-]+$/.test(id)) return responder(400, { error: 'id no válido' });
  const ruta = resolve(RAIZ, `${id}.yaml`);
  if (!ruta.startsWith(RAIZ + sep)) return responder(400, { error: 'id no válido' });

  let texto;
  try {
    texto = readFileSync(ruta, 'utf8');
  } catch {
    return responder(404, { error: 'No existe esa propuesta' });
  }
  // Quita una firma anterior (si la hay) y, si se firma, añade la nueva al final.
  texto = texto.replace(/^(revisadaPor|fechaRevision):.*(\r?\n|$)/gm, '');
  const fecha = hoy();
  if (firma) {
    if (texto && !texto.endsWith('\n')) texto += '\n';
    texto += `revisadaPor: "${REVISOR}"\nfechaRevision: "${fecha}"\n`;
  }
  ultimaFirma = Date.now();
  writeFileSync(ruta, texto);
  responder(200, firma ? { revisadaPor: REVISOR, fechaRevision: fecha } : {});
}
