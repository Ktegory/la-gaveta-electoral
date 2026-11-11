# La gaveta de los programas: plan de arquitectura

**Versión:** 0.1, 9 de noviembre de 2026
**Estado:** propuesta para revisar
**Relacionado:** [investigacion-programas-29N.md](investigacion-programas-29N.md) · [wireframes](wireframes/index.html)

---

## 0. Nombre

**Recomendación: «La gaveta de los programas»**, con «La Gaveta» como marca corta (logo, redes, favicon).

- **«De los programas» frente a «del programa».** «Del programa» suena a un único programa, o incluso a un programa de televisión. La web reúne varios, y el plural lo dice sin ambigüedad.
- **La metáfora funciona.** Los programas suelen acabar olvidados en un cajón, y la web los saca de ahí. Encaja con el lema: *«Sacamos los programas del cajón»*.
- **Riesgo menor.** En gran parte de la península se dice más «cajón» que «gaveta», aunque la palabra se entiende (RAE: «cajón corredizo que hay en los escritorios»), y en Canarias y Galicia es de uso común. Esa rareza también ayuda a que el nombre se recuerde.
- **Pendiente:** comprobar la disponibilidad de dominios (`lagaveta.es`, `gavetadeprogramas.es`, `lagavetadelosprogramas.es`) y de usuarios en redes.

---

## 1. Principios

1. **Transparencia siempre.** Cada dato muestra de dónde sale, de qué tipo de fuente es y en qué fecha se publicó. Si algo es provisional, se dice en la misma pantalla donde aparece, no en una página aparte.
2. **Neutralidad verificable.** Mismas reglas para todos los partidos, criterios publicados y orden de los partidos que no favorezca a ninguno. Resumimos sin opinar.
3. **Que no consten propuestas no significa que el partido no tenga postura.** Cuando no hay propuestas de un partido sobre un tema, la web dice «No consta en las fuentes consultadas», nunca «No propone nada».
4. **El original siempre a un clic.** Cada resumen enlaza al documento original y, si se puede, a la página exacta.
5. **Accesible y rápida.** Diseñada primero para móvil, cumpliendo WCAG 2.2 AA y con lenguaje claro. Tiene que cargar bien con mala conexión.
6. **Hay prisa: quedan 20 días.** Todo lo que no llegue al 29N se deja para después, sin comprometer la calidad de lo que sí se publique.

---

## 2. Funcionalidades

### 2.1 Pedidas

| # | Funcionalidad | Cómo se resuelve |
|---|---|---|
| F1 | **Programa de cada partido** | Lector del programa en HTML accesible, dividido por capítulos, con índice, enlace a cada apartado y descarga del PDF original. Mientras no esté publicado, la pestaña aparece con el aviso «Aún no publicado», la fecha prevista si se conoce y un botón de aviso. |
| F2 | **Resumen de propuestas destacadas** | Mismo número de propuestas por partido (8–10). Se escogen con criterios públicos (§6.3), cada una con su fuente. |
| F3 | **Búsqueda por temas** | 12 temas transversales, cada uno con su página. Además, un buscador de texto libre sobre las propuestas y, cuando existan, sobre los programas completos. |
| F4 | **Comparador** | Una matriz con los partidos en columnas y los subtemas en filas. Se eligen tema y partidos, y la selección se puede compartir por URL. |
| F5 | **Escala izquierda–derecha** | Un eje horizontal de 0 a 10 que solo muestra **datos externos con su metodología** (CIS, encuesta a expertos CHES), nunca una ubicación decidida por nosotros. Ver §7. |
| F6 | **Transparencia de la información provisional** | Un sistema de estados por partido, tipos de fuente por propuesta, aviso global mientras falten programas, registro público de fuentes e historial de cambios. Ver §6. |

### 2.2 Propuestas adicionales

