# MANIFESTO · Tres obras. Tres universos.

Plataforma cultural y educativa sin ánimo de lucro: **el arte no se contempla solamente, se explora.** Cada obra se recorre con un gesto distinto.

| Obra | Experiencia |
|---|---|
| **Medusa**, Caravaggio (hacia 1597–1598) | Inclina el escudo y desafía su mirada: material WebGL2 propio con versión CSS si no hay WebGL, cinco expedientes y petrificación reversible |
| **La noche estrellada**, Vincent van Gogh (1889) | Observa cómo respira el cielo: corrientes de partículas sobre la obra intacta y separación entre lo observado y lo imaginado |
| **Los elefantes**, Salvador Dalí (1948) | Descifra sus cinco misterios: capítulos, laboratorio de escala y la escena original «El desierto imposible» |

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
- la entrada directa al selector de las tres obras;
- variantes WebP de las imágenes (hasta 2048 px);
- páginas con `noindex`;
- *Los elefantes* completo (pintura, cinco capítulos y guías) solo si su reproducción está en `public/obras/` al exportar y tiene derechos de reutilización; este repositorio no la incluye, así que la publicación usa la alternativa informativa.

El workflow `.github/workflows/pages.yml` ejecuta lint, typecheck y esta exportación, y publica solo `out/`.

## Imágenes y derechos

Consulta [`CREDITOS.md`](CREDITOS.md). *Los elefantes* de Dalí es una obra protegida y su reproducción no forma parte de este repositorio. Sin ella, la página muestra una composición gráfica propia y los cinco capítulos como texto.
