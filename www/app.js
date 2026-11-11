// ===================== Configuración =====================
const CABA = { lat: -34.6118, lon: -58.4173 };
// Torneos donde pueden jugar de local los equipos porteños. Si alguno falla, se ignora.
const LIGAS_ESPN = ["arg.1", "arg.2", "arg.copa", "conmebol.libertadores", "conmebol.sudamericana"];
const DIAS_A_MOSTRAR = 60;
// Datos publicados en GitHub (los actualiza la tarea programada). Sin internet se usa la última copia guardada.
const DATOS_URL = "https://raw.githubusercontent.com/Cygosc/eventos-velez/main/www/data/";

const TIPOS = {
  partido: { icono: "⚽", nombre: "Partidos", color: "#0a5aa6" },
  recital: { icono: "🎤", nombre: "Recitales", color: "#8e44ad" },
  marcha: { icono: "📣", nombre: "Marchas", color: "#c0392b" },
  corte: { icono: "🚧", nombre: "Cortes y obras", color: "#e67e22" },
  evento: { icono: "📌", nombre: "Otros eventos", color: "#16a085" },
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
  const txt = { internet: "actualizado", guardado: "sin conexión, copia guardada", incluido: "sin conexión, datos de fábrica" };
  $("#actualizado").textContent = `Eventos revisados el ${ev.datos.actualizado || "?"} (${txt[ev.origen]}).`;
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
    '<div><i style="border-top:5px solid #d7263d"></i>Calle cerrada</div>' +
    '<div><i style="border-top:4px dashed #f08a24"></i>Corte parcial</div>' +
    '<div><i style="border-top:4px dotted #d7263d"></i>Estimado (alrededor del lugar)</div>';
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
      color: total || estimado ? "#d7263d" : "#f08a24",
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
  return leer("casa", null) ? Number(leer("radio", 3000)) : 0;
}
$("#radio").addEventListener("change", (e) => {
  guardar("radio", Number(e.target.value));
  refrescar();
});

function mostrarCasa(eventos) {
  const casa = leer("casa", null);
  const info = $("#info-casa");
  const sel = $("#radio");
  sel.disabled = !casa;
  sel.value = String(radioActual());
  if (marcadorCasa) { marcadorCasa.remove(); marcadorCasa = null; }
  if (circuloRadio) { circuloRadio.remove(); circuloRadio = null; }
  if (!casa) {
    info.classList.remove("afectada");
    info.textContent = "Marcá tu casa para ver solo lo que pasa cerca y saber si te afectan los cortes.";
    return;
  }
  $("#btn-casa").textContent = "📍 Cambiar mi casa";
  marcadorCasa = L.circleMarker(casa, { radius: 9, color: "#0a5aa6", fillColor: "#3d8ee0", fillOpacity: 1, weight: 3 })
    .addTo(mapa).bindTooltip("Mi casa");
  const r = radioActual();
  if (r) circuloRadio = L.circle(casa, { radius: r, color: "#0a5aa6", weight: 1, fillOpacity: 0.04, interactive: false }).addTo(mapa);
  const cerca = eventos.filter((e) => e.dist !== null && e.dist < 300);
  info.classList.toggle("afectada", cerca.length > 0);
  info.innerHTML = cerca.length
    ? `🚧 ${cerca.length === 1 ? "Un evento corta" : cerca.length + " eventos cortan"} calles a menos de 300 m de tu casa: ` +
      cerca.map((e) => `<b>${esc(e.titulo)}</b> (${fmtCorto.format(e.ventana.desde)})`).join(", ") + "."
    : "Ningún evento próximo corta calles a menos de 300 m de tu casa.";
}

// ===================== Filtros por tipo =====================
function tiposActivos() {
  return leer("tipos", Object.keys(TIPOS));
}
function dibujarFiltros() {
  const activos = tiposActivos();
  $("#tipos").innerHTML = Object.entries(TIPOS)
    .map(([k, t]) => `<button data-tipo="${k}" class="chip-filtro ${activos.includes(k) ? "activo" : ""}">${t.icono} ${t.nombre}</button>`)
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
  avisar(visibles);
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
let todos = [], visibles = [], seleccionado = null, estadoCarga = {};

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
    ${ev.dist !== null ? `<br>A ${textoDist(ev.dist)} de tu casa.` : ""}
    ${oficiales.length ? `<ul>${oficiales.map((c) => `<li><b>${esc(c.calle)}</b> ${esc(c.tramo)}${c.tipo === "parcial" ? " (parcial)" : ""}</li>`).join("")}</ul>` : ""}
    ${callesEst.length ? `<p class="estimado">Calles que probablemente se corten (alrededor del lugar): ${callesEst.map(esc).join(", ")}.</p>` : ""}
    ${!ev.tramos.length ? "<p class='estimado'>Todavía no hay calles publicadas para este evento.</p>" : ""}
    ${ev.notas ? `<div>${esc(ev.notas)}</div>` : ""}
    ${ev.fuente ? `<a href="${esc(ev.fuente)}" target="_blank" rel="noopener">Ver fuente</a>` : ""}`;
}

function refrescar() {
  const casa = leer("casa", null);
  const radio = radioActual();
  const tipos = tiposActivos();
  for (const e of todos) e.dist = distanciaACasa(e, casa);
  visibles = todos.filter((e) => tipos.includes(e.tipo) && (!radio || (e.dist !== null && e.dist <= radio)));
  mostrarCasa(visibles);

  const lista = $("#lista");
  lista.innerHTML = "";
  $("#cuantos").textContent = `(${visibles.length})`;
  if (!visibles.length) lista.innerHTML = `<li class="vacio">No hay eventos ${radio ? "cerca de tu casa" : ""} en los próximos días.</li>`;
  for (const ev of visibles) {
    const li = document.createElement("li");
    li.className = "evento";
    li.style.borderLeftColor = TIPOS[ev.tipo].color;
    li.dataset.id = ev.id;
    li.innerHTML = `
      <div class="t">${TIPOS[ev.tipo].icono} ${esc(ev.titulo)}
        ${ev.confirmado === false ? '<span class="chip warn">a confirmar</span>' : ""}
        ${!ev.horaConfirmada ? '<span class="chip">hora a definir</span>' : ""}</div>
      <div class="f">${fmtDia.format(ev.inicio)}${ev.horaConfirmada ? " · " + fmtHora.format(ev.inicio) + " h" : ""}
        ${ev.donde ? " · " + esc(ev.donde) : ""}${ev.dist !== null ? ` · <b>${textoDist(ev.dist)}</b>` : ""}</div>
      <div class="c">${textoVentana(ev)}</div>`;
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
  const zona = radio ? "cerca de tu casa" : "en CABA";
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
  avisar(visibles);
}

async function iniciar() {
  actualizarBotonAvisos();
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