**Para el lanzamiento (MVP):**
- **Estado de los programas** en la portada: qué partido ha publicado, cuándo y qué se espera. Es lo que más se consultará estas semanas.
- **Registro público de fuentes**: todas las fuentes en una tabla, con fecha de consulta, copia archivada (Wayback Machine o copia propia) y huella SHA-256 de cada PDF. Así se puede comprobar si un documento ha cambiado.
- **Historial de cambios por partido**, con un feed RSS: «12 nov: añadido el programa completo del PP; sustituye a 6 fuentes provisionales».
- **Botón «¿Has visto un error?»** en cada propuesta.
- **Glosario** de términos como IRPF, SMI, ITP, IMV, gran tenedor o Pacto de Toledo, que aparecen como definiciones emergentes dentro del texto.
- **Tarjetas para compartir**: cada propuesta y cada comparación tiene URL propia e imagen para redes, que siempre lleva la fuente.
- **Página «Cómo trabajamos»**: metodología, criterios, quién hay detrás y uso de IA.

**Después del lanzamiento, según el tiempo disponible:**
- **«Qué ha cambiado desde 2023»**: compara el programa de 2026 con el anterior del mismo partido. Es útil y con poco coste una vez extraídos los textos.
- **Avisos de publicación** («Avísame cuando el PSOE publique su programa») por RSS o, más adelante, por correo.
- **Ficha de candidaturas por territorio**: coaliciones y marcas regionales (PSC, Comuns-Front Ampli, UPN-PP, Compromís-Front Valencià…) y Senado.
- **Datos abiertos**: descarga en JSON o CSV de todas las propuestas, y repositorio público con el historial.
- **Versiones en catalán, gallego y euskera.**
- **Test de afinidad («¿con quién coincides?»).** Atrae mucho tráfico, pero exige una metodología muy cuidada (preguntas validadas, ponderación, revisión externa). Mejor dejarlo **fuera del 29N** y hacerlo bien para otras elecciones.
- **Enlaces a verificadores y estimaciones de coste** (AIReF, Newtral, Maldita, Funcas) cuando haya análisis independientes de las medidas.

---

## 3. Mapa del sitio

```
/                               Inicio: estado de los programas, temas, comparador rápido, novedades
├── /partidos/                  Listado de partidos
│   └── /partidos/[partido]/    Ficha del partido
│       ├── (Resumen)           Propuestas destacadas
│       ├── /temas/             Propuestas del partido por tema
│       ├── /programa/          Lector del programa completo (o «aún no publicado»)
│       ├── /fuentes/           Fuentes usadas para este partido
│       └── /historial/         Cambios en la ficha
├── /temas/                     Los 12 temas
│   └── /temas/[tema]/          Todas las propuestas de todos los partidos sobre un tema
├── /comparar/                  Comparador (?partidos=pp,psoe&tema=vivienda)
├── /escala/                    Escala izquierda–derecha
├── /buscar/                    Buscador de texto libre
├── /propuesta/[id]/            Propuesta individual (para compartir)
├── /fuentes/                   Registro global de fuentes
├── /novedades/                 Historial global (+ /novedades/rss.xml)
├── /como-trabajamos/           Metodología, criterios, uso de IA, equipo
├── /glosario/
└── /errores/                   Formulario de corrección
```

**Navegación principal:** Partidos · Temas · Comparar · Escala · Cómo trabajamos.
En móvil, una barra inferior con 4 iconos (Inicio, Temas, Comparar, Buscar) y el resto en un menú.

---

## 4. Temas, primera versión

| Tema | Subtemas iniciales (para las filas del comparador) |
|---|---|
| Vivienda | Acceso y compra · Alquiler · Vivienda pública · Grandes tenedores y fondos · Okupación y desahucios · Fiscalidad de la vivienda |
| Fiscalidad y economía | IRPF · IVA · Sociedades · Patrimonio y grandes fortunas · Deuda y gasto público |
| Pensiones | Revalorización · Edad de jubilación · Pensiones mínimas · Sostenibilidad |
| Empleo y salarios | SMI · Jornada · Autónomos · Reforma laboral |
| Inmigración | Regularización · Nacionalidad · Fronteras · Acceso a servicios |
| Sanidad | Listas de espera · Personal · Sanidad pública y privada |
| Educación | 0–3 años · Contenidos · Lenguas · Universidad |
| Energía y medio ambiente | Nuclear · Renovables · Clima · Agua · Precio de la energía |
| Instituciones y regeneración | Justicia · Organismos independientes · Presupuestos · Constitución |
| Exterior y defensa | OTAN · Gasto militar · Unión Europea · Israel y Palestina |
| Igualdad | Violencia machista · Aborto · LGTBI · Cuidados |
| Modelo territorial | Financiación autonómica · Lenguas cooficiales · Competencias |

