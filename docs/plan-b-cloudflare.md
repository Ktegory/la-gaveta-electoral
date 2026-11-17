# Plan B: servir la web desde Cloudflare Pages

Para el caso en que se acaben los créditos de Netlify. Si se agotan, Netlify **pausa todos los proyectos de la cuenta**: los visitantes ven «Site not available», no llegan los avisos del formulario y no se puede publicar. Cloudflare Pages es gratis para webs estáticas y no cobra por tráfico ni por peticiones.

## Antes de nada: lo más sencillo

En Netlify, el plan Personal permite comprar créditos sin cambiar de alojamiento:

- **Recarga automática** (*auto recharge*): añade 500 créditos por 5 $ cuando hacen falta. Viene desactivada; la activa la persona propietaria del equipo en la facturación. Vale para todos los proyectos del equipo.
- **Paquete suelto**: 500 créditos por 5 $, sin caducidad.

Con las cifras de la web (unos 10-12 créditos por cada 1.000 visitantes que ven tres páginas), 500 créditos dan para unos 40.000 visitantes más. Hay quejas en el foro de Netlify de proyectos que siguieron pausados después de comprar créditos, así que mejor activar la recarga **antes** de llegar a cero que después.

El plan B sirve si eso falla o si el tráfico se dispara.

## Qué está ya preparado en el repositorio

- `npm run cf-build`: el build para Cloudflare. Hace lo mismo que el de Netlify (bloqueo de la jornada de reflexión, validación, sitemap, Pagefind) y después ejecuta `scripts/cloudflare.mjs`.
- `scripts/cloudflare.mjs`: escribe `dist/_headers` y `dist/_redirects` con las mismas reglas que `netlify.toml`. **Si cambias unas, cambia también las otras.** Además, marca la copia de `*.pages.dev` como `noindex`.
- Formulario de errores: usa Netlify Forms, que no existe en Cloudflare. Cuando el build corre en Cloudflare (`CF_PAGES=1`), en su lugar sale «El formulario no está disponible en este momento». *Pendiente de decidir:* si se quiere ofrecer otra vía de contacto ahí.
- Analítica (Umami): sigue funcionando en lagavetaelectoral.org. En la dirección `*.pages.dev` no cuenta visitas, porque el script solo cuenta en ese dominio.

## Paso 1. Crear el proyecto en Cloudflare Pages (se puede hacer ya, no toca la web actual)

1. Entra en dash.cloudflare.com (si no tienes cuenta, créala; el plan gratuito basta).
2. **Workers & Pages → Create → Pages → Connect to Git.** Autoriza a Cloudflare en GitHub **solo para el repositorio** `Ktegory/la-gaveta-electoral`.
3. Configuración del build:
   - Production branch: `main`
   - Framework preset: *None*
   - Build command: `npm run cf-build`
   - Build output directory: `dist`
4. Variables de entorno (Production):
   - `NODE_VERSION` = `22.23.4`
   - `PUBLICACION_ESTRICTA` = `1`
5. Guarda y deja que haga el primer build. La web quedará en `https://<nombre-del-proyecto>.pages.dev`.

A partir de ahí, cada push a `main` publica en Netlify y en Cloudflare a la vez. En Cloudflare no cuesta nada (500 builds al mes en el plan gratuito).

**Importante:** el primer build de Cloudflare necesita que `scripts/cloudflare.mjs` y el script `cf-build` estén ya en `main`, así que hay que subirlos antes (pueden ir con la siguiente tanda).

## Paso 2. El dominio: dónde está el problema

Hoy el DNS de lagavetaelectoral.org está en **Netlify DNS** (servidores `dns1…4.p01.nsone.net`) y el dominio está registrado en **Name.com**.

Cloudflare Pages solo acepta el dominio raíz (`lagavetaelectoral.org`, sin `www`) si el dominio es una **zona de Cloudflare**, es decir, si sus servidores DNS son los de Cloudflare. No basta con cambiar un registro.

Por eso hay dos formas de hacerlo:

### A. Mover el DNS a Cloudflare con antelación (recomendada si el plan B va en serio)

Se hace una vez, con calma, y la web sigue en Netlify mientras tanto:

1. En Cloudflare: **Add a domain** → `lagavetaelectoral.org` → plan Free. Cloudflare copia los registros que encuentra.
2. Comprueba que los registros copiados apuntan a Netlify como ahora (el dominio raíz y `www`) y ponlos en **DNS only** (nube gris), para que Netlify siga sirviendo la web y renovando su certificado.
3. En Name.com: si DNSSEC está activo, desactívalo primero. Después cambia los servidores de nombres a los dos que te da Cloudflare.
4. Espera a que Cloudflare marque la zona como activa (de minutos a 24 h). Durante el cambio la web sigue en Netlify.
5. En Netlify: el dominio sigue configurado igual; solo deja de usarse Netlify DNS.

Con eso hecho, el cambio de alojamiento es inmediato: en el proyecto de Pages → **Custom domains → Set up a domain** → `lagavetaelectoral.org` (y `www`). Cloudflare cambia los registros por ti. El certificado tarda unos minutos.

Para volver a Netlify: quitar el dominio del proyecto de Pages y restaurar los registros que apuntaban a Netlify.

### B. Hacerlo todo solo si llega el momento

Los mismos pasos, pero con la web ya caída mientras se propaga el cambio de servidores de nombres (hasta 24 h). Solo como último recurso.

## Qué no se pierde y qué sí

- Se mantiene: todas las páginas, el buscador, el simulador, las cabeceras de seguridad y caché, las redirecciones y el sitemap.
- Se pierde mientras dure: el formulario de errores (ver arriba) y las *deploy previews* de Netlify.

## Fuentes

- Netlify: [How credits work](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/how-credits-work/), [Configure credit auto recharge](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/configure-auto-recharge/), [Buy credit packs](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/buy-add-on-credits/), [Resume paused projects](https://docs.netlify.com/manage/accounts-and-billing/billing/resume-paused-projects/).
- Cloudflare: [Pages custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/), [Change your nameservers (Full setup)](https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/).

Consultado el 16 nov 2026.
