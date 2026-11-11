# Decisión técnica · La gaveta de los programas

*9 de noviembre de 2026. Complementa el §9 de [arquitectura.md](arquitectura.md).*

## Qué necesita el proyecto

- **Plazo muy corto.** Hoy es 9 de noviembre. Los programas llegarán entre el 10 y el 15, y las elecciones son el 29. El 28 no se publica nada.
- **Contenido muy estructurado y relacionado.** Cada propuesta depende de un partido, un tema y una o varias fuentes, y aparece en 4 o 5 sitios a la vez: inicio, mapa, ficha, comparador y página de tema.
- **Rigor comprobable.** Las reglas del §5 (toda propuesta tiene fuente, mismo número de destacadas, etc.) deben bloquear la publicación si no se cumplen.
- **Transparencia.** Un historial público de cambios.
- **Al principio, un solo editor** con perfil técnico. Más adelante quizá colaboradores sin ese perfil.
- **Picos de tráfico** en debates y en la semana de la votación.
- **Seguridad.** Una web política en campaña es un objetivo para ataques y desfiguraciones.
- **Coste personal**, con poco mantenimiento.

## Opciones

| | Validación de datos | Velocidad para llegar al 15 nov | Edición | Historial público | Seguridad y picos | Coste y mantenimiento |
|---|---|---|---|---|---|---|
| **A. HTML a mano, sin framework** | ✗ Ninguna. Cada dato se repite en varias páginas | ✓ Al principio; ✗ después | Editar HTML | Solo si va en git | ✓✓ Estático | ✓ |
| **B. CMS clásico en local (Drupal o WordPress) + exportación estática** (Tome, Simply Static) | ~ Con módulos a medida | ✗ Montaje y exportación | ✓✓ Panel completo | ✗ Los datos viven en una base de datos | ✓ Estático | ~ Dos sistemas que mantener |
| **C. CMS clásico en servidor** | ~ | ~ | ✓✓ | ✗ | ✗ Ataques, actualizaciones, caídas en picos | ✗ |
| **D. App dinámica** (Next.js o SvelteKit con base de datos) | ✓ | ✗ | Hay que construirla | ✗ | ~ Requiere infraestructura | ✗ |
| **E. Generador estático con el contenido en git** (Astro, Eleventy, Hugo) | ✓✓ Esquemas y reglas al compilar | ✓✓ | Archivos YAML | ✓✓ git *es* el historial | ✓✓ CDN, sin servidor | ✓✓ Gratis |
| **F. E + panel de edición sobre git** (Keystatic, Decap, Tina) | ✓✓ | ✓ | ✓ Formularios | ✓✓ | ✓✓ | ✓✓ |

## Decisión: opción E, con la puerta abierta a F

**Astro 7 + TypeScript, con el contenido en YAML versionado en git, validado al compilar y publicado como web 100 % estática.** El panel **Keystatic, en modo local**, se añade como capa de edición cuando haga falta. Escribe los mismos archivos YAML, así que no hay paso de exportación ni servidor en producción.

### Por qué no un CMS en local con exportación estática

Es lo que más se parece a «CMS en local y exportar estático», y con Drupal tienes experiencia. Pero aquí sale peor:

- **Paso frágil.** La exportación (Tome o Simply Static) es un paso más que puede fallar justo en la noche en que se publica un programa.
- **Validación cara.** Las reglas de rigor hay que programarlas como módulos o *hooks*. En Astro son un esquema de 20 líneas que bloquea la compilación.
- **Historial no público.** Los datos viven en una base de datos, no en archivos, así que no hay diff ni historial público sin trabajo extra.
- **Lo que aporta llega tarde.** Su ventaja, un panel de edición con roles, solo compensa con varios editores. Keystatic da formularios con relaciones (propuesta → fuente → partido) sobre los mismos archivos de git.

### Por qué no todo estático a mano

El mismo dato (por ejemplo, «PP · pendiente · 5 fuentes») aparece en la marquesina, en las columnas, en el mapa, en la ficha y en el comparador. Copiarlo a mano en cinco sitios es justo el tipo de error que destruye la credibilidad de un proyecto así. Con un generador se escribe una vez y se valida.

### Por qué Astro y no Eleventy o Hugo

- **Esquemas tipados de serie.** Las colecciones de contenido se validan con Zod y la compilación falla si un dato no cumple. En Eleventy habría que montarlo a mano, y Hugo no tiene esquemas.
- **Componentes.** El diseño tiene muchas piezas repetidas (etiqueta de estado, de fuente, columna de partido, casilla del mapa) y Astro trabaja con componentes.
- **Cero JavaScript por defecto.** Solo se carga en las partes interactivas.
- **Encaja con lo demás.** Tiene integración oficial con Keystatic y funciona con Pagefind.

### Interactividad, sin framework de interfaz

Las páginas públicas no usan React ni similares: componentes de Astro y TypeScript ligero solo donde hace falta.

| Pieza | Cómo |
|---|---|
| Comparador | Una página estática por tema (`/comparar/vivienda/`) con los cinco partidos ya renderizados. El JS solo muestra u oculta partidos y guarda la selección en la URL (`?partidos=pp,psoe`) para compartirla |
| Escala | SVG generado al compilar, a partir de datos de CIS y CHES |
| Buscador | Pagefind: índice generado al compilar, búsqueda en el navegador |
| Marquesina | CSS más unas pocas líneas de JS para la pausa |

(Keystatic usa React, pero solo dentro del panel de edición local. No llega a la web pública.)

## Stack