Los subtemas son orientativos y se ajustarán cuando lleguen los programas. Cada subtema necesita propuestas de al menos dos partidos; si no, se fusiona con otro.

---

## 5. Modelo de datos

El contenido se guarda como archivos (YAML o Markdown) en el repositorio. Cada cambio queda registrado en git, lo que da el historial público casi sin esfuerzo.

```ts
Partido {
  id: "pp"
  nombre, nombreCorto, siglas
  color            // solo como acento, nunca como fondo de texto
  logo
  candidato: { nombre, cargo? }
  candidaturas: [{ territorio, marca, socios[] }]  // PSC, UPN-PP, Comuns-Front Ampli…
  web
  estadoPrograma: "publicado" | "avance" | "pendiente"
  fechaProgramaPrevista?: date
  fechaProgramaPublicado?: date
  ultimaRevision: datetime         // última vez que comprobamos su web
}

Fuente {
  id: "pp-contrato-espana-2026"
  partidoId
  titulo
  tipo: "programa-29n" | "avance-oficial" | "documento-oficial"
      | "anuncio-oficial" | "prensa" | "programa-anterior"
  url
  urlArchivada          // Wayback Machine o copia propia
  sha256?               // para PDF
  fechaPublicacion
  fechaConsulta
  paginas?
  notas?                // p. ej. «PDF alojado en El Debate, no en pp.es»
}

Tema       { id, nombre, icono, descripcion, subtemas: [{ id, nombre }] }

Propuesta {
  id
  partidoId
  temaId, subtemaId
  titulo                // ≤ 90 caracteres, verbo en infinitivo: «Prohibir…», «Subir…»
  resumen               // 1–3 frases neutras
  citaLiteral?          // fragmento textual de la fuente
  cifras?: [{ valor, unidad, descripcion }]   // «1.800 €/mes SMI»
  fuentes: [{ fuenteId, pagina? }]            // OBLIGATORIO, al menos 1
  fechaAnuncio
  destacada: boolean
  criterioDestacada?    // «resumen-del-partido» | «medida-estrella-anunciada»
  estado: "vigente" | "sustituida"            // sustituida = superada por el programa oficial
  sustituidaPor?: propuestaId
  revisadaPor, fechaRevision
}

UbicacionIdeologica {
  partidoId
  origen: "cis" | "ches" | …
  valor, escala: "0-10" | "1-10"
  intervalo?            // margen de error si lo hay
  fecha, n?, url, notas  // p. ej. «Frente Amplio: no hay dato propio; se muestra Sumar»
}

Cambio      { fecha, partidoId?, tipo, descripcion, propuestasAfectadas[] }
```

**Reglas que comprueba la compilación** (si alguna falla, la web no se publica):
- Toda propuesta tiene al menos una fuente, y esa fuente existe.
- Toda fuente tiene `fechaConsulta` y `urlArchivada`.
- Ninguna propuesta destacada sale de una fuente de tipo `prensa` si existe una fuente oficial que la recoja.
- Todos los partidos tienen el mismo número de propuestas destacadas (± 1).

---

## 6. Sistema de transparencia

### 6.1 Estado del programa (por partido)

| Estado | Etiqueta | Cuándo |
|---|---|---|
| `publicado` | **● Programa publicado** · fecha | El partido ha publicado su programa para el 29N |
| `avance` | **◐ Avance oficial** | Hay un documento oficial parcial (hoy: VOX, «Recuperar España») |
| `pendiente` | **○ Programa pendiente** | Solo hay otras fuentes (hoy: PSOE, Frente Amplio, Podemos y PP) |

Cada estado lleva siempre una frase explicativa, por ejemplo:
> *«El PP todavía no ha publicado su programa para el 29N (anunciado para el 10 de noviembre). Esta ficha resume **6 fuentes oficiales** publicadas entre julio de 2025 y octubre de 2026. Actualizado el 9 nov, 10:00.»*

Los estados no dependen solo del color: llevan icono y texto para que se entiendan sin ver el color.

### 6.2 Tipo de fuente (por propuesta)

Por orden de fiabilidad:

