import { NX, NZ, RADIO, SEMIEJE, type Escultura, type V3 } from "./gravedadFisica";
import { LUZ_POS, matrizCamara, proyectar, type Lienzo, type Vista } from "./gravedadGL";

/**
 * Alternativa sin WebGL2: la misma simulación dibujada en 2D. La tela son sus celdas proyectadas
 * y ordenadas de lejos a cerca, con una luz difusa; la carga se intercala por distancia y las
 * cuerdas son líneas que se apagan al subir. Sin sombras ni haz, pero todo responde igual.
 */
export function crearPlano(canvas: HTMLCanvasElement): Lienzo | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  let escala = 1;
  const celdas = (NX - 1) * (NZ - 1);
  const orden = new Int32Array(celdas);
  const fondo = new Float32Array(celdas);
  const xy = new Float32Array(NX * NZ * 2);
  const l = Math.hypot(...LUZ_POS);
  const L: V3 = [LUZ_POS[0] / l, LUZ_POS[1] / l, LUZ_POS[2] / l];

  return {
    medir(e) {
      escala = Math.min(2, e);
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * escala));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * escala));
    },
    pintar(e: Escultura, vista: Vista) {
      const w = canvas.width, h = canvas.height;
      const { vp } = matrizCamara(vista, w / Math.max(1, h));
      const g = ctx.createRadialGradient(w * 0.45, h * 0.42, 0, w * 0.45, h * 0.42, Math.max(w, h) * 0.75);
      g.addColorStop(0, "#1c1611");
      g.addColorStop(1, "#050302");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      const ojo = vista.ojo;
      const dist2 = (p: V3) => (p[0] - ojo[0]) ** 2 + (p[1] - ojo[1]) ** 2 + (p[2] - ojo[2]) ** 2;
      for (let k = 0; k < NX * NZ; k++) {
        const [x, y] = proyectar(vp, [e.p[k * 3], e.p[k * 3 + 1], e.p[k * 3 + 2]], w, h);
        xy[k * 2] = x;
        xy[k * 2 + 1] = y;
      }
      for (let j = 0, c = 0; j < NZ - 1; j++)
        for (let i = 0; i < NX - 1; i++, c++) {
          const k = (j * NX + i + NX + 1) * 3;
          fondo[c] = dist2([(e.p[(j * NX + i) * 3] + e.p[k]) / 2, (e.p[(j * NX + i) * 3 + 1] + e.p[k + 1]) / 2, (e.p[(j * NX + i) * 3 + 2] + e.p[k + 2]) / 2]);
          orden[c] = c;
        }
      orden.sort((a, b) => fondo[b] - fondo[a]);

      const { centro, eje } = e.carga3();
      const dCarga = dist2(centro);
      let cargaHecha = false;
      const dibujarCarga = () => {
        const m = 0.5 * (1 + RADIO / SEMIEJE) * 0.83;
        const p1 = proyectar(vp, [centro[0] - eje[0] * m, centro[1] - eje[1] * m, centro[2] - eje[2] * m], w, h);
        const p2 = proyectar(vp, [centro[0] + eje[0] * m, centro[1] + eje[1] * m, centro[2] + eje[2] * m], w, h);
        const pc = proyectar(vp, centro, w, h), pr = proyectar(vp, [centro[0], centro[1] + RADIO, centro[2]], w, h);
        const rad = Math.max(2, Math.abs(pc[1] - pr[1]));
        ctx.save();
        const gb = ctx.createLinearGradient(pc[0], pc[1] - rad, pc[0], pc[1] + rad);
        gb.addColorStop(0, "#c99560");
        gb.addColorStop(0.45, "#6b4a2a");
        gb.addColorStop(1, "#22170e");
        ctx.strokeStyle = gb;
        ctx.lineCap = "round";
        ctx.lineWidth = rad * 1.9;
        ctx.beginPath();
        ctx.moveTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
        ctx.stroke();
        ctx.restore();
      };

      ctx.lineWidth = 0.6 * escala;
      for (let o = 0; o < celdas; o++) {
        const c = orden[o];
        if (!cargaHecha && fondo[c] < dCarga) {
          dibujarCarga();
          cargaHecha = true;
        }
        const i = c % (NX - 1), j = Math.floor(c / (NX - 1));
        const a = j * NX + i, b = a + 1, d = a + NX, f = d + 1;
        // Normal de la celda por sus diagonales, del lado que mira a la cámara; luz envolvente
        const P = e.p;
        const ux = P[f * 3] - P[a * 3], uy = P[f * 3 + 1] - P[a * 3 + 1], uz = P[f * 3 + 2] - P[a * 3 + 2];
        const vx = P[d * 3] - P[b * 3], vy = P[d * 3 + 1] - P[b * 3 + 1], vz = P[d * 3 + 2] - P[b * 3 + 2];
        let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
        const nl = Math.hypot(nx, ny, nz) || 1;
        if ((ojo[0] - P[a * 3]) * nx + (ojo[1] - P[a * 3 + 1]) * ny + (ojo[2] - P[a * 3 + 2]) * nz < 0) [nx, ny, nz] = [-nx, -ny, -nz];
        const luz = 0.5 + 0.5 * ((nx * L[0] + ny * L[1] + nz * L[2]) / nl);
        const v = 0.16 + 0.84 * luz * luz;
        ctx.fillStyle = ctx.strokeStyle = `rgb(${Math.round(245 * v)},${Math.round(232 * v)},${Math.round(208 * v)})`;
        ctx.beginPath();
        ctx.moveTo(xy[a * 2], xy[a * 2 + 1]);
        ctx.lineTo(xy[b * 2], xy[b * 2 + 1]);
        ctx.lineTo(xy[f * 2], xy[f * 2 + 1]);
        ctx.lineTo(xy[d * 2], xy[d * 2 + 1]);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      if (!cargaHecha) dibujarCarga();

      // Cuerdas y anillos
      ctx.lineCap = "butt";
      for (const c of e.cuerdas) {
        const E = c.suelta ? c.e : e.punto(c.idx);
        const a = proyectar(vp, E, w, h), b = proyectar(vp, c.ancla, w, h);
        const gc = ctx.createLinearGradient(a[0], a[1], b[0], b[1]);
        gc.addColorStop(0, "rgba(214,196,168,0.75)");
        gc.addColorStop(0.6, "rgba(214,196,168,0)");
        ctx.strokeStyle = gc;
        ctx.lineWidth = 1.3 * escala;
        ctx.beginPath();
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
        ctx.stroke();
        ctx.strokeStyle = "#a8794a";
        ctx.lineWidth = 1.5 * escala;
        ctx.beginPath();
        ctx.arc(a[0], a[1], 3.2 * escala, 0, Math.PI * 2);
        ctx.stroke();
      }
    },
    liberar() {},
  };
}
