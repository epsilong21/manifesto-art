# La web de las obras dentro de Shopify

La web (portada, catálogo, las diez obras y las dos páginas legales) se sirve **desde el propio tema de Shopify**, en
`manifestocol.com/pages/...`, sin GitHub Pages ni DNS aparte. Todo se conserva: animaciones, interacciones, imágenes.

| Página | URL en la tienda |
| --- | --- |
| Portada | `/pages/obras` |
| Catálogo | `/pages/obras-catalogo` |
| Cada obra | `/pages/obra-<obra>` (p. ej. `/pages/obra-medusa`) |
| Aviso legal / Privacidad | `/pages/obras-aviso-legal`, `/pages/obras-privacidad` |

GitHub Pages **sigue funcionando** como entorno de trabajo y de pruebas (`https://epsilong21.github.io/manifesto-art/`);
la versión de Shopify no enlaza a él en ningún sitio.

## Cómo funciona

`npm run shopify:empaquetar` exporta la web y la convierte en archivos de tema (carpeta `shopify-tema/`, que no se sube a git):

- **`assets/`**: JavaScript, CSS, fuentes e imágenes, con nombres planos (los assets de un tema no admiten carpetas):
  `/img/medusa-640.webp` → `img--medusa-640.webp`, `_next/static/chunks/x.js` → `static__chunks__x.js`.
- **`templates/page.<página>.liquid`**: una plantilla por página, sin el diseño del tema (`{% layout none %}`: la web
  trae su propia cabecera y pie). Los archivos se enlazan con `{{ '…' | asset_url }}`, así funciona en cualquier copia del tema.
- **`snippets/obra-manifesto.liquid`**: el bloque «Esta prenda es una obra» de la página de producto (se mantiene en
  `scripts/shopify/tema/`).

El código de la web usa `src/lib/rutaPublica.ts` para todas las rutas de `/public`; con `MANIFESTO_SHOPIFY=1` ese es el
único punto que cambia a los nombres planos. Los enlaces entre páginas se reescriben a las páginas de Shopify y una
cabecera común hace que cada enlace sea una navegación normal.

## Publicar (resumen)

`shopify:publicar` **prueba primero las 14 páginas** (`npm run shopify:probar`: las sirve en local como lo haría el tema y
comprueba en Chrome que React arranca de verdad y no hay errores) y no sube nada si alguna falla.

Con el acceso del paso 1 hecho una vez, **publicar y actualizar es un solo comando**: `npm run shopify:publicar`
(empaqueta, sube los archivos al tema en vivo y crea o corrige las páginas). Abajo, el detalle paso a paso.

### Si la cuenta no puede autorizar al CLI («Unauthorized Access»)

`shopify store auth` solo funciona con la cuenta **propietaria** de la tienda (o una con permiso de apps). Sin eso, las
páginas se crean a mano una sola vez y el resto no cambia:

1. `npm run shopify:publicar -- --sin-paginas` (sube los archivos y lista las páginas).
2. Shopify → Contenido → Páginas → *Agregar página*, 14 veces. En cada una: **título** (p. ej. «Obra · Medusa»), y a la derecha
   **Plantilla de tema** = el nombre de la lista (`obra-medusa`…). El **handle** (la URL) debe quedar exactamente como en la
   lista: se cambia en *Editar el listado de resultados de búsqueda* → *URL y controlador*. Contenido: vacío; visibilidad: visible.

## Primera publicación (una vez)

1. **Acceso del CLI para crear páginas** (abre el navegador; entra con la cuenta dueña de la tienda):
   ```
   shopify store auth --store 539bc0.myshopify.com --scopes read_content,write_content
   ```
2. **Empaquetar:** `npm run shopify:empaquetar`
3. **Subir al tema en vivo** (solo añade archivos; no toca el resto del tema):
   ```
   cd shopify-tema
   shopify theme push --store manifestocol.myshopify.com --theme 182672720169 --allow-live --nodelete --only "assets/*" --only "templates/page.obra*.liquid" --only "snippets/obra-manifesto.liquid"
   ```
4. **Crear las 14 páginas** (cada una con su plantilla): `npm run shopify:crear-paginas`
   (`-- --mostrar` solo lista lo que haría; si una página ya existe solo se corrige su plantilla).
5. **Enlazar desde la tienda:** Contenido → Menús → Menú principal → añadir «Obras» con la URL `/pages/obras`.

## Actualizar la web después

Se edita el código como siempre (`npm run dev` para verlo en local) y se vuelve a empaquetar y subir (pasos 2 y 3).
Los archivos que no cambian no cambian de nombre, así que solo suben los nuevos. Las páginas ya existen: no hay que
tocar nada más en Shopify. Para las prendas de cada obra: `npm run tienda:actualizar`.

## Probar sin publicar ni crear páginas

```
npm run shopify:empaquetar -- --prueba colecciones
```
Genera las plantillas de modo que se abren con `/pages/colecciones?view=obras`, `?view=obra-medusa`… (sobre una página
que ya exista). Súbelas a un tema **sin publicar** y míralas con `?preview_theme_id=<id>`. Los clientes no lo ven.

## Qué hay que saber

- **Nunca subir con `--only "assets/*"` sin `--nodelete`.** Con ese filtro, `shopify theme push` borra del tema todos los assets que
  no estén en la carpeta local, es decir, los del propio tema (JS, CSS, fuentes y logos). `shopify:publicar` ya lo lleva.
  Si pasara, se restauran bajando antes una copia del tema (`shopify theme pull`) y subiendo esos archivos con `--nodelete`.

- **Copias del tema:** las URL de los archivos salen de `asset_url`, así que al duplicar o publicar otra copia del tema
  todo sigue funcionando. Si se borra el tema, se van sus assets: conviene que las plantillas y assets estén en el tema en vivo.
- **Límites de Shopify:** una plantilla pesa 50–175 KB (límite ~256 KB); el tema ronda los 490 archivos (límite 1000).
- **Las dos llamadas 404 en la consola** (`forms.shopifyapps.com`, `widget-view.dondy.net`) son de apps de la tienda
  que Shopify inyecta en todas sus páginas; no son de las obras.
- **Aviso legal y privacidad:** en la versión de Shopify el texto de alojamiento habla de Shopify (no de GitHub Pages) y se
  quita el enlace al registro de créditos de GitHub. Conviene que quien responde de esos textos los revise, sobre todo lo
  que dicen de cookies y datos técnicos de la visita.
- **Si cambia Next:** el empaquetador ajusta dos líneas del cargador de Next; si no las encuentra, falla con un mensaje
  claro en vez de publicar algo roto.