| Tipo | Etiqueta en la propuesta | Uso |
|---|---|---|
| `programa-29n` | Programa 29N, p. 34 | Fuente principal en cuanto exista |
| `avance-oficial` | Avance oficial | Documentos de campaña del partido |
| `documento-oficial` | Documento del partido | Ponencias, planes sectoriales, documentos de congreso |
| `anuncio-oficial` | Anuncio oficial | Notas de prensa y web de campaña del propio partido |
| `prensa` | Declaraciones en prensa | Solo si no hay fuente oficial. Se cita el medio y la fecha |
| `programa-anterior` | Programa 2023 | **No se mezcla** con lo actual: va en una sección aparte, «Referencia: lo que proponían en 2023» |

### 6.3 Criterios para las propuestas destacadas

En este orden:
1. Las que el propio partido destaca: sus resúmenes, «medidas estrella» o los ejes de su web de campaña.
2. Que cubran el máximo número de temas distintos.
3. Que tengan concreción, como cifras o plazos.

El mismo número para todos los partidos. Los criterios se publican en «Cómo trabajamos».

### 6.4 Cuando llega el programa oficial

1. Se añade la fuente `programa-29n` y se extraen sus propuestas.
2. Las propuestas provisionales que el programa confirma se vinculan a la nueva fuente. Las que el programa no recoge se marcan como `sustituida`, siguen visibles en el historial y se avisa con «No aparece en el programa publicado».
3. El estado del partido cambia, se registra en el historial y sale en el RSS.

### 6.5 Avisos

- **Aviso global** en la parte superior mientras falte algún programa: *«Información provisional: 4 de 5 partidos aún no han publicado su programa. Ver estado ›»*. Desaparece cuando estén todos.
- **Sello de fecha** visible en cada ficha y en cada celda del comparador: «Actualizado hace 2 h».
- **Uso de IA:** si se usa IA para extraer o resumir, se dice en «Cómo trabajamos» y en cada propuesta consta que la revisó una persona («Revisado por…»).

---

## 7. Escala izquierda–derecha

Es la funcionalidad más delicada. **Recomendación: no ubicar nosotros a los partidos.** Mostrar solo mediciones externas publicadas, cada una con su metodología, y dejar que se comparen entre sí.

| Fuente | Qué mide | Pros | Contras |
|---|---|---|---|
| **CIS** (barómetros o estudio preelectoral) | Dónde sitúa la ciudadanía a cada partido (escala 1–10) | Oficial, reciente, en España | Es percepción, no análisis del programa |
| **Encuesta a expertos CHES** (Chapel Hill Expert Survey) | Posición general izquierda–derecha y por dimensiones (economía, valores) según politólogos | Método académico y comparable en toda Europa | Última oleada en 2024; no incluye al Frente Amplio como tal |
| *(Futuro)* **Manifesto Project** | Codificación del texto del programa | Se basa en el propio programa | Se publica meses después de las elecciones |

**Diseño:**
- Un eje horizontal con una fila por fuente. Cada partido es un punto con su margen de error si lo hay. Se puede cambiar de fuente.
- Junto al eje: fecha, tamaño de muestra, pregunta exacta y enlace al estudio.
- **Frente Amplio** (decidido el 9 nov), por orden de preferencia:
  1. **Dato directo, si existe.** El estudio preelectoral del CIS para el 29N probablemente pregunta por el Frente Amplio como tal. Hay que comprobarlo.
  2. **Si no lo hay, el dato de Sumar** (la coalición predecesora, con casi los mismos socios: IU, Comuns, Más Madrid…), con marcador discontinuo y nota: *«Sin dato propio; se muestra Sumar (2023–2026)»*.
  3. **No calculamos promedios propios.** Haría falta decidir cómo ponderar a cada socio (¿por votos?, ¿por escaños?), y varios socios (CHA, Batzarre, Recortes Cero…) no tienen dato en ninguna fuente. Sería, de hecho, una ubicación nuestra, que es lo que la escala quiere evitar.
- **Escala basada en las propuestas: descartada para el 29N.** Clasificar propuestas como de izquierda o de derecha exige una plantilla de codificación, y elegirla ya es una decisión ideológica. Además, con programas incompletos el resultado saldría sesgado según qué partido ha publicado más. Es lo que hace el Manifesto Project con metodología validada, pero tarda meses. Cuando publique su codificación de estos programas, se puede enlazar o añadir como tercera fila. Mientras tanto, la comparación de propuestas ya la cubren el comparador y las páginas de tema, sin reducirla a un número.
- Más adelante, una vista con dos ejes (económico y de valores) a partir de los datos de CHES.

