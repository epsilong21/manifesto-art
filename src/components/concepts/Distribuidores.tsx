import Image from "next/image";

/** Tiendas que venden MANIFESTO (los mismos logotipos, con su ciudad, de la cinta de la tienda). */
const DISTRIBUIDORES = [
  { archivo: "wolves-pereira", nombre: "Wolves Store", ciudad: "Pereira", ancho: 237 },
  { archivo: "renatus-segovia", nombre: "Renatus", ciudad: "Segovia", ancho: 191 },
  { archivo: "superiority-medellin", nombre: "Superiority", ciudad: "Medellín", ancho: 653 },
  { archivo: "closet-bucaramanga", nombre: "Closet Luxury Brands", ciudad: "Bucaramanga", ancho: 485 },
  { archivo: "magnus-manizales", nombre: "Magnus Clothing", ciudad: "Manizales", ancho: 174 },
  { archivo: "rodca-monteria", nombre: "Rodca", ciudad: "Montería", ancho: 516 },
  { archivo: "unstop-pereira", nombre: "Unstop", ciudad: "Pereira", ancho: 264 },
  { archivo: "coinflip-cali", nombre: "Coinflip", ciudad: "Cali", ancho: 383 },
];

function Tanda({ oculta = false }: { oculta?: boolean }) {
  return (
    <ul className="hm-dist__tanda" aria-hidden={oculta || undefined}>
      {DISTRIBUIDORES.map((d) => (
        <li key={d.archivo}>
          <Image
            src={`/marca/distribuidores/${d.archivo}.png`}
            alt={oculta ? "" : `${d.nombre}, ${d.ciudad}`}
            width={d.ancho}
            height={240}
            sizes="200px"
          />
        </li>
      ))}
    </ul>
  );
}

/** Cinta «Distribuidores oficiales», como la de la tienda: pausa al pasar el cursor y se detiene con movimiento reducido. */
export function Distribuidores() {
  return (
    <section className="hm-dist" aria-labelledby="hm-dist-t">
      <h2 id="hm-dist-t" className="hm-dist__t">Distribuidores oficiales</h2>
      <div className="hm-dist__pista">
        <Tanda />
        <Tanda oculta />
      </div>
    </section>
  );
}
