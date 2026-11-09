// ---------- Configuración ----------
const ESTADIO = { lat: -34.63535, lon: -58.52069, nombre: "Estadio José Amalfitani" };
const VELEZ_ESPN_ID = "21";
// Torneos donde Vélez puede jugar de local. Si alguno falla, se ignora.
const LIGAS_ESPN = ["arg.1", "arg.copa", "conmebol.libertadores", "conmebol.sudamericana"];
const DIAS_A_MOSTRAR = 60;
// Datos publicados en GitHub (los actualiza la tarea programada). Si no hay internet se usa la última copia guardada.
const DATOS_URL = "https://raw.githubusercontent.com/Cygosc/eventos-velez/main/www/data/";
const HORAS_AVISO = 36; // avisar si un evento empieza dentro de este plazo

// ---------- Utilidades ----------
const $ = (s) => document.querySelector(s);
const guardar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const leer = (k, def) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } };

const fmtDia = new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Argentina/Buenos_Aires" });
const fmtHora = new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires" });
const fmtCorto = new Intl.DateTimeFormat("es-AR", { weekday: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires" });

// Medianoche de Buenos Aires para una fecha dada (Argentina no tiene horario de verano: UTC-3 fijo).
function inicioDiaBA(fecha) {
  const ba = new Date(fecha.getTime() - 3 * 3600e3);
  return new Date(Date.UTC(ba.getUTCFullYear(), ba.getUTCMonth(), ba.getUTCDate()) + 3 * 3600e3);
}
const horas = (n) => n * 3600e3;

// Ventana de cortes por defecto según el tipo de evento.
function ventanaCortes(ev) {
  if (ev.cortes) return { desde: new Date(ev.cortes.desde), hasta: new Date(ev.cortes.hasta), estimado: false };
  const dia = inicioDiaBA(ev.inicio);
  if (ev.tipo === "recital") {
    // Operativos publicados por la Ciudad: 13:00 del día del show hasta las 04:00 del día siguiente.
    return { desde: new Date(dia.getTime() + horas(13)), hasta: new Date(dia.getTime() + horas(28)), estimado: false };
  }
  if (!ev.horaConfirmada) {
    return { desde: new Date(dia.getTime() + horas(10)), hasta: new Date(dia.getTime() + horas(24)), estimado: true };
  }
  return { desde: new Date(ev.inicio.getTime() - horas(3)), hasta: new Date(ev.inicio.getTime() + horas(2.5)), estimado: true };
}

// Distancia en metros (aproximación plana, suficiente a escala barrio).
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
function corteMasCercano(p) {
  let mejor = null;
  for (const c of window.CORTES_VELEZ) {
    for (let i = 1; i < c.coords.length; i++) {
      const d = distPuntoTramo(p, c.coords[i - 1], c.coords[i]);
      if (!mejor || d < mejor.d) mejor = { d, corte: c };
    }
  }
  return mejor;
}

// ---------- Datos ----------
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
  const [ev, co] = await Promise.all([traerJSON("eventos.json"), traerJSON("cortes.json")]);
  window.EVENTOS_MANUALES = ev.datos.eventos || [];
  window.CORTES_VELEZ = co.datos.cortes || [];
  const txt = { internet: "actualizados", guardado: "sin conexión, copia guardada", incluido: "sin conexión, datos de fábrica" };
  $("#actualizado").textContent = `Recitales revisados el ${ev.datos.actualizado || "?"} (${txt[ev.origen]}).`;
}

async function traerPartidos() {
  const resultados = await Promise.allSettled(LIGAS_ESPN.map(async (liga) => {
    const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${liga}/teams/${VELEZ_ESPN_ID}/schedule?fixture=true`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(r.status);
    const d = await r.json();
    return (d.events || []).flatMap((e) => {
      const comp = e.competitions?.[0];
      const local = comp?.competitors?.find((c) => c.homeAway === "home");
      const visita = comp?.competitors?.find((c) => c.homeAway === "away");
      if (!local || local.team?.id !== VELEZ_ESPN_ID || comp.neutralSite) return [];
      return [{
        id: "espn-" + e.id,
        titulo: `Vélez vs ${visita?.team?.shortDisplayName?.trim() || visita?.team?.displayName || "rival a definir"}`,
        tipo: "partido",
        inicio: e.date,
        horaConfirmada: e.timeValid !== false,
        confirmado: true,
        fuente: "https://www.espn.com.ar/futbol/equipo/calendario/_/id/21/velez-sarsfield",
        notas: e.seasonType?.name || d.season?.displayName || "",
      }];
    });
  }));
  const ok = resultados.filter((r) => r.status === "fulfilled");
  if (!ok.length) {
    const cache = leer("partidos", null);
    return { partidos: cache?.partidos || [], error: true, cacheFecha: cache?.fecha };
  }
  const partidos = ok.flatMap((r) => r.value);
  guardar("partidos", { partidos, fecha: new Date().toISOString() });
  return { partidos, error: false };
}

function normalizar(ev) {
  const e = { ...ev, inicio: new Date(ev.inicio) };
  e.ventana = ventanaCortes(e);
  return e;
}

// ---------- Mapa ----------
const mapa = L.map("mapa", { zoomControl: true }).setView([ESTADIO.lat, ESTADIO.lon], 16);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(mapa);

L.marker([ESTADIO.lat, ESTADIO.lon], { title: ESTADIO.nombre })
  .addTo(mapa)
  .bindPopup(`<b>${ESTADIO.nombre}</b><br>Av. Juan B. Justo 9200, Liniers`);

const capaCortes = L.layerGroup().addTo(mapa);
let marcadorCasa = null;

const leyenda = L.control({ position: "bottomleft" });
leyenda.onAdd = () => {
  const div = L.DomUtil.create("div", "leyenda");
  div.innerHTML =
    '<div><i style="border-top:5px solid #d7263d"></i>Calle cerrada</div>' +
    '<div><i style="border-top:4px dashed #f08a24"></i>Corte parcial (un carril)</div>';
  return div;
};
leyenda.addTo(mapa);

function dibujarCortes(ev) {
  capaCortes.clearLayers();
  const opacidad = ev?.ventana?.estimado ? 0.6 : 0.9;
  for (const c of window.CORTES_VELEZ) {
    const total = c.tipo === "total";
    L.polyline(c.coords, {
      color: total ? "#d7263d" : "#f08a24",
      weight: total ? 7 : 5,
      opacity: opacidad,
      dashArray: total ? null : "8 8",
    })
      .bindTooltip(`<b>${c.calle}</b><br>${c.tramo}`, { sticky: true })
      .addTo(capaCortes);
  }
}

// ---------- Mi casa ----------
let modoCasa = false;
$("#btn-casa").addEventListener("click", () => {
  modoCasa = !modoCasa;
  $("#btn-casa").classList.toggle("activo", modoCasa);
  $("#btn-casa").textContent = modoCasa ? "Tocá tu casa en el mapa…" : "📍 Marcar mi casa";
  mapa.getContainer().style.cursor = modoCasa ? "crosshair" : "";
});
mapa.on("click", (e) => {
  if (!modoCasa) return;
  modoCasa = false;
  $("#btn-casa").classList.remove("activo");
  $("#btn-casa").textContent = "📍 Cambiar mi casa";
  mapa.getContainer().style.cursor = "";
  guardar("casa", [e.latlng.lat, e.latlng.lng]);
  mostrarCasa();
});

function mostrarCasa() {
  const casa = leer("casa", null);
  const info = $("#info-casa");
  if (!casa) { info.textContent = "Marcá tu casa para saber si te afectan los cortes."; return; }
  $("#btn-casa").textContent = "📍 Cambiar mi casa";
  if (marcadorCasa) marcadorCasa.remove();
  marcadorCasa = L.circleMarker(casa, { radius: 9, color: "#0a5aa6", fillColor: "#3d8ee0", fillOpacity: 1, weight: 3 })
    .addTo(mapa).bindTooltip("Mi casa");
  const dEstadio = Math.round(metros(casa, [ESTADIO.lat, ESTADIO.lon]));
  const cerca = corteMasCercano(casa);
  const dCorte = Math.round(cerca.d);
  info.classList.toggle("afectada", dCorte < 150);
  info.innerHTML = `Tu casa está a <b>${dEstadio} m</b> del estadio. ` +
    (dCorte < 150
      ? `Hay un corte a <b>${dCorte} m</b> (${cerca.corte.calle}): en días de evento vas a tener la calle cortada o muy cerca.`
      : `El corte más cercano está a ${dCorte} m (${cerca.corte.calle}).`);
}

// ---------- Avisos ----------
// En la APK se usan notificaciones nativas programadas (llegan aunque la app esté cerrada).
// En el navegador se usa la Notification API (solo con la página abierta).
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
  avisar(window.__eventos || []);
});

// Id numérico estable para cada aviso (las notificaciones nativas necesitan un entero).
function idAviso(texto) {
  let h = 0;
  for (const ch of texto) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return Math.abs(h) % 2000000000;
}

async function programarAvisosNativos(eventos) {
  if ((await LN.checkPermissions()).display !== "granted") return;
  const pendientes = await LN.getPending();
  if (pendientes.notifications.length) await LN.cancel({ notifications: pendientes.notifications.map((n) => ({ id: n.id })) });
  const ahora = Date.now();
  const lista = [];
  for (const ev of eventos) {
    const v = ev.ventana;
    const cuerpo = `${fmtDia.format(ev.inicio)}. Cortes desde ${fmtCorto.format(v.desde)} hasta ${fmtCorto.format(v.hasta)}${v.estimado ? " (estimado)" : ""}.`;
    // Aviso el día anterior a las 20:00 y otro 2 horas antes de que empiecen los cortes.
    const diaAntes = new Date(inicioDiaBA(v.desde).getTime() - horas(4));
    for (const [cuando, titulo] of [[diaAntes, `Mañana: ${ev.titulo} en Vélez`], [new Date(v.desde - horas(2)), `Hoy cortan calles: ${ev.titulo}`]]) {
      if (cuando.getTime() <= ahora) continue;
      lista.push({ id: idAviso(ev.id + cuando.toISOString()), title: titulo, body: cuerpo, schedule: { at: cuando, allowWhileIdle: true } });
    }
  }
  if (lista.length) await LN.schedule({ notifications: lista });
}

function avisar(eventos) {
  if (LN) { programarAvisosNativos(eventos).catch(console.error); return; }
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const yaAvisados = leer("avisados", []);
  const ahora = Date.now();
  for (const ev of eventos) {
    const falta = ev.ventana.desde - ahora;
    if (falta > horas(HORAS_AVISO) || ev.ventana.hasta < ahora || yaAvisados.includes(ev.id)) continue;
    new Notification(`Evento en Vélez: ${ev.titulo}`, {
      body: `${fmtDia.format(ev.inicio)}. Cortes desde ${fmtCorto.format(ev.ventana.desde)} hasta ${fmtCorto.format(ev.ventana.hasta)}.`,
      tag: ev.id,
    });
    yaAvisados.push(ev.id);
  }
  guardar("avisados", yaAvisados.slice(-50));
}

// ---------- Render ----------
let seleccionado = null;

function textoVentana(ev) {
  const v = ev.ventana;
  return `${v.estimado ? "Cortes estimados" : "Cortes"}: ${fmtCorto.format(v.desde)} → ${fmtCorto.format(v.hasta)}`;
}

function seleccionar(ev) {
  seleccionado = ev;
  document.querySelectorAll(".evento").forEach((li) => li.classList.toggle("sel", li.dataset.id === ev?.id));
  dibujarCortes(ev);
  const det = $("#detalle");
  if (!ev) {
    det.innerHTML = "<b>Mapa de cortes del último operativo publicado.</b> No hay eventos próximos cargados.";
    return;
  }
  const totales = window.CORTES_VELEZ.filter((c) => c.tipo === "total");
  const parciales = window.CORTES_VELEZ.filter((c) => c.tipo !== "total");
  det.innerHTML = `
    <b>${ev.titulo}</b> — ${fmtDia.format(ev.inicio)}, ${ev.horaConfirmada ? fmtHora.format(ev.inicio) + " h" : "hora a confirmar"}<br>
    ${textoVentana(ev)}
    ${ev.ventana.estimado ? "<br><i>La Ciudad no publica los cortes de los partidos; el horario y el mapa son una estimación basada en los recitales.</i>" : ""}
    <ul>${totales.map((c) => `<li><b>${c.calle}</b> ${c.tramo}</li>`).join("")}
        ${parciales.map((c) => `<li>${c.calle}: ${c.tramo}</li>`).join("")}
        <li>Subidas y bajadas de la Au. Perito Moreno en Barragán: cerradas</li></ul>
    ${ev.notas ? `<div>${ev.notas}</div>` : ""}
    <a href="${ev.fuente}" target="_blank" rel="noopener">Ver fuente</a>`;
}

function render(eventos, errorPartidos, cacheFecha) {
  const lista = $("#lista");
  lista.innerHTML = "";
  if (!eventos.length) lista.innerHTML = '<li class="vacio">No hay eventos en los próximos días.</li>';
  for (const ev of eventos) {
    const li = document.createElement("li");
    li.className = `evento ${ev.tipo}`;
    li.dataset.id = ev.id;
    const icono = ev.tipo === "partido" ? "⚽" : ev.tipo === "recital" ? "🎤" : "📌";
    li.innerHTML = `
      <div class="t">${icono} ${ev.titulo}
        ${ev.confirmado === false ? '<span class="chip warn">a confirmar</span>' : ""}
        ${!ev.horaConfirmada ? '<span class="chip">hora a definir</span>' : ""}</div>
      <div class="f">${fmtDia.format(ev.inicio)}${ev.horaConfirmada ? " · " + fmtHora.format(ev.inicio) + " h" : ""}</div>
      <div class="c">${textoVentana(ev)}</div>`;
    li.addEventListener("click", () => seleccionar(ev));
    lista.appendChild(li);
  }
  if (errorPartidos) {
    const li = document.createElement("li");
    li.className = "vacio";
    li.textContent = cacheFecha
      ? `No se pudo actualizar el fixture; se muestran los partidos guardados el ${fmtCorto.format(new Date(cacheFecha))}.`
      : "No se pudo consultar el fixture de Vélez (¿sin internet?).";
    lista.appendChild(li);
  }

  // Estado arriba de todo
  const estado = $("#estado");
  const ahora = Date.now();
  const activo = eventos.find((e) => e.ventana.desde <= ahora && e.ventana.hasta >= ahora);
  const proximo = eventos.find((e) => e.ventana.desde > ahora);
  estado.className = "estado";
  if (activo) {
    estado.classList.add("alerta");
    estado.textContent = `🚧 Ahora: ${activo.titulo}. Calles cortadas hasta ${fmtCorto.format(activo.ventana.hasta)}.`;
  } else if (proximo && proximo.ventana.desde - ahora < horas(48)) {
    estado.classList.add("pronto");
    estado.textContent = `⚠️ ${proximo.titulo}: cortes desde ${fmtCorto.format(proximo.ventana.desde)}.`;
  } else if (proximo) {
    estado.classList.add("tranqui");
    estado.textContent = `✅ Sin cortes por ahora. Próximo: ${proximo.titulo}, ${fmtDia.format(proximo.inicio)}.`;
  } else {
    estado.classList.add("tranqui");
    estado.textContent = "✅ No hay eventos cargados en los próximos días.";
  }

  seleccionar(activo || eventos[0] || null);
}

async function iniciar() {
  actualizarBotonAvisos();
  const [{ partidos, error, cacheFecha }] = await Promise.all([traerPartidos(), cargarDatos()]);
  mostrarCasa();
  const ahora = Date.now();
  const limite = ahora + horas(24 * DIAS_A_MOSTRAR);
  const eventos = [...(window.EVENTOS_MANUALES || []), ...partidos]
    .map(normalizar)
    .filter((e) => e.ventana.hasta >= ahora && e.inicio.getTime() <= limite)
    .sort((a, b) => a.inicio - b.inicio);
  window.__eventos = eventos;
  render(eventos, error, cacheFecha);
  avisar(eventos);
}

iniciar();
// Re-chequear cada 30 minutos si la página queda abierta, y al volver a la app.
setInterval(iniciar, 30 * 60e3);
document.addEventListener("visibilitychange", () => { if (!document.hidden) iniciar(); });