**Pendiente:** localizar y verificar los valores concretos del último estudio del CIS y de CHES 2024 antes de publicar. Los wireframes no contienen datos reales de la escala.

---

## 8. Reglas de neutralidad editorial

- **Orden de los partidos:** **alfabético** por el nombre que se muestra (Frente Amplio, Podemos, PP, PSOE, VOX), con nota visible: «Partidos en orden alfabético». Es estable, se explica en una frase y cada partido aparece siempre en la misma columna, también en las imágenes compartidas. En el comparador, cada persona puede reordenar las columnas. **No** ordenar por resultados anteriores ni por encuestas. *(Los wireframes v0.1 aún dicen «aleatorio»; se corrige en el diseño.)*
- **Logos:** se usan los logos oficiales, porque la gente los reconoce. Todos en una caja del mismo tamaño, sin modificar y descargados de la web de cada partido. Alt text: «Logo de [partido]».
- **Redacción:** verbo en infinitivo y lenguaje descriptivo, sin adjetivos valorativos. Usar los términos del partido entre comillas cuando sean propios, como «remigración» o «prioridad nacional».
- **Color:** en su propia ficha, el color del partido es protagonista (cabecera a todo el ancho). En las páginas compartidas (inicio, temas, comparador), todos los partidos usan el mismo componente y el color aparece solo como banda, punto o borde. El color de partido nunca se usa como color de texto. El amarillo «rotulador» es de la marca y no representa a ningún partido. Ver [diseño v0.1](diseno/index.html), pantalla «Sistema visual».
- **Fotos:** sin fotos de candidatos, o todas del mismo tamaño y estilo.
- **Mismo espacio para todos:** mismo número de destacadas y misma plantilla de ficha.
- **Correcciones públicas:** cualquier corrección queda en el historial con fecha y motivo.

---

## 9. Arquitectura técnica

**Una web estática, generada a partir de archivos versionados.** No necesita servidor ni base de datos: es barata, rápida, aguanta bien los picos de tráfico y el historial es público.

| Pieza | Elección propuesta | Por qué |
|---|---|---|
| Generador | **Astro** + TypeScript | Pensado para webs de mucho contenido. Valida los datos al compilar, que es como se aplican las reglas del §5, y solo carga JavaScript donde hace falta interactividad (comparador, escala, buscador). |
| Contenido | YAML o Markdown en `src/content/` | Se revisa por *pull request*, con historial y autoría |
| Buscador | **Pagefind** | Búsqueda en el navegador sobre un índice generado al compilar, sin servidor |
| Lector de programas | Texto del PDF convertido a HTML semántico (pdftotext + revisión), con enlaces por apartado y página | Accesible, enlazable y fácil de buscar |
| Gráficos (escala) | SVG generado al compilar, con algo de interactividad en el navegador | Ligero y accesible |
| Alojamiento | Cloudflare Pages o Netlify | Gratis o barato, con CDN y previsualización de cada cambio |
| Analítica | Plausible o Cloudflare Web Analytics, sin cookies | Sin cookies no hace falta banner. También es coherente con el enfoque de transparencia |
| Edición | Al principio, git. Más adelante, Decap CMS u otro similar para editores sin perfil técnico | |
| Vigilancia de fuentes | Tarea programada (GitHub Actions) que revisa a diario las webs y feeds de los partidos y avisa de PDF nuevos o cambiados (por huella SHA-256) | Automatiza la lista de vigilancia de la investigación |
| Archivo | Copia de cada PDF en almacenamiento propio, más una captura en Wayback Machine | Los partidos cambian y borran documentos |

```
partidos (webs, PDF) ──▶ vigilancia diaria ──▶ aviso «hay documento nuevo»
                                                   │
                                     extracción + resumen + revisión humana
                                                   │
                                     PR con YAML (propuestas, fuentes, cambio)
                                                   │
                         compilación (Astro valida reglas) ──▶ previsualización ──▶ publicación
```

---

## 10. Calendario hasta el 29N

