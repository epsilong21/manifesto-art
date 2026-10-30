/**
 * Composición gráfica propia de MANIFESTO para Los elefantes: no reproduce ni
 * calca la pintura. Un horizonte bajo con el sol rasante, mucho vacío, una masa
 * sobre cuatro hilos de sombras larguísimas, una aguja y cinco marcas: los
 * cinco capítulos que se descifran en la experiencia. Se recorta desde el
 * centro, así sirve en vertical y en horizontal. `id` evita colisiones de
 * degradados y filtros si hay varias en la página.
 */
export function ElefantesGrafico({ id, className }: { id: string; className?: string }) {
  const cielo = `${id}-cielo`;
  const suelo = `${id}-suelo`;
  const sol = `${id}-sol`;
  const grano = `${id}-grano`;
  const hilos = [
    [372, 232, 366],
    [384, 236, 388],
    [418, 236, 414],
    [430, 232, 438],
  ];
  return (
    <svg
      className={className}
      viewBox="0 0 800 640"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={cielo} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1a1320" />
          <stop offset="0.4" stopColor="#4d2635" />
          <stop offset="0.72" stopColor="#a3503d" />
          <stop offset="0.92" stopColor="#d98b55" />
          <stop offset="1" stopColor="#f0c08a" />
        </linearGradient>
        <linearGradient id={suelo} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5a3030" />
          <stop offset="0.35" stopColor="#2e1a22" />
          <stop offset="1" stopColor="#100d12" />
        </linearGradient>
        <radialGradient id={sol} cx="0.62" cy="0.735" r="0.42">
          <stop offset="0" stopColor="#ffe2b0" stopOpacity="0.85" />
          <stop offset="0.18" stopColor="#f3a86a" stopOpacity="0.45" />
          <stop offset="1" stopColor="#f3a86a" stopOpacity="0" />
        </radialGradient>
        {/* Grano de pigmento: estático, da materia al degradado */}
        <filter id={grano} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 1  0 0 0 0 0.9  0 0 0 0 0.8  0 0 0 0.09 0" />
        </filter>
      </defs>

      <rect width="800" height="470" fill={`url(#${cielo})`} />
      <rect width="800" height="640" fill={`url(#${sol})`} />

      {/* Estratos del cielo: bandas finas, como pinceladas horizontales */}
      <g stroke="#f6d2a0" strokeWidth="1" vectorEffect="non-scaling-stroke" fill="none">
        <path d="M0 330 Q200 322 420 332 T800 326" strokeOpacity="0.1" />
        <path d="M0 378 Q240 370 470 380 T800 372" strokeOpacity="0.14" />
        <path d="M0 418 Q180 412 400 420 T800 414" strokeOpacity="0.2" />
        <path d="M0 446 Q260 441 520 448 T800 443" strokeOpacity="0.26" />
      </g>

      {/* Mesetas lejanas sobre el horizonte */}
      <path d="M0 470 L0 452 L46 450 L64 440 L150 438 L170 452 L236 456 L250 470 Z" fill="#3b2129" fillOpacity="0.85" />
      <path d="M596 470 L610 458 L668 456 L680 446 L742 445 L756 458 L800 460 L800 470 Z" fill="#3b2129" fillOpacity="0.7" />

      <rect y="470" width="800" height="170" fill={`url(#${suelo})`} />

      {/* Líneas de fuga: el suelo se abre hacia el espectador */}
      <g stroke="#efd2ae" strokeOpacity="0.1" strokeWidth="1" vectorEffect="non-scaling-stroke">
        {[-420, -160, 60, 260, 540, 760, 1020, 1240].map((x) => (
          <line key={x} x1="496" y1="470" x2={x} y2="640" />
        ))}
        <line x1="0" y1="500" x2="800" y2="500" strokeOpacity="0.07" />
        <line x1="0" y1="548" x2="800" y2="548" strokeOpacity="0.06" />
      </g>

      {/* Retícula de composición: tercios, apenas visible */}
      <g stroke="#efe1c9" strokeOpacity="0.1" strokeWidth="1" vectorEffect="non-scaling-stroke">
        <line x1="266" y1="0" x2="266" y2="640" />
        <line x1="534" y1="0" x2="534" y2="640" />
        <line x1="0" y1="213" x2="800" y2="213" />
        <line x1="120" y1="470" x2="680" y2="90" strokeDasharray="3 7" strokeOpacity="0.2" />
      </g>

      {/* Horizonte */}
      <line x1="0" y1="470" x2="800" y2="470" stroke="#ffe3bd" strokeOpacity="0.8" strokeWidth="1" vectorEffect="non-scaling-stroke" />

      {/* Sombras rasantes: el sol bajo las estira hacia el espectador */}
      <g stroke="#0c080b" strokeOpacity="0.55" strokeWidth="1.5" vectorEffect="non-scaling-stroke">
        {hilos.map(([, , x]) => (
          <line key={x} x1={x} y1="470" x2={x - 210} y2="600" />
        ))}
      </g>
      <path d="M346 474 L410 476 L262 552 L176 548 Z" fill="#0c080b" fillOpacity="0.35" />

      {/* Peso sobre fragilidad: una masa y cuatro hilos que llegan al suelo */}
      <g>
        <g stroke="#f4e3c8" strokeWidth="1.2" vectorEffect="non-scaling-stroke">
          {hilos.map(([x1, y1, x2]) => (
            <line key={x1} x1={x1} y1={y1} x2={x2} y2="470" />
          ))}
        </g>
        <ellipse cx="401" cy="214" rx="58" ry="30" fill="#140d12" />
        {/* Borde iluminado por el sol bajo */}
        <path d="M352 226 Q401 252 452 222" stroke="#f3a86a" strokeOpacity="0.6" strokeWidth="1.5" fill="none" vectorEffect="non-scaling-stroke" />
        <path d="M401 184 L407 112 L401 92 L395 112 Z" fill="#140d12" />
        <line x1="404" y1="118" x2="406" y2="182" stroke="#f3a86a" strokeOpacity="0.45" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      </g>

      {/* Cota: la altura que no debería sostenerse */}
      <g stroke="#ffd79e" strokeOpacity="0.85" strokeWidth="1" vectorEffect="non-scaling-stroke" fill="none">
        <line x1="476" y1="244" x2="476" y2="470" />
        <line x1="470" y1="244" x2="482" y2="244" />
        <line x1="470" y1="470" x2="482" y2="470" />
      </g>

      {/* Escala: una figura diminuta en el vacío, con su sombra */}
      <line x1="172" y1="461" x2="172" y2="470" stroke="#140d12" strokeWidth="2" />
      <line x1="172" y1="470" x2="150" y2="482" stroke="#0c080b" strokeOpacity="0.5" strokeWidth="1.5" />

      <rect width="800" height="640" filter={`url(#${grano})`} />

      {/* Los cinco misterios */}
      <g className="eg-marcas" fontFamily="var(--font-outfit), system-ui, sans-serif" fontSize="13" fontWeight="600" textAnchor="middle">
        {[
          [401, 214, "1"],
          [366, 372, "2"],
          [428, 124, "3"],
          [476, 214, "4"],
          [172, 436, "5"],
        ].map(([x, y, n]) => (
          <g key={n} transform={`translate(${x} ${y})`}>
            <circle r="12" fill="#121016" fillOpacity="0.6" stroke="#ffd79e" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            <text y="4.5" fill="#ffe7c2">
              {n}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}
