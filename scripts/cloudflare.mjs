// Plan B de alojamiento: Cloudflare Pages (ver docs/plan-b-cloudflare.md).
// Netlify lee sus cabeceras y redirecciones de netlify.toml; Cloudflare Pages solo entiende
// los archivos _headers y _redirects dentro de dist/. Este script los escribe después del build,
// con las mismas reglas que netlify.toml. Si cambias unas, cambia también las otras.
// Solo se ejecuta en el build de Cloudflare (npm run cf-build), así que Netlify no los ve.
import { writeFileSync } from 'node:fs';

const headers = `# Generado por scripts/cloudflare.mjs (equivale a netlify.toml)
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: DENY

/_astro/*
  Cache-Control: public, max-age=31536000, immutable

/img/*
  Cache-Control: public, max-age=3600

# La copia en *.pages.dev no debe indexarse: la dirección canónica es lagavetaelectoral.org.
https://:project.pages.dev/*
  X-Robots-Tag: noindex
`;

const redirects = `# Generado por scripts/cloudflare.mjs (equivale a netlify.toml)
/historia /promesas-y-hechos/ 301
/historia/* /promesas-y-hechos/:splat 301
/apple-touch-icon-precomposed.png /apple-touch-icon.png 200
/favicon.png /apple-touch-icon.png 200
`;

writeFileSync('dist/_headers', headers);
writeFileSync('dist/_redirects', redirects);
console.log('✓ dist/_headers y dist/_redirects escritos para Cloudflare Pages.');