| Pieza | Elección |
|---|---|
| Generador | **Astro 7.4** + TypeScript estricto, Node 22.23.4 (`.nvmrc`) |
| Contenido | YAML en `src/content/`: **un archivo por propuesta y por fuente**, para que cada cambio tenga su diff y cada propuesta su URL |
| Validación | Esquemas Zod más las reglas del §5 en un paso de compilación que falla si no se cumplen |
| Edición | YAML a mano al principio. **Keystatic en modo local** cuando empiece la carga masiva de programas o entre otro editor |
| Estilos | CSS propio con *tokens* (variables) sacados de la propuesta B, sin Tailwind |
| Tipografías | Sofia Sans Extra Condensed, Mona Sans y DM Mono, **autoalojadas** (sin Google Fonts: más rápido y sin enviar datos a terceros) |
| Logos y PDF | Logos autoalojados en `public/logos/` (de momento enlazados a Wikimedia Commons). Los PDF **no** se alojan: se enlaza el original y una copia en Wayback Machine, con huella SHA-256 |
| Buscador | Pagefind |
| Alojamiento | **Netlify**, plan gratuito personal (de créditos), en un dominio *.netlify.app. Ver «Límites de Netlify» |
| Analítica | Ninguna por ahora (la de Netlify es de pago). Si se añade, sin cookies y sin banner |
| Repositorio | GitHub |
| CI (GitHub Actions) | Compilación con validación, comprobación de enlaces, accesibilidad (axe) y, a diario, vigilancia de las webs de los partidos con aviso de PDF nuevos o cambiados |
| Jornada de reflexión | `scripts/jornada-reflexion.mjs` hace fallar la compilación de Netlify el 28 y el 29 de noviembre (hora de Madrid). Excepción solo para correcciones: `FORZAR_PUBLICACION=correccion` |
| Formulario de errores | Netlify Forms (gratis e ilimitado en el plan de créditos), con campo trampa contra spam |

## Límites de Netlify y cómo publicamos

La cuenta es reciente, así que está en el **plan gratuito de créditos** (verificado el 9 nov 2026 en docs.netlify.com):

| Concepto | Coste |
|---|---|
| Créditos al mes | 300, sin posibilidad de comprar más en el plan gratuito |
| Cada publicación en producción | 15 créditos (las fallidas y las vueltas atrás no cuentan) |
| Previsualizaciones de cada cambio | Gratis |
| Tráfico | 20 créditos por GB |
| Peticiones | 2 créditos por cada 10.000 |
| Formularios | Gratis |

**Si se agotan, no se cobra nada, pero se apagan todas las webs de la cuenta** hasta el ciclo siguiente. Hay avisos por correo al 50, 75, 90 y 100 %. En el foro se informa de que la publicación se bloquea con unos 30 créditos restantes.

Cómo lo gestionamos:

- **Publicar por tandas**, no tras cada cambio: unas 8–10 publicaciones al mes como máximo, con margen para el tráfico.
- **Revisar en previsualizaciones**, que son gratis. Producción solo se compila si cambia algo publicable (`ignore` en `netlify.toml`).
- **Validación estricta en producción**: con `PUBLICACION_ESTRICTA=1`, la compilación falla si queda algo sin verificar (falta un enlace, la copia archivada o la segunda revisión), así que no se gastan créditos en publicaciones a medias.
- **Peso mínimo**: sin frameworks de interfaz y con caché inmutable de recursos. La portada pesa unos 180 KB la primera vez, la mayor parte tipografías, y unos 15 KB en las siguientes visitas.
- **Riesgo**: un pico de visitas en la semana electoral (más de unos 10 GB) podría apagar la web. Si el tráfico crece, la salida sin coste es mover la misma carpeta `dist/` a un alojamiento sin límite de tráfico (Cloudflare Pages o GitHub Pages). No requiere cambiar nada del proyecto.

## Estructura

```
gaveta-programas/
├── docs/                    investigación, arquitectura, wireframes, diseño (como hasta ahora)
├── public/                  logos, tipografías, favicon
├── src/
│   ├── content/
│   │   ├── partidos/        fa.yaml, pod.yaml, pp.yaml, psoe.yaml, vox.yaml
│   │   ├── temas/           vivienda.yaml…
│   │   ├── fuentes/         pp-contrato-espana-2026.yaml…
│   │   ├── propuestas/      pp/vivienda-millon-viviendas.yaml…
│   │   ├── ubicaciones/     cis-2026-10.yaml, ches-2024.yaml
│   │   └── cambios/         2026-11-09-vox-recuperar-espana.yaml…
│   ├── content.config.ts    esquemas
│   ├── lib/                 reglas de validación, consultas, formato de fechas
│   ├── components/          Marquesina, EstadoPrograma, EtiquetaFuente, ColumnaPartido, MapaPropuestas…
│   ├── layouts/
│   ├── pages/               /, /partidos/[id], /temas/[tema], /comparar/[tema], /escala, /fuentes, /como-funciona
│   └── styles/              tokens.css, base.css
├── scripts/                 guardia de jornada de reflexión, vigilancia de fuentes, archivo en Wayback
└── .github/workflows/
```

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Keystatic está en versión 0.x | Solo escribe archivos. Si falla, se editan los YAML a mano y no se pierde nada |
| Volumen cuando lleguen los programas (cientos de propuestas por partido) | No es problema para un sitio estático: la compilación tarda segundos |
| Hace falta corregir algo urgente el 28 | El bloqueo admite una excepción manual documentada, solo para errores, nunca para contenido nuevo |

## Decisiones que te tocan a ti

1. ~~Repositorio público o privado~~ → **público** (decidido el 9 nov).
2. **Dominio.** De momento, *.netlify.app.
3. **Cuentas de GitHub y Netlify.** Las tienes que conectar tú.
4. **Keystatic desde el primer día o tras el MVP.** Recomiendo tras el MVP, hacia el 12–13 de noviembre, antes de cargar los programas completos.
