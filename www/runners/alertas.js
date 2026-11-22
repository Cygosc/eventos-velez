// Corre fuera de la app (plugin @capacitor/background-runner): Android lo ejecuta cada 15 minutos aunque la app
// esté cerrada, y la app lo llama al abrirse. Baja las alertas del SMN que dejó la acción de GitHub y avisa las que
// cubren alguno de mis lugares o el último lugar donde estuve.
// Es un motor de JavaScript chico (QuickJS): no hay localStorage, DOM ni Intl. Los datos se guardan en CapacitorKV.

var URL_ALERTAS = "https://raw.githubusercontent.com/Cygosc/eventos-velez/main/www/data/alertas.json";
var NIVEL = { amarillo: "amarilla", naranja: "naranja", rojo: "roja" };
var DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
var HORA = 3600e3;

function leerKV(clave, def) {
  try {
    var r = CapacitorKV.get(clave);
    var v = r && typeof r === "object" ? r.value : r;
    return v ? JSON.parse(v) : def;
  } catch (e) { return def; }
}
function guardarKV(clave, valor) { CapacitorKV.set(clave, JSON.stringify(valor)); }

function dentro(lat, lon, poli) {
  var adentro = false;
  for (var i = 0, j = poli.length - 1; i < poli.length; j = i++) {
    var yi = poli[i][0], xi = poli[i][1], yj = poli[j][0], xj = poli[j][1];
    if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) adentro = !adentro;
  }
  return adentro;
}

// "dom 22, 02:59" en hora de Argentina (UTC-3, sin horario de verano).
function fechaCorta(iso) {
  var d = new Date(Date.parse(iso) - 3 * HORA);
  var dosCifras = function (n) { return (n < 10 ? "0" : "") + n; };
  return DIAS[d.getUTCDay()] + " " + d.getUTCDate() + ", " + dosCifras(d.getUTCHours()) + ":" + dosCifras(d.getUTCMinutes());
}

function nombres(lista) {
  return lista.length <= 1 ? lista.join("") : lista.slice(0, -1).join(", ") + " y " + lista[lista.length - 1];
}

function idNotificacion(texto) {
  var h = 0;
  for (var i = 0; i < texto.length; i++) h = (h * 31 + texto.charCodeAt(i)) | 0;
  return Math.abs(h) % 2000000000;
}

async function traerAlertas() {
  var r = await fetch(URL_ALERTAS + "?t=" + Date.now());
  var datos = typeof r.json === "function" ? await r.json() : JSON.parse(await r.text());
  return (datos && datos.alertas) || [];
}

async function revisar(args) {
  args = args || {};
  // La app manda sus lugares y el permiso de avisos; en segundo plano se usan los últimos que mandó.
  if (args.puntos) guardarKV("puntos", args.puntos);
  if (typeof args.avisos === "boolean") guardarKV("avisos", args.avisos);
  if (!leerKV("avisos", false)) return 0;

  var ahora = Date.now();
  var puntos = leerKV("puntos", []).filter(function (p) { return !p.hasta || p.hasta > ahora; });
  var alertas = args.alertas || await traerAlertas();
  var avisadas = leerKV("avisadas", {});
  var nuevas = [];

  for (var i = 0; i < alertas.length; i++) {
    var a = alertas[i];
    if (a.hasta && Date.parse(a.hasta) < ahora) continue;
    var afecta = [];
    for (var k = 0; k < puntos.length; k++) {
      var p = puntos[k];
      for (var m = 0; m < a.poligonos.length; m++) {
        if (dentro(p.lat, p.lon, a.poligonos[m])) { if (afecta.indexOf(p.nombre) < 0) afecta.push(p.nombre); break; }
      }
    }
    // Sin lugares guardados se avisan todas (todas tocan CABA).
    if (puntos.length && !afecta.length) continue;
    // La misma alerta no se repite: el SMN la actualiza varias veces. Se vuelve a avisar si pasaron 6 h
    // (1 h en los avisos a corto plazo) o si sube de nivel (eso es otra clave).
    var clave = [a.evento, a.nivel, a.corto ? "acp" : "al"].join("|");
    if (avisadas[clave] && ahora - avisadas[clave] < (a.corto ? 1 : 6) * HORA) continue;
    avisadas[clave] = ahora;
    nuevas.push({
      id: idNotificacion(clave + ahora),
      title: (a.corto ? "⚠️ Aviso " + a.nivel : "⛈️ Alerta " + NIVEL[a.nivel]) + " por " + a.evento.toLowerCase(),
      body: (afecta.length ? "Cerca de " + nombres(afecta) + ". " : "En CABA. ") + "Hasta el " + fechaCorta(a.hasta) + ". " + (a.descripcion || ""),
      smallIcon: "ic_stat_notify",
      autoCancel: true,
    });
  }

  // Se olvidan las claves viejas para que el registro no crezca.
  for (var c in avisadas) if (ahora - avisadas[c] > 48 * HORA) delete avisadas[c];
  guardarKV("avisadas", avisadas);
  if (nuevas.length) CapacitorNotifications.schedule(nuevas);
  return nuevas.length;
}

// Ojo: si el fetch del plugin falla (por ejemplo un 404), la promesa no termina nunca y Android corta la tarea a los
// 10 minutos (probado en el emulador; un setTimeout tampoco llega a correr). Por eso la app siempre manda las alertas
// que ya bajó y el runner solo usa fetch en segundo plano, cuando alertas.json existe y hay conexión (la tarea de
// WorkManager exige red).
addEventListener("revisarAlertas", function (resolve, reject, args) {
  revisar(args).then(function (n) { resolve({ avisadas: n }); }, function (e) { reject(String(e)); });
});
