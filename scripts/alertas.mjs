// Baja las alertas y avisos a corto plazo del Servicio Meteorológico Nacional (feed CAP público) y deja en
// www/data/alertas.json solo las que tocan la Ciudad de Buenos Aires, con sus polígonos.
// Lo corre la acción de GitHub .github/workflows/alertas.yml cada 10 minutos (no usa Claude).
// Uso: node scripts/alertas.mjs [salida.json] [estado.json]
import fs from "node:fs";

const FEED = "https://ssl.smn.gob.ar/CAP/AR.php";
const SALIDA = process.argv[2] || "www/data/alertas.json";
// Cuántas corridas seguidas el SMN no respondió. La acción manda un mail cuando llega a 2 y otro cuando vuelve.
const ESTADO = process.argv[3] || "tareas/smn-estado.json";
const AVISAR_CON = 2;
const UA = "CortesCABA/1.4 (+https://github.com/Cygosc/eventos-velez)";

let estado = { fallasSeguidas: 0 };
try { estado = JSON.parse(fs.readFileSync(ESTADO, "utf8")); } catch {}
const guardarEstado = (e) => fs.writeFileSync(ESTADO, JSON.stringify(e, null, 2) + "\n");
// Le pasa a la acción qué mail mandar ("caido" o "volvio") y los datos para armarlo.
function salidaAccion(datos) {
  if (!process.env.GITHUB_OUTPUT) return;
  fs.appendFileSync(process.env.GITHUB_OUTPUT, Object.entries(datos).map(([k, v]) => `${k}=${String(v).replace(/\s+/g, " ")}\n`).join(""));
}
// Rectángulo que contiene a CABA (con un margen chico).
const CABA = { latMin: -34.71, latMax: -34.52, lonMin: -58.54, lonMax: -58.33 };

async function traer(url, intentos = 3) {
  for (let i = 1; ; i++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(20000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.text();
    } catch (e) {
      if (i >= intentos) throw new Error(`${url}: ${e.message}`);
      await new Promise((ok) => setTimeout(ok, 5000 * i)); // 5, 10, 15 y 20 segundos
    }
  }
}

const decodificar = (s) => (s || "")
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
  .replace(/\s+/g, " ").trim();
// Lee una etiqueta con o sin el prefijo "cap:".
const tag = (xml, nombre) => decodificar(xml.match(new RegExp(`<(?:cap:)?${nombre}>([\\s\\S]*?)</(?:cap:)?${nombre}>`))?.[1]);
const todas = (xml, nombre) => [...xml.matchAll(new RegExp(`<(?:cap:)?${nombre}>([\\s\\S]*?)</(?:cap:)?${nombre}>`, "g"))].map((m) => m[1]);

function dentro([lat, lon], poli) {
  let adentro = false;
  for (let i = 0, j = poli.length - 1; i < poli.length; j = i++) {
    const [yi, xi] = poli[i], [yj, xj] = poli[j];
    if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) adentro = !adentro;
  }
  return adentro;
}
const enCaba = ([lat, lon]) => lat >= CABA.latMin && lat <= CABA.latMax && lon >= CABA.lonMin && lon <= CABA.lonMax;
// El polígono toca CABA si tiene un vértice adentro o si contiene algún punto de una grilla sobre CABA.
function tocaCaba(poli) {
  if (poli.some(enCaba)) return true;
  for (let i = 0; i <= 6; i++) for (let j = 0; j <= 6; j++) {
    const p = [CABA.latMin + ((CABA.latMax - CABA.latMin) * i) / 6, CABA.lonMin + ((CABA.lonMax - CABA.lonMin) * j) / 6];
    if (dentro(p, poli)) return true;
  }
  return false;
}

function nivelDe(texto, severidad) {
  const t = texto.toUpperCase();
  if (/\bROJ[OA]\b/.test(t)) return "rojo";
  if (/\bNARANJA\b/.test(t)) return "naranja";
  if (/\bAMARILL[OA]\b/.test(t)) return "amarillo";
  return { Extreme: "rojo", Severe: "naranja", Moderate: "amarillo" }[severidad] || "amarillo";
}