| Fecha | Hito |
|---|---|
| **9–11 nov** | Arquitectura y wireframes revisados. Diseño visual. El PP presenta su programa el 10 de noviembre. |
| **11–13 nov** | Diseño aprobado. Proyecto Astro, modelo de datos y carga de los 5 partidos con las fuentes actuales. |
| **13 nov** | Empieza la campaña. |
| **≈ 15–16 nov** | **MVP publicado**: portada con estado, fichas de partido, temas, comparador, fuentes y metodología. |
| **16–22 nov** | Se incorporan los programas a medida que se publican. Lector de programas y buscador. Escala con datos verificados. |
| **23–27 nov** | Más partidos, «qué ha cambiado desde 2023» y pulido. |
| **28 nov** | Jornada de reflexión: la web sigue en línea, pero **sin publicar contenido nuevo** (ver riesgos). |
| **29 nov** | Elecciones. |

---

## 11. Riesgos y decisiones pendientes

| # | Tema | Propuesta |
|---|---|---|
| R1 | **Tiempo.** Quedan 20 días y los programas llegan tarde. | Priorizar el MVP y que la web sea útil también con información parcial. |
| R2 | **Percepción de sesgo** (escala, selección de destacadas, orden). | Reglas del §8 publicadas y opción de enviar correcciones. |
| R3 | **Jornada de reflexión y LOREG.** La web no hace campaña por ningún partido, pero conviene confirmarlo. | ✅ Decidido: no se publica contenido nuevo el 28 ni el 29 de noviembre; la web sigue en línea. |
| R4 | **Logos de los partidos** (marca registrada). | ✅ Decidido: se usan, con fines informativos (ver §8). |
| R5 | **Webs con protección contra bots** (psoe.es, podemos.info, voxespana.es). | Revisión manual con navegador más archivo propio. |
| R6 | **Frente Amplio en la escala** (no hay datos propios). | ✅ Decidido: dato directo si existe; si no, Sumar con nota. Sin promedios propios (ver §7). |
| R7 | **Quién firma el proyecto.** | ✅ Decidido: iniciativa personal. Ver §12. |
| D1 | Nombre definitivo y dominio | Recomendado: «La gaveta de los programas». Pendiente comprobar el dominio. |
| D2 | Orden de los partidos | ✅ Decidido: alfabético con nota (ver §8). |
| D3 | Qué partidos añadir después | Por ejemplo ERC, Junts, PNV, EH Bildu, BNG, CC, SALF… según el criterio que se fije: ¿presencia en el Congreso?, ¿en las encuestas? |

---

## 12. Autoría

**Iniciativa personal**, y se dice en el pie de todas las páginas y en «Cómo trabajamos».

**Autor:** Khiustin Tornés.

**Datos declarados** (9 nov 2026):
- **Financiación:** personal. El autor asume los costes de diseño, desarrollo y alojamiento.
- **Vínculos políticos:** no está ni ha estado afiliado a ningún partido.

**Textos para la web:**
- **Pie de página:**
  > *La gaveta de los programas es una iniciativa personal de Khiustin Tornés para facilitar el acceso a los programas electorales y su comparación. Financiada por su autor. Sin vinculación con ningún partido.*
- **«Cómo trabajamos › Quién hay detrás»:**
  > *Soy Khiustin Tornés. Hice esta web porque casi nadie lee los programas electorales: son largos, salen tarde y cuesta compararlos. Aquí intento destejer la maraña de propuestas de cada partido y ponerlas una al lado de otra, siempre con la fuente original a un clic.*
  >
  > ***Financiación.*** *Es un proyecto personal. He asumido yo los costes de diseño, desarrollo y alojamiento. No hay publicidad ni dinero de terceros.*
  >
  > ***Independencia.*** *No estoy ni he estado afiliado a ningún partido político.*
  >
  > ***Correcciones.*** *Si ves un error o falta una propuesta, escríbeme a [correo]. Todas las correcciones quedan registradas en el historial.*
- **Pendiente:** correo de contacto. Conviene uno propio del proyecto en lugar del personal.
- **Ojo:** «no hay publicidad ni dinero de terceros» es una suposición. Quitarlo si se prevén anuncios o donaciones.
- **Aviso legal:** como mínimo, nombre del titular y correo de contacto. Revisar si aplica la LSSI y qué datos exige (depende de si hay actividad económica, como donaciones o publicidad).
