// ===================== Configuración =====================
const CABA = { lat: -34.6118, lon: -58.4173 };
// Torneos donde pueden jugar de local los equipos porteños. Si alguno falla, se ignora.
const LIGAS_ESPN = ["arg.1", "arg.2", "arg.copa", "conmebol.libertadores", "conmebol.sudamericana"];
const DIAS_A_MOSTRAR = 60;
// Datos publicados en GitHub (los actualiza la tarea programada). Sin internet se usa la última copia guardada.
const DATOS_URL = "https://raw.githubusercontent.com/Cygosc/eventos-velez/main/www/data/";

// Publicidad: un solo banner chico fijo abajo (AdMob). Nada de anuncios a pantalla completa.
// Mientras "prueba" sea true se usan los IDs de prueba de Google (muestran "Test Ad").
// Para publicar: poner el ID real del bloque de anuncios, "prueba: false" y el ID de la app en
// android/app/src/main/res/values/strings.xml (admob_app_id).
const ANUNCIOS = {
  prueba: false,
  bannerId: "ca-app-pub-7512587545135575/2905026519", // bloque "Banner inferior" de Cortes CABA
};
// Aportes voluntarios. Vacío = no se muestra el botón. Ej.: "https://cafecito.app/tu_usuario"
const CAFECITO_URL = "https://cafecito.app/xibo3d";

const TIPOS = {
  partido: { icono: "⚽", nombre: "Partidos", color: "#3b82f6" },
  recital: { icono: "🎤", nombre: "Recitales", color: "#a855f7" },
  marcha: { icono: "📣", nombre: "Marchas", color: "#ff4d6d" },
  corte: { icono: "🚧", nombre: "Cortes y obras", color: "#ff9f1c" },
  evento: { icono: "📌", nombre: "Otros eventos", color: "#12b5a6" },
};

// ===================== Utilidades =====================
const $ = (s) => document.querySelector(s);
const guardar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const leer = (k, def) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } };
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const TZ = "America/Argentina/Buenos_Aires";
const fmtDia = new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long", timeZone: TZ });
const fmtHora = new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: TZ });
const fmtCorto = new Intl.DateTimeFormat("es-AR", { weekday: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: TZ });

// Medianoche de Buenos Aires (UTC-3 fijo, sin horario de verano).
function inicioDiaBA(fecha) {
  const ba = new Date(fecha.getTime() - 3 * 3600e3);
  return new Date(Date.UTC(ba.getUTCFullYear(), ba.getUTCMonth(), ba.getUTCDate()) + 3 * 3600e3);
}
const horas = (n) => n * 3600e3;

function metros(a, b) {
  return Math.hypot((a[0] - b[0]) * 111000, (a[1] - b[1]) * 92000);
}
function distPuntoTramo(p, a, b) {
  const ax = a[1] * 92000, ay = a[0] * 111000, bx = b[1] * 92000, by = b[0] * 111000;
  const px = p[1] * 92000, py = p[0] * 111000;
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
function corteMasCercano(p, tramos) {
  let mejor = null;
  for (const c of tramos) {
    if (c.coords.length === 1) {
      const d = metros(p, c.coords[0]);
      if (!mejor || d < mejor.d) mejor = { d, corte: c };
    }
    for (let i = 1; i < c.coords.length; i++) {
      const d = distPuntoTramo(p, c.coords[i - 1], c.coords[i]);
      if (!mejor || d < mejor.d) mejor = { d, corte: c };
    }
  }
  return mejor;
}

// ===================== Datos =====================
let LUGARES = {};

// Orden: GitHub (lo más nuevo) → copia guardada en el dispositivo → copia incluida en la app.
async function traerJSON(nombre) {
  try {
    const r = await fetch(DATOS_URL + nombre + "?t=" + Date.now(), { cache: "no-store" });
    if (!r.ok) throw new Error(r.status);
    const d = await r.json();
    guardar("datos-" + nombre, d);
    return { datos: d, origen: "internet" };
  } catch {
    const cache = leer("datos-" + nombre, null);
    if (cache) return { datos: cache, origen: "guardado" };
    const r = await fetch("data/" + nombre);
    return { datos: await r.json(), origen: "incluido" };
  }
}

async function cargarDatos() {
  const [ev, lu] = await Promise.all([traerJSON("eventos-caba.json"), traerJSON("lugares.json")]);
  LUGARES = Object.fromEntries((lu.datos.lugares || []).map((l) => [l.id, l]));
  return ev.datos.eventos || [];
}

async function traerPartidos() {
  const equipos = {};
  for (const l of Object.values(LUGARES)) for (const id of l.equiposEspn || []) equipos[id] = l.id;
  const pedidos = [];
  for (const liga of LIGAS_ESPN) {
    for (const id of Object.keys(equipos)) {
      pedidos.push(fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${liga}/teams/${id}/schedule?fixture=true`)
        .then((r) => (r.ok ? r.json() : { events: [] }))
        .then((d) => ({ d, id }))
        .catch(() => null));
    }
  }
  const res = (await Promise.all(pedidos)).filter(Boolean);
  if (!res.length) {
    const cache = leer("partidos", null);
    return { partidos: cache?.partidos || [], error: true, cacheFecha: cache?.fecha };
  }
  const vistos = new Set();
  const partidos = [];
  for (const { d, id } of res) {
    for (const e of d.events || []) {
      const comp = e.competitions?.[0];
      const local = comp?.competitors?.find((c) => c.homeAway === "home");
      const visita = comp?.competitors?.find((c) => c.homeAway === "away");
      if (!local || local.team?.id !== id || comp.neutralSite || vistos.has(e.id)) continue;
      vistos.add(e.id);
      const nombre = (t) => t?.team?.shortDisplayName?.trim() || t?.team?.displayName || "a definir";
      partidos.push({
        id: "espn-" + e.id,
        titulo: `${nombre(local)} vs ${nombre(visita)}`,
        tipo: "partido",
        lugar: equipos[id],
        inicio: e.date,
        horaConfirmada: e.timeValid !== false,
        confirmado: true,
        fuente: `https://www.espn.com.ar/futbol/partido/_/juegoId/${e.id}`,
        notas: e.seasonType?.name || "",
      });
    }
  }
  guardar("partidos", { partidos, fecha: new Date().toISOString() });
  return { partidos, error: false };
}