function leerCap(xml, url) {
  if (tag(xml, "status") !== "Actual" || tag(xml, "msgType") === "Cancel") return null;
  const info = todas(xml, "info")[0];
  if (!info) return null;
  const poligonos = todas(info, "polygon")
    .map((p) => decodificar(p).split(" ").map((par) => par.split(",").map(Number)).filter((c) => c.length === 2 && c.every(Number.isFinite)))
    .filter((p) => p.length >= 3);
  const areas = todas(info, "areaDesc").map(decodificar).join(" ");
  const nombraCaba = /CAPITAL FEDERAL|CIUDAD AUT[OÓ]NOMA|C\.A\.B\.A|\bCABA\b/i.test(areas);
  const enLaCiudad = poligonos.filter(tocaCaba);
  if (!enLaCiudad.length && !nombraCaba) return null;
  const evento = tag(info, "event"), titulo = tag(info, "headline") || evento;
  const corto = url.includes("avisocortoplazo");
  return {
    evento: evento.charAt(0).toUpperCase() + evento.slice(1).toLowerCase(),
    nivel: nivelDe(`${titulo} ${evento}`, tag(info, "severity")),
    titulo, corto,
    descripcion: tag(info, "description"),
    instruccion: tag(info, "instruction"),
    desde: tag(info, "onset") || tag(xml, "sent"),
    hasta: tag(info, "expires"),
    poligonos: (enLaCiudad.length ? enLaCiudad : poligonos).map((p) => p.map(([la, lo]) => [+la.toFixed(3), +lo.toFixed(3)])),
    web: corto ? "https://www.smn.gob.ar/alertas/acp" : "https://www.smn.gob.ar/alertas",
  };
}

// El SMN a veces no responde (HTTP 503) por un rato. Si después de varios intentos sigue caído, se dejan las alertas
// que ya había y la acción termina con una advertencia en lugar de un error: la próxima corrida vuelve a probar. Las
// caídas se cuentan en ESTADO; a la segunda seguida la acción manda un mail (y otro cuando el SMN vuelve).
let feed, links;
try {
  feed = await traer(FEED, 5);
  links = [...new Set(todas(feed, "link").map(decodificar).filter((l) => /\/feeds\/CAP\/.+\.xml$/.test(l)))];
  if (!feed.includes("<rss") && !feed.includes("<feed")) throw new Error("la respuesta no es el feed de alertas");
} catch (e) {
  const n = (estado.fallasSeguidas || 0) + 1;
  guardarEstado({ fallasSeguidas: n, desde: estado.desde || new Date().toISOString(), error: e.message });
  console.log(`::warning::El SMN no respondió (${e.message}), ${n} ${n === 1 ? "vez" : "veces seguidas"}. Quedan las alertas de la corrida anterior.`);
  if (n === AVISAR_CON) salidaAccion({ aviso: "caido", fallas: n, desde: estado.desde || "", error: e.message });
  process.exit(0);
}
if (estado.fallasSeguidas) {
  if (estado.fallasSeguidas >= AVISAR_CON) salidaAccion({ aviso: "volvio", fallas: estado.fallasSeguidas, desde: estado.desde || "" });
  guardarEstado({ fallasSeguidas: 0 });
}
const ahora = Date.now();
const encontradas = [];
// De a 6 por vez para no cargar al servidor del SMN.
for (let i = 0; i < links.length; i += 6) {
  const lote = await Promise.all(links.slice(i, i + 6).map(async (url) => {
    try { return leerCap(await traer(url), url); } catch (e) { console.error("No pude leer", e.message); return null; }
  }));
  encontradas.push(...lote.filter(Boolean));
}

// El SMN publica una alerta en varios archivos (uno por zona): se juntan los polígonos de la misma alerta.
const porClave = new Map();
for (const a of encontradas) {
  if (a.hasta && Date.parse(a.hasta) < ahora) continue;
  const clave = [a.evento, a.nivel, a.desde, a.hasta, a.corto].join("|");
  const previa = porClave.get(clave);
  if (previa) previa.poligonos.push(...a.poligonos);
  else porClave.set(clave, a);
}
const alertas = [...porClave.values()]
  .map((a) => ({ id: `${a.corto ? "acp" : "al"}-${a.evento}-${a.nivel}-${a.desde}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"), ...a }))
  .sort((a, b) => ["rojo", "naranja", "amarillo"].indexOf(a.nivel) - ["rojo", "naranja", "amarillo"].indexOf(b.nivel) || a.desde.localeCompare(b.desde));

// "actualizado" solo cambia si cambian las alertas: así la acción no hace un commit cada 10 minutos.
let anterior = null;
try { anterior = JSON.parse(fs.readFileSync(SALIDA, "utf8")); } catch {}
const iguales = anterior && JSON.stringify(anterior.alertas) === JSON.stringify(alertas);
const datos = { actualizado: iguales ? anterior.actualizado : new Date().toISOString(), fuente: "Servicio Meteorológico Nacional", alertas };
fs.writeFileSync(SALIDA, JSON.stringify(datos, null, 2) + "\n");
console.log(`${links.length} archivos del SMN, ${alertas.length} alertas en CABA${iguales ? " (sin cambios)" : ""}`);
for (const a of alertas) console.log(`- ${a.nivel} ${a.evento}${a.corto ? " (corto plazo)" : ""}: ${a.desde} → ${a.hasta}`);
