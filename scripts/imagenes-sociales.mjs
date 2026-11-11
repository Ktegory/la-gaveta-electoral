// Genera las imágenes para compartir y el icono de iOS con Chrome sin ventana:
//   public/og.png (1200×630, la que se ve al compartir un enlace)
//   public/apple-touch-icon.png (180×180)
// Uso: node scripts/imagenes-sociales.mjs   (rehacer cuando cambie el logo)
import { readFileSync, writeFileSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
if (!existsSync(CHROME)) { console.error(`No encuentro Chrome en ${CHROME} (usa CHROME=/ruta)`); process.exit(1); }
const nm = (p) => 'file://' + resolve('node_modules', p);
const fuentes = `
@font-face { font-family: Cond; src: url(${nm('@fontsource-variable/sofia-sans-extra-condensed/files/sofia-sans-extra-condensed-latin-wght-normal.woff2')}); font-weight: 1 1000 }
@font-face { font-family: Sans; src: url(${nm('@fontsource-variable/mona-sans/files/mona-sans-latin-wdth-normal.woff2')}); font-weight: 200 900; font-stretch: 75% 125% }
* { margin: 0; box-sizing: border-box } html, body { overflow: hidden }`;

// Logo definitivo (src/assets/logo.svg) e icono (src/assets/icono.svg), los dos en currentColor.
const SVG_LOGO = readFileSync('src/assets/logo.svg', 'utf8');
const logo = (alto) => `<div style="height:${alto}px;align-self:flex-start">${SVG_LOGO.replace('<svg ', `<svg height="${alto}" `)}</div>`;
const SVG_ICONO = readFileSync('src/assets/icono.svg', 'utf8'); // el del favicon

const og = `<!doctype html><meta charset="utf-8"><style>${fuentes}
body { width: 1200px; height: 630px; background: #FAF6E6; color: #0E0E0E; padding: 72px 80px; display: flex; flex-direction: column; justify-content: space-between }
p { font: 600 44px/1.2 Sans; max-width: 900px } small { display: block; margin-top: 18px; font: 500 26px/1.3 Sans; color: #3A3A38 }
.raya { position: absolute; left: 0; right: 0; bottom: 0; height: 14px; background: #0E0E0E }</style>
<body>${logo(130)}<div><p>Los programas del 29N, ordenados por temas y con la fuente al lado de cada propuesta.<small>Una iniciativa civil · Sin vinculación con ningún partido</small></p></div><div class="raya"></div></body>`;

const icono = `<!doctype html><meta charset="utf-8"><style>${fuentes} body { width: 180px; height: 180px; background: #0E0E0E; color: #fff; display: grid; place-items: center }</style>
<body>${SVG_ICONO.replace('<svg ', '<svg height="112" ')}</body>`;

const tmp = mkdtempSync(join(tmpdir(), 'gaveta-og-'));
const foto = (html, ancho, alto, salida) => {
  const f = join(tmp, 'p.html'); writeFileSync(f, html);
  execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1', '--allow-file-access-from-files',
    `--window-size=${ancho},${alto}`, '--virtual-time-budget=3000', `--screenshot=${resolve(salida)}`, 'file://' + f], { stdio: 'ignore' });
  console.log(`✓ ${salida}`);
};
try {
  foto(og, 1200, 630, 'public/og.png');
  foto(icono, 180, 180, 'public/apple-touch-icon.png');
} finally { rmSync(tmp, { recursive: true, force: true }); }
