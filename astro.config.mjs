// @ts-check
import { defineConfig } from 'astro/config';
import revisionLocal from './src/revision/integracion.mjs';

export default defineConfig({
  // Dominio provisional en Netlify; se cambia aquí cuando haya dominio propio.
  site: 'https://lagavetaelectoral.netlify.app',
  trailingSlash: 'always',
  build: { format: 'directory' },
  // Sin la barra de herramientas de Astro en desarrollo
  devToolbar: { enabled: false },
  // Página /revisar/ para firmar la segunda revisión. Solo en local (npm run dev).
  integrations: [revisionLocal()],
});