// Ventana de cortes por defecto según el tipo de evento y el lugar.
function ventanaCortes(ev, lugar) {
  if (ev.cortes?.desde) return { desde: new Date(ev.cortes.desde), hasta: new Date(ev.cortes.hasta), estimado: false };
  const dia = inicioDiaBA(ev.inicio);
  const fin = ev.fin ? new Date(ev.fin) : null;
  const grande = !lugar || ["estadio", "predio"].includes(lugar.tipo);
  switch (ev.tipo) {
    case "recital":
    case "evento":
      // 13:00 a 04:00 es el horario que publica la Ciudad para los recitales en Vélez; en otros lugares es una estimación.
      if (grande) return { desde: new Date(dia.getTime() + horas(13)), hasta: new Date(dia.getTime() + horas(28)), estimado: !(ev.tipo === "recital" && lugar?.id === "velez") };
      return { desde: new Date(ev.inicio - horas(3)), hasta: fin || new Date(+ev.inicio + horas(4)), estimado: true };
    case "partido":
      if (!ev.horaConfirmada) return { desde: new Date(dia.getTime() + horas(10)), hasta: new Date(dia.getTime() + horas(24)), estimado: true };
      return { desde: new Date(ev.inicio - horas(3)), hasta: new Date(+ev.inicio + horas(2.5)), estimado: true };
    case "marcha":
      return { desde: new Date(ev.inicio - horas(1)), hasta: fin || new Date(+ev.inicio + horas(5)), estimado: !fin };
    case "corte":
      return { desde: ev.inicio, hasta: fin || new Date(+ev.inicio + horas(12)), estimado: !fin };
    default:
      return { desde: new Date(ev.inicio - horas(3)), hasta: fin || new Date(+ev.inicio + horas(5)), estimado: true };
  }
}

function normalizar(ev) {
  const e = { ...ev, inicio: new Date(ev.inicio) };
  e.tipo = TIPOS[e.tipo] ? e.tipo : "evento";
  e.lugarObj = e.lugar ? LUGARES[e.lugar] : null;
  // Tramos: los del evento (operativo publicado) o el perímetro del lugar.
  e.tramos = e.tramos?.length ? e.tramos : e.lugarObj?.cortes || [];
  e.tramosOficiales = !!ev.tramos?.length || (e.lugarObj && !String(e.lugarObj.cortesFuente || "").startsWith("Estimado"));
  // Punto de referencia del evento.
  if (e.ubicacion) e.punto = [e.ubicacion.lat, e.ubicacion.lon];
  else if (e.lugarObj) e.punto = [e.lugarObj.lat, e.lugarObj.lon];
  else if (e.tramos.length) e.punto = e.tramos[0].coords[0];
  e.donde = e.ubicacion?.nombre || e.lugarObj?.nombre || "";
  e.barrio = e.ubicacion?.barrio || e.lugarObj?.barrio || "";
  e.ventana = ventanaCortes(e, e.lugarObj);
  return e;
}

// Distancia de mi casa al evento: al tramo cortado más cercano, o al lugar.
function distanciaACasa(ev, casa) {
  if (!casa) return null;
  if (ev.tramos.length) return corteMasCercano(casa, ev.tramos).d;
  return ev.punto ? metros(casa, ev.punto) : null;
}

