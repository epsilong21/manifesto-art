import type { Metadata } from "next";
import Link from "next/link";
import { ConceptHeader, KindTag } from "@/components/concepts/ConceptChrome";
import { Cierre } from "@/components/corona/Cierre";
import { Explorador } from "@/components/corona/Explorador";
import { CoronaPresion } from "@/components/corona/CoronaPresion";
import {
  COMPRENDER,
  CORONA_IMG as I,
  CREDITOS,
  DOCUMENTADO,
  FICHA,
  PUENTE,
} from "@/content/corona";
import { lora } from "@/lib/fonts/lora";
import "./corona.css";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "Cristo coronado de espinas, de Guido Reni — MANIFESTO",
  description:
    "Exploración visual de la pintura de Guido Reni. Tres descubrimientos en la imagen y una instalación interactiva sobre la presión invisible de la corona.",
  alternates: { canonical: "/conceptos/cristo-coronado" },
  robots: { index: false, follow: false },
  openGraph: {
    type: "article",
    locale: "es_ES",
    siteName: "MANIFESTO",
    title: "Cristo coronado de espinas — Guido Reni",
    description:
      "Contemplación, descubrimiento y presión. MANIFESTO explora la pintura de Reni.",
  },
};

export default function CristoCoronadoPage() {
  const srcSet = I.anchos
    .map((w) => `${BASE}${I.base}-${w}.webp ${w}w`)
    .join(", ");

  return (
    <div className={`mf-theme theme-corona ${lora.variable}`}>
      <ConceptHeader />

      <main>
        {/* ── Acto I: El encuentro ───────────── */}
        <section className="co-hero" aria-labelledby="co-title">
          <div className="co-hero__pintura">
            <img
              src={`${BASE}${I.base}-1200.webp`}
              srcSet={srcSet}
              sizes="(min-width: 64rem) 42vw, 85vw"
              width={I.width}
              height={I.height}
              alt={I.alt}
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
          </div>
          <div className="co-hero__copy">
            <h1 id="co-title" className="co-titulo">
              <span className="co-titulo__obra">{FICHA.titulo}</span>
            </h1>
            <dl className="co-ficha">
              <div>
                <dt className="sr-only">Autor</dt>
                <dd className="co-ficha__autor">{FICHA.autor}</dd>
              </div>
              <div>
                <dt className="sr-only">Fecha</dt>
                <dd className="co-ficha__dato">{FICHA.fecha}</dd>
              </div>
              <div>
                <dt className="sr-only">Técnica</dt>
                <dd className="co-ficha__dato">{FICHA.tecnica}</dd>
              </div>
              <div>
                <dt className="sr-only">Colección</dt>
                <dd className="co-ficha__dato">{FICHA.coleccion}</dd>
              </div>
            </dl>
          </div>
        </section>

        {/* ── Documentado ────────────────────── */}
        <section className="co-documental" aria-labelledby="co-doc-t">
          <header className="co-documental__cab">
            <KindTag tipo="hecho" />
            <h2 id="co-doc-t" className="co-documental__h">
              Lo que se sabe
            </h2>
          </header>
          <div className="co-documental__texto">
            {DOCUMENTADO.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>

        {/* ── Acto II: Aprender a mirar ──────── */}
        <Explorador />

        {/* ── Puente narrativo ────────────────── */}
        <section className="co-puente" aria-label="Puente narrativo">
          <p className="co-puente__antes">{PUENTE.antes}</p>
          <p className="co-puente__despues">{PUENTE.despues}</p>
        </section>

        {/* ── Acto III: El peso ──────────────── */}
        <CoronaPresion />

        {/* ── Acto IV: Lo que permanece ──────── */}
        <Cierre />

        {/* ── Comprender ─────────────────────── */}
        <section className="co-comprender" aria-labelledby="co-comp-t">
          <h2 id="co-comp-t" className="co-comprender__h">
            Comprender
          </h2>
          <dl className="co-comprender__lista">
            {COMPRENDER.map((item, i) => (
              <div key={i} className="co-comprender__item">
                <dt className="co-comprender__q">{item.pregunta}</dt>
                <dd className="co-comprender__a">{item.respuesta}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>

      {/* ── Créditos y pie ──────────────────── */}
      <footer className="co-footer">
        <div className="co-footer__inner">
          <section className="co-creditos" aria-labelledby="co-cred-t">
            <h2 id="co-cred-t" className="co-creditos__h">
              Imagen y créditos
            </h2>
            <p className="co-creditos__img">{CREDITOS.imagen}</p>
            <p className="co-creditos__nota">{CREDITOS.nota}</p>
            <ul className="co-creditos__fuentes">
              {CREDITOS.fuentes.map((f) => (
                <li key={f.href}>
                  <a href={f.href} target="_blank" rel="noopener noreferrer">
                    {f.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>
          <nav className="co-footer__nav" aria-label="Navegación del sitio">
            <Link href="/" className="co-footer__link">
              MANIFESTO
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
