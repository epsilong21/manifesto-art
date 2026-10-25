# MANIFESTO · Cinco obras. Cinco universos.

Enciclopedia digital de arte gratuita, sin publicidad, sin suscripciones, sin venta de contenido y sin finalidad comercial: **el arte no se contempla solamente, se explora.** Cada obra se recorre con un gesto distinto.

| Obra | Experiencia |
|---|---|
| **Medusa**, Caravaggio (hacia 1597–1598) | Inclina el escudo y desafía su mirada: material WebGL2 propio con versión CSS si no hay WebGL, cinco expedientes y petrificación reversible |
| **La noche estrellada**, Vincent van Gogh (1889) | Observa cómo respira el cielo: corrientes de partículas sobre la obra intacta y separación entre lo observado y lo imaginado |
| **Los elefantes**, Salvador Dalí (1948) | Descifra sus cinco misterios: capítulos, laboratorio de escala y la escena original «El desierto imposible» |
| **Untitled**, Jean-Michel Basquiat (1981) | Examina la cabeza capa a capa: cuatro capas, cinco hallazgos, tres lecturas y un expediente con sus fuentes |
| **Glenn**, Jean-Michel Basquiat (1984–1985) | Pasa la obra por la mesa de luz: cinco hallazgos, capas, fotocopiadora, ampliación, tres lecturas y su expediente |

Sitio: https://epsilong21.github.io/manifesto-art/

## Desarrollo

Requisitos: Node 24 y npm.

```bash
npm ci
npm run dev            # http://localhost:3000
npm run lint
npm run typecheck
```

## Publicación estática (GitHub Pages)

```bash
npm run build:pages    # exportación en out/ + verificación de rutas, recursos y exclusiones
npm run preview:pages  # http://localhost:4010/manifesto-art/
```

`build:pages` compila con `MANIFESTO_DESTINO=pages` y genera:
- una exportación estática bajo `/manifesto-art` (se cambia con `MANIFESTO_BASE_PATH`);
- la entrada directa al selector de las cinco obras;
- variantes WebP de las imágenes (hasta 2048 px);
- páginas con `noindex`;
- *Los elefantes* completo (pintura, cinco capítulos y guías) solo si su reproducción está en `public/obras/` al exportar y tiene derechos de reutilización; este repositorio no la incluye, así que la publicación usa la alternativa informativa.
- *Untitled* (Basquiat) con la pintura solo si hay en `public/obras/` una reproducción con licencia registrada en `src/content/basquiat-reproducciones.json`; hoy no existe, así que la publicación usa la lámina vacía y las capas como texto.
- *Glenn* (Basquiat), igual: con la pintura solo si hay una reproducción con licencia registrada en `src/content/glenn-reproducciones.json`; hoy no existe, así que la publicación usa el esquema propio de MANIFESTO.

El workflow `.github/workflows/pages.yml` ejecuta lint, typecheck y esta exportación, y publica solo `out/`.

## Imágenes y derechos

Consulta [`CREDITOS.md`](CREDITOS.md). *Los elefantes* de Dalí es una obra protegida y su reproducción no forma parte de este repositorio. Sin ella, la página muestra una composición gráfica propia y los cinco capítulos como texto.

*Untitled* y *Glenn* de Basquiat también están protegidas y no hay licencia de reproducción: el repositorio no incluye las pinturas y las páginas no las muestran.