// ===================== Mapa =====================
// Alto del mapa en el celular: se fija en píxeles al abrir y solo cambia si cambia el ancho
// (al abrir el teclado cambia el alto de la ventana y no queremos que el mapa salte).
let anchoPrevio = 0;
function fijarAltoMapa() {
  if (window.innerWidth === anchoPrevio) return;
  anchoPrevio = window.innerWidth;
  document.documentElement.style.setProperty("--alto-mapa", Math.round(Math.max(window.innerHeight, 500) * 0.5) + "px");
}
fijarAltoMapa();
window.addEventListener("resize", fijarAltoMapa);

const mapa = L.map("mapa", { zoomControl: true }).setView([CABA.lat, CABA.lon], 12);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(mapa);

const capaMarcadores = L.layerGroup().addTo(mapa);
const capaCortes = L.layerGroup().addTo(mapa);
let marcadorCasa = null, circuloRadio = null;

const leyenda = L.control({ position: "bottomleft" });
leyenda.onAdd = () => {
  const div = L.DomUtil.create("div", "leyenda");
  div.innerHTML =
    '<div><i style="border-top:5px solid #ef233c"></i>Calle cerrada</div>' +
    '<div><i style="border-top:4px dashed #ff9f1c"></i>Corte parcial</div>' +
    '<div><i style="border-top:4px dotted #ef233c"></i>Estimado (alrededor del lugar)</div>';
  return div;
};
leyenda.addTo(mapa);

function iconoEvento(ev, sel) {
  const t = TIPOS[ev.tipo];
  return L.divIcon({
    className: "pin-evento",
    html: `<div class="pin ${sel ? "sel" : ""}" style="background:${t.color}">${t.icono}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

function dibujarMarcadores(eventos) {
  capaMarcadores.clearLayers();
  for (const ev of eventos) {
    if (!ev.punto) continue;
    L.marker(ev.punto, { icon: iconoEvento(ev, ev === seleccionado), zIndexOffset: ev === seleccionado ? 1000 : 0 })
      .bindTooltip(`${esc(ev.titulo)}<br>${fmtCorto.format(ev.inicio)}`)
      .on("click", () => seleccionar(ev, true))
      .addTo(capaMarcadores);
  }
}

function dibujarCortes(ev, centrar) {
  capaCortes.clearLayers();
  if (!ev) return;
  const capas = [];
  for (const c of ev.tramos) {
    const total = c.tipo === "total";
    const estimado = c.tipo === "estimado";
    const l = L.polyline(c.coords, {
      color: total || estimado ? "#ef233c" : "#ff9f1c",
      weight: total ? 7 : 5,
      opacity: estimado ? 0.75 : 0.9,
      dashArray: total ? null : estimado ? "2 8" : "8 8",
      lineCap: estimado ? "round" : "butt",
    }).bindTooltip(`<b>${esc(c.calle)}</b><br>${esc(c.tramo)}`, { sticky: true });
    l.addTo(capaCortes);
    capas.push(l);
  }
  if (centrar) {
    if (capas.length) mapa.fitBounds(L.featureGroup(capas).getBounds().pad(0.4), { maxZoom: 16 });
    else if (ev.punto) mapa.setView(ev.punto, 15);
  }
}

// ===================== Punto de referencia: mi casa, dónde estoy o una dirección =====================
// La casa queda guardada en el dispositivo. "Dónde estoy" y una dirección buscada son temporales:
// cambian la lista, el radio y el mapa, pero los avisos siempre se calculan con la casa.
let referencia = null; // { tipo: "gps" | "direccion", lat, lon, nombre, precision }
let marcadorRef = null;
const NOMBRE_REF = { casa: "tu casa", gps: "donde estás", direccion: "esa dirección", zona: "ese punto" };
const ICONO_REF = { gps: "📡", direccion: "🔎", zona: "👆" };

function puntoActivo() {
  if (referencia) return { tipo: referencia.tipo, punto: [referencia.lat, referencia.lon] };
  const casa = leer("casa", null);
  return casa ? { tipo: "casa", punto: casa } : null;
}

function fijarReferencia(ref) {
  referencia = ref;
  // Si estaba en "toda CABA", al elegir un punto conviene ver lo cercano.
  if (Number(leer("radio", 3000)) === 0) guardar("radio", 1000);
  $("#resultados").innerHTML = "";
  const chip = $("#referencia");
  chip.hidden = false;
  chip.innerHTML = `${ICONO_REF[ref.tipo]} Cortes cerca de <b>${esc(ref.nombre)}</b>
    <button type="button" id="quitar-ref" aria-label="Quitar">✕</button>`;
  $("#quitar-ref").addEventListener("click", quitarReferencia);
  // Al mantener presionado no se mueve el mapa (el usuario ya está mirando esa zona).
  if (ref.tipo !== "zona") mapa.setView([ref.lat, ref.lon], 15);
  refrescar();
}

function quitarReferencia() {
  referencia = null;
  $("#referencia").hidden = true;
  $("#direccion").value = "";
  const casa = leer("casa", null);
  if (casa) mapa.setView(casa, 14); else mapa.setView([CABA.lat, CABA.lon], 12);
  refrescar();
}

// --- Dónde estoy (GPS) ---
const GEO = window.Capacitor?.isNativePlatform?.() ? window.Capacitor.Plugins.Geolocation : null;

async function obtenerPosicion() {
  if (GEO) {
    let p = await GEO.checkPermissions();
    if (p.location !== "granted" && p.coarseLocation !== "granted") p = await GEO.requestPermissions();
    if (p.location !== "granted" && p.coarseLocation !== "granted") throw new Error("permiso");
    return GEO.getCurrentPosition({ enableHighAccuracy: true, timeout: 20000, maximumAge: 30000 });
  }
  if (!navigator.geolocation) throw new Error("sin gps");
  return new Promise((ok, mal) =>
    navigator.geolocation.getCurrentPosition(ok, (e) => mal(new Error(e.code === 1 ? "permiso" : "sin señal")),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 30000 }));
}

const controlUbicacion = L.control({ position: "topright" });
controlUbicacion.onAdd = () => {
  const b = L.DomUtil.create("button", "btn-ubicacion");
  b.type = "button";
  b.title = "Dónde estoy";
  b.setAttribute("aria-label", "Mostrar dónde estoy");
  b.textContent = "📡";
  L.DomEvent.disableClickPropagation(b);
  b.addEventListener("click", async () => {
    b.classList.add("buscando");
    try {
      const pos = await obtenerPosicion();
      fijarReferencia({ tipo: "gps", lat: pos.coords.latitude, lon: pos.coords.longitude, nombre: "donde estás", precision: pos.coords.accuracy });
    } catch (e) {
      alert(e.message === "permiso"
        ? "Para ver dónde estás, permití el acceso a la ubicación en la configuración del celular."
        : "No se pudo obtener tu ubicación. Revisá que el GPS esté activado.");
    } finally {
      b.classList.remove("buscando");
    }
  });
  return b;
};
controlUbicacion.addTo(mapa);

// --- Buscar una dirección (OpenStreetMap / Nominatim, limitado a CABA) ---
const CABA_CAJA = "-58.5315,-34.5265,-58.3351,-34.7051";

async function geocodificar(texto, acotado) {
  const params = new URLSearchParams({ q: texto, format: "json", limit: "5", countrycodes: "ar", "accept-language": "es" });
  if (acotado) { params.set("viewbox", CABA_CAJA); params.set("bounded", "1"); }
  const r = await fetch("https://nominatim.openstreetmap.org/search?" + params);
  if (!r.ok) throw new Error(r.status);
  return r.json();
}

function nombreCorto(r) {
  return r.display_name.split(",").slice(0, 3).join(",").trim();
}

$("#buscador").addEventListener("submit", async (e) => {
  e.preventDefault();
  const texto = $("#direccion").value.trim();
  const ul = $("#resultados");
  if (!texto) return;
  $("#direccion").blur(); // cierra el teclado
  ul.innerHTML = '<li class="vacio">Buscando…</li>';
  try {
    let res = await geocodificar(texto, true);
    if (!res.length) res = await geocodificar(texto + ", Ciudad Autónoma de Buenos Aires", false);
    if (!res.length) { ul.innerHTML = '<li class="vacio">No encontré esa dirección. Probá con "calle número" o una esquina ("Corrientes y Callao").</li>'; return; }
    const elegir = (r) => fijarReferencia({ tipo: "direccion", lat: Number(r.lat), lon: Number(r.lon), nombre: nombreCorto(r) });
    if (res.length === 1) { elegir(res[0]); return; }
    ul.innerHTML = "";
    for (const r of res) {
      const li = document.createElement("li");
      li.textContent = nombreCorto(r);
      li.addEventListener("click", () => elegir(r));
      ul.appendChild(li);
    }
  } catch {
    ul.innerHTML = '<li class="vacio">No se pudo buscar la dirección (¿sin internet?).</li>';
  }
});

// --- Mantener presionado el mapa: ver los cortes alrededor de ese punto ---
// En el celular Leaflet convierte la pulsación larga en "contextmenu"; en la PC es el clic derecho.
mapa.on("contextmenu", (e) => {
  if (modoCasa) return;
  if (navigator.vibrate) navigator.vibrate(30);
  fijarReferencia({ tipo: "zona", lat: e.latlng.lat, lon: e.latlng.lng, nombre: "el punto marcado" });
  // Se busca el nombre de la calle para mostrarlo (si falla, queda "el punto marcado").
  const params = new URLSearchParams({ lat: e.latlng.lat, lon: e.latlng.lng, format: "json", zoom: "17", "accept-language": "es" });
  fetch("https://nominatim.openstreetmap.org/reverse?" + params)
    .then((r) => (r.ok ? r.json() : null))
    .then((r) => {
      if (!r?.address || referencia?.lat !== e.latlng.lat) return;
      const a = r.address;
      const calle = [a.road, a.house_number].filter(Boolean).join(" ");
      const nombre = calle ? `${calle}${a.suburb ? ", " + a.suburb : ""}` : a.suburb || "";
      if (!nombre) return;
      referencia.nombre = nombre;
      $("#referencia b").textContent = nombre;
    })
    .catch(() => {});
});

// ===================== Mi casa y radio =====================
let modoCasa = false;
$("#btn-casa").addEventListener("click", () => {
  modoCasa = !modoCasa;
  $("#btn-casa").classList.toggle("activo", modoCasa);
  $("#btn-casa").textContent = modoCasa ? "Tocá tu casa en el mapa…" : leer("casa", null) ? "📍 Cambiar mi casa" : "📍 Marcar mi casa";
  mapa.getContainer().style.cursor = modoCasa ? "crosshair" : "";
});
mapa.on("click", (e) => {
  if (!modoCasa) return;
  modoCasa = false;
  $("#btn-casa").classList.remove("activo");
  mapa.getContainer().style.cursor = "";
  guardar("casa", [e.latlng.lat, e.latlng.lng]);
  if (leer("radio", null) === null) { guardar("radio", 3000); $("#radio").value = "3000"; }
  refrescar();
});

function radioActual() {
  return puntoActivo() ? Number(leer("radio", 3000)) : 0;
}
$("#radio").addEventListener("change", (e) => {
  guardar("radio", Number(e.target.value));
  refrescar();
});

function mostrarReferencia(eventos) {
  const casa = leer("casa", null);
  const activo = puntoActivo();
  const info = $("#info-casa");
  const sel = $("#radio");
  sel.disabled = !activo;
  sel.options[0].textContent = `a 1 km de ${NOMBRE_REF[activo?.tipo || "casa"]}`;
  sel.options[1].textContent = `a 3 km de ${NOMBRE_REF[activo?.tipo || "casa"]}`;
  sel.options[2].textContent = `a 6 km de ${NOMBRE_REF[activo?.tipo || "casa"]}`;
  sel.value = String(radioActual());
  for (const m of [marcadorCasa, circuloRadio, marcadorRef]) if (m) m.remove();
  marcadorCasa = circuloRadio = marcadorRef = null;

  if (casa) {
    $("#btn-casa").textContent = "📍 Cambiar mi casa";
    marcadorCasa = L.circleMarker(casa, { radius: 9, color: "#ffffff", fillColor: "#6d4aff", fillOpacity: 1, weight: 3 })
      .addTo(mapa).bindTooltip("Mi casa");
  }
  if (referencia) {
    const p = [referencia.lat, referencia.lon];
    marcadorRef = referencia.tipo === "gps"
      ? L.layerGroup([
          L.circle(p, { radius: Math.min(referencia.precision || 30, 300), color: "#1a73e8", weight: 1, fillOpacity: 0.12, interactive: false }),
          L.circleMarker(p, { radius: 8, color: "#fff", fillColor: "#1a73e8", fillOpacity: 1, weight: 3 }).bindTooltip("Estás acá"),
        ])
      : L.marker(p, { title: referencia.nombre }).bindTooltip(esc(referencia.nombre));
    marcadorRef.addTo(mapa);
  }
  const r = radioActual();
  if (activo && r) circuloRadio = L.circle(activo.punto, { radius: r, color: "#6d4aff", weight: 1.5, dashArray: "6 6", fillColor: "#a04bff", fillOpacity: 0.06, interactive: false }).addTo(mapa);

  if (!activo) {
    info.classList.remove("afectada");
    info.textContent = "Marcá tu casa, buscá una dirección, tocá 📡 o mantené presionado el mapa para ver lo que pasa cerca.";
    return;
  }
  const nombre = NOMBRE_REF[activo.tipo];
  const ahora = Date.now();
  const cerca = eventos.filter((e) => e.dist !== null && e.dist < 300);
  const ya = cerca.filter((e) => e.ventana.desde <= ahora);
  info.classList.toggle("afectada", cerca.length > 0);
  info.innerHTML = cerca.length
    ? `🚧 ${ya.length ? `Ahora hay cortes a menos de 300 m de ${nombre}: ` : `${cerca.length === 1 ? "Un evento va a cortar" : cerca.length + " eventos van a cortar"} calles a menos de 300 m de ${nombre}: `}` +
      (ya.length ? ya : cerca).map((e) => `<b>${esc(e.titulo)}</b> (${fmtCorto.format(e.ventana.desde)})`).join(", ") + "."
    : `Ningún evento próximo corta calles a menos de 300 m de ${nombre}.`;
}

// ===================== Filtros por tipo =====================
function tiposActivos() {
  return leer("tipos", Object.keys(TIPOS));
}
function dibujarFiltros() {
  const activos = tiposActivos();
  $("#tipos").innerHTML = Object.entries(TIPOS)
    .map(([k, t]) => `<button data-tipo="${k}" style="--c:${t.color}" class="chip-filtro ${activos.includes(k) ? "activo" : ""}">${t.icono} ${t.nombre}</button>`)
    .join("");
  $("#tipos").querySelectorAll("button").forEach((b) =>
    b.addEventListener("click", () => {
      const a = new Set(tiposActivos());
      a.has(b.dataset.tipo) ? a.delete(b.dataset.tipo) : a.add(b.dataset.tipo);
      guardar("tipos", [...a]);
      dibujarFiltros();
      refrescar();
    }));
}

// ===================== Avisos =====================
// En la APK: notificaciones nativas programadas (llegan aunque la app esté cerrada).
// En el navegador: Notification API (solo con la página abierta).
const LN = window.Capacitor?.isNativePlatform?.() ? window.Capacitor.Plugins.LocalNotifications : null;

async function permisoAvisos() {
  if (LN) return (await LN.checkPermissions()).display;
  if (!("Notification" in window)) return "no";
  return Notification.permission;
}
async function actualizarBotonAvisos() {
  const b = $("#btn-avisos");
  const p = await permisoAvisos();
  b.classList.toggle("activo", p === "granted");
  if (p === "no") { b.disabled = true; b.textContent = "Avisos no disponibles"; }
  else if (p === "granted") b.textContent = "🔔 Avisos activados";
  else if (p === "denied") b.textContent = "🔕 Avisos bloqueados";
  else b.textContent = "🔔 Activar avisos";
}
$("#btn-avisos").addEventListener("click", async () => {
  if (LN) await LN.requestPermissions();
  else if ("Notification" in window) await Notification.requestPermission();
  await actualizarBotonAvisos();
  avisar(avisables);
});

function idAviso(texto) {
  let h = 0;
  for (const ch of texto) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return Math.abs(h) % 2000000000;
}
function textoAviso(ev) {
  const v = ev.ventana;
  const lugar = ev.donde ? ` (${ev.donde})` : "";
  return `${fmtDia.format(ev.inicio)}${lugar}. Cortes ${fmtCorto.format(v.desde)} a ${fmtCorto.format(v.hasta)}${v.estimado ? " (estimado)" : ""}.`;
}

async function programarAvisosNativos(eventos) {
  if ((await LN.checkPermissions()).display !== "granted") return;
  const pendientes = await LN.getPending();
  if (pendientes.notifications.length) await LN.cancel({ notifications: pendientes.notifications.map((n) => ({ id: n.id })) });
  const ahora = Date.now();
  const lista = [];
  for (const ev of eventos) {
    const v = ev.ventana;
    // El día anterior a las 20:00 y 2 horas antes de que empiecen los cortes.
    const diaAntes = new Date(inicioDiaBA(v.desde).getTime() - horas(4));
    for (const [cuando, titulo] of [[diaAntes, `Mañana: ${ev.titulo}`], [new Date(v.desde - horas(2)), `Hoy cortan calles: ${ev.titulo}`]]) {
      if (cuando.getTime() <= ahora) continue;
      lista.push({ id: idAviso(ev.id + cuando.toISOString()), title: titulo, body: textoAviso(ev), schedule: { at: cuando, allowWhileIdle: true } });
    }
  }
  // Android limita la cantidad de alarmas por app: se programan las 40 más próximas.
  lista.sort((a, b) => a.schedule.at - b.schedule.at);
  if (lista.length) await LN.schedule({ notifications: lista.slice(0, 40) });
}

function avisar(eventos) {
  if (LN) { programarAvisosNativos(eventos).catch(console.error); return; }
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const yaAvisados = leer("avisados", []);
  const ahora = Date.now();
  for (const ev of eventos) {
    const falta = ev.ventana.desde - ahora;
    if (falta > horas(36) || ev.ventana.hasta < ahora || yaAvisados.includes(ev.id)) continue;
    new Notification(`${TIPOS[ev.tipo].icono} ${ev.titulo}`, { body: textoAviso(ev), tag: ev.id });
    yaAvisados.push(ev.id);
  }
  guardar("avisados", yaAvisados.slice(-100));
}

// ===================== Render =====================
let todos = [], visibles = [], avisables = [], seleccionado = null, estadoCarga = {};

function textoVentana(ev) {
  const v = ev.ventana;
  return `${v.estimado ? "Cortes estimados" : "Cortes"}: ${fmtCorto.format(v.desde)} → ${fmtCorto.format(v.hasta)}`;
}
function textoDist(d) {
  if (d === null || d === undefined) return "";
  return d < 1000 ? `${Math.round(d / 10) * 10} m` : `${(d / 1000).toFixed(1).replace(".", ",")} km`;
}

function seleccionar(ev, centrar) {
  seleccionado = ev;
  document.querySelectorAll(".evento").forEach((li) => li.classList.toggle("sel", li.dataset.id === ev?.id));
  dibujarMarcadores(visibles);
  dibujarCortes(ev, centrar);
  const det = $("#detalle");
  if (!ev) { det.innerHTML = "No hay eventos para mostrar con estos filtros."; return; }
  const oficiales = ev.tramos.filter((c) => c.tipo !== "estimado");
  const estimados = ev.tramos.filter((c) => c.tipo === "estimado");
  const callesEst = [...new Set(estimados.map((c) => c.calle))];
  det.innerHTML = `
    <b>${TIPOS[ev.tipo].icono} ${esc(ev.titulo)}</b><br>
    ${ev.donde ? esc(ev.donde) + (ev.barrio ? ` · ${esc(ev.barrio)}` : "") + "<br>" : ""}
    ${fmtDia.format(ev.inicio)}, ${ev.horaConfirmada ? fmtHora.format(ev.inicio) + " h" : "hora a confirmar"}<br>
    ${textoVentana(ev)}
    ${ev.dist !== null ? `<br>A ${textoDist(ev.dist)} de ${NOMBRE_REF[puntoActivo()?.tipo || "casa"]}.` : ""}
    ${oficiales.length ? `<ul>${oficiales.map((c) => `<li><b>${esc(c.calle)}</b> ${esc(c.tramo)}${c.tipo === "parcial" ? " (parcial)" : ""}</li>`).join("")}</ul>` : ""}
    ${callesEst.length ? `<p class="estimado">Calles que probablemente se corten (alrededor del lugar): ${callesEst.map(esc).join(", ")}.</p>` : ""}
    ${!ev.tramos.length ? "<p class='estimado'>Todavía no hay calles publicadas para este evento.</p>" : ""}
    ${ev.notas ? `<div>${esc(ev.notas)}</div>` : ""}
    ${ev.fuente ? `<a href="${esc(ev.fuente)}" target="_blank" rel="noopener">Ver fuente</a>` : ""}`;
}

function refrescar() {
  const activo = puntoActivo();
  const radio = radioActual();
  const tipos = tiposActivos();
  const zona = radio ? `cerca de ${NOMBRE_REF[activo.tipo]}` : "en CABA";
  for (const e of todos) e.dist = distanciaACasa(e, activo?.punto || null);
  visibles = todos.filter((e) => tipos.includes(e.tipo) && (!radio || (e.dist !== null && e.dist <= radio)));
  mostrarReferencia(visibles);

  // Los avisos siempre se calculan con la casa (no con "dónde estoy" ni una dirección buscada).
  const casa = leer("casa", null);
  const radioCasa = casa ? Number(leer("radio", 3000)) : 0;
  avisables = todos.filter((e) => {
    if (!tipos.includes(e.tipo)) return false;
    if (!radioCasa) return true;
    const d = distanciaACasa(e, casa);
    return d !== null && d <= radioCasa;
  });

  const lista = $("#lista");
  lista.innerHTML = "";
  $("#cuantos").textContent = `(${visibles.length})`;
  if (!visibles.length) lista.innerHTML = `<li class="vacio">No hay eventos ${zona} en los próximos días.</li>`;
  for (const ev of visibles) {
    const li = document.createElement("li");
    li.className = "evento";
    li.style.setProperty("--c", TIPOS[ev.tipo].color);
    li.dataset.id = ev.id;
    li.innerHTML = `
      <div class="ico">${TIPOS[ev.tipo].icono}</div>
      <div class="cuerpo">
        <div class="t">${esc(ev.titulo)}
          ${ev.confirmado === false ? '<span class="chip warn">a confirmar</span>' : ""}
          ${!ev.horaConfirmada ? '<span class="chip">hora a definir</span>' : ""}</div>
        <div class="f">${fmtDia.format(ev.inicio)}${ev.horaConfirmada ? " · " + fmtHora.format(ev.inicio) + " h" : ""}
          ${ev.donde ? " · " + esc(ev.donde) : ""}${ev.dist !== null ? ` · <span class="dist">${textoDist(ev.dist)}</span>` : ""}</div>
        <div class="c">${textoVentana(ev)}</div>
      </div>`;
    li.addEventListener("click", () => {
      seleccionar(ev, true);
      // En el celular el mapa está arriba de la lista: subir para verlo.
      if (window.innerWidth <= 820) $(".mapa-wrap").scrollIntoView({ behavior: "smooth" });
    });
    lista.appendChild(li);
  }
  if (estadoCarga.error) {
    const li = document.createElement("li");
    li.className = "vacio";
    li.textContent = estadoCarga.cacheFecha
      ? `No se pudo actualizar el fixture; se muestran los partidos guardados el ${fmtCorto.format(new Date(estadoCarga.cacheFecha))}.`
      : "No se pudo consultar el fixture (¿sin internet?).";
    lista.appendChild(li);
  }

  // Estado general
  const estado = $("#estado");
  const ahora = Date.now();
  const activos = visibles.filter((e) => e.ventana.desde <= ahora && e.ventana.hasta >= ahora);
  const proximo = visibles.find((e) => e.ventana.desde > ahora);
  estado.className = "estado";
  if (activos.length) {
    estado.classList.add("alerta");
    estado.textContent = `🚧 Ahora ${zona}: ${activos.map((e) => e.titulo).join(" · ")}`;
  } else if (proximo && proximo.ventana.desde - ahora < horas(48)) {
    estado.classList.add("pronto");
    estado.textContent = `⚠️ ${proximo.titulo}: cortes desde ${fmtCorto.format(proximo.ventana.desde)}.`;
  } else if (proximo) {
    estado.classList.add("tranqui");
    estado.textContent = `✅ Sin cortes ${zona} por ahora. Próximo: ${proximo.titulo}, ${fmtDia.format(proximo.inicio)}.`;
  } else {
    estado.classList.add("tranqui");
    estado.textContent = `✅ No hay eventos cargados ${zona} en los próximos días.`;
  }

  const sigue = seleccionado && visibles.find((e) => e.id === seleccionado.id);
  seleccionar(sigue || activos[0] || visibles[0] || null, false);
  avisar(avisables);
}

// ===================== Publicidad y aportes =====================
const ADMOB = window.Capacitor?.isNativePlatform?.() ? window.Capacitor.Plugins.AdMob : null;
let estadoBanner = "nada"; // nada | cargando | visible | reintentar

async function iniciarAnuncios() {
  if (!ADMOB) return;
  if (estadoBanner === "reintentar") {
    estadoBanner = "visible";
    try {
      await ADMOB.showBanner({ adId: ANUNCIOS.bannerId, adSize: "ADAPTIVE_BANNER", position: "BOTTOM_CENTER", margin: 0, isTesting: ANUNCIOS.prueba });
    } catch { estadoBanner = "reintentar"; }
    return;
  }
  if (estadoBanner !== "nada") return;
  estadoBanner = "cargando";
  try {
    await ADMOB.initialize({ initializeForTesting: ANUNCIOS.prueba });
    // Formulario de consentimiento de Google (solo aparece en las regiones que lo exigen).
    try {
      const info = await ADMOB.requestConsentInfo();
      if (info.isConsentFormAvailable && info.status === "REQUIRED") await ADMOB.showConsentForm();
    } catch (e) { console.warn("Consentimiento de AdMob", e); }
    // Se deja lugar abajo para que el banner no tape la lista.
    await ADMOB.addListener("bannerAdSizeChanged", (t) => {
      document.body.style.paddingBottom = Math.round(t?.height || 0) + "px";
    });
    // Si no hay anuncio para mostrar (por ejemplo "No fill" o sin internet), se libera el lugar
    // y se vuelve a intentar la próxima vez que se abre o se actualiza la app.
    await ADMOB.addListener("bannerAdFailedToLoad", async () => {
      document.body.style.paddingBottom = "0px";
      try { await ADMOB.removeBanner(); } catch {}
      estadoBanner = "reintentar";
    });
    await ADMOB.showBanner({ adId: ANUNCIOS.bannerId, adSize: "ADAPTIVE_BANNER", position: "BOTTOM_CENTER", margin: 0, isTesting: ANUNCIOS.prueba });
    estadoBanner = "visible";
  } catch (e) {
    // Sin internet al abrir, por ejemplo: se reintenta la próxima vez que se actualiza la app.
    console.warn("AdMob", e);
    estadoBanner = "nada";
  }
}

// Abre un link en el navegador del teléfono (dentro de la app, un link común no sale de la app).
function abrirAfuera(url) {
  if (window.Capacitor?.isNativePlatform?.()) location.href = url;
  else window.open(url, "_blank", "noopener");
}
document.addEventListener("click", (e) => {
  const a = e.target.closest("a[target=_blank]");
  if (!a || !window.Capacitor?.isNativePlatform?.()) return;
  e.preventDefault();
  abrirAfuera(a.href);
});
if (CAFECITO_URL) {
  const b = $("#cafecito");
  b.hidden = false;
  b.addEventListener("click", () => abrirAfuera(CAFECITO_URL));
}

async function iniciar() {
  actualizarBotonAvisos();
  iniciarAnuncios();
  dibujarFiltros();
  const manuales = await cargarDatos();
  const { partidos, error, cacheFecha } = await traerPartidos();
  estadoCarga = { error, cacheFecha };
  const ahora = Date.now();
  const limite = ahora + horas(24 * DIAS_A_MOSTRAR);
  todos = [...manuales, ...partidos]
    .map(normalizar)
    .filter((e) => e.ventana.hasta >= ahora && e.inicio.getTime() <= limite)
    .sort((a, b) => a.ventana.desde - b.ventana.desde);
  refrescar();
}

iniciar();
// Re-chequear cada 30 minutos si la página queda abierta, y al volver a la app.
setInterval(iniciar, 30 * 60e3);
document.addEventListener("visibilitychange", () => { if (!document.hidden) iniciar(); });
