// Genera el ícono (Play Store + Android), el gráfico destacado y las pantallas de inicio a partir de arte.html.
// Usa Edge sin ventana para dibujar y Python (Pillow) para recortar y convertir.
// Uso: node tools/store/arte.mjs
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.join(aqui, "..", "..");
const res = path.join(raiz, "android", "app", "src", "main", "res");
const html = pathToFileURL(path.join(aqui, "arte.html")).href;
const EDGE = ["C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Microsoft/Edge/Application/msedge.exe"].find((p) => fs.existsSync(p));
if (!EDGE) throw new Error("No encuentro Microsoft Edge");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cortes-arte-"));

function captura(params, ancho, alto, destino) {
  const perfil = fs.mkdtempSync(path.join(tmp, "perfil-"));
  const salida = path.join(tmp, `c-${Date.now()}-${Math.random().toString(36).slice(2)}.png`);
  execFileSync(EDGE, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files", "--virtual-time-budget=4000", `--user-data-dir=${perfil}`,
    `--window-size=${ancho},${alto}`, `--screenshot=${salida}`, `${html}?${new URLSearchParams(params)}`], { stdio: "ignore" });
  // A veces Edge (por ejemplo mientras se actualiza) termina antes de escribir la captura: se espera hasta 30 s.
  for (let i = 0; i < 60 && !fs.existsSync(salida); i++) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 500);
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 300);
  // Recorta al tamaño exacto y saca la transparencia (la Play Store no acepta PNG con canal alfa).
  execFileSync("python", ["-c", `
import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert("RGB").crop((0, 0, int(sys.argv[3]), int(sys.argv[4])))
if sys.argv[5] == "redondo":
    m = Image.new("L", im.size, 0)
    from PIL import ImageDraw
    ImageDraw.Draw(m).ellipse((0, 0, im.size[0] - 1, im.size[1] - 1), fill=255)
    out = Image.new("RGBA", im.size, (0, 0, 0, 0)); out.paste(im, (0, 0), m); im = out
im.save(sys.argv[2])
`, salida, destino, String(ancho), String(alto), destino.includes("_round") ? "redondo" : "no"]);
  console.log("ok", path.relative(raiz, destino), `${ancho}x${alto}`);
}

fs.mkdirSync(path.join(raiz, "store"), { recursive: true });
captura({ que: "icono", tam: 512 }, 512, 512, path.join(raiz, "store", "icon-512.png"));
captura({ que: "destacado" }, 1024, 500, path.join(raiz, "store", "feature-graphic.png"));

// Íconos clásicos (Android 7, sin íconos adaptables): se achica el de 512 px (Edge no dibuja ventanas tan chicas).
const densidades = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
for (const [d, t] of Object.entries(densidades)) {
  for (const nombre of ["ic_launcher.png", "ic_launcher_round.png"]) {
    const destino = path.join(res, `mipmap-${d}`, nombre);
    execFileSync("python", ["-c", `
import sys
from PIL import Image, ImageDraw
t = int(sys.argv[3])
im = Image.open(sys.argv[1]).convert("RGB").resize((t, t), Image.LANCZOS)
if sys.argv[4] == "redondo":
    m = Image.new("L", (t * 4, t * 4), 0)
    ImageDraw.Draw(m).ellipse((0, 0, t * 4 - 1, t * 4 - 1), fill=255)
    m = m.resize((t, t), Image.LANCZOS)
    out = Image.new("RGBA", (t, t), (0, 0, 0, 0)); out.paste(im, (0, 0), m); im = out
im.save(sys.argv[2])
`, path.join(raiz, "store", "icon-512.png"), destino, String(t), nombre.includes("_round") ? "redondo" : "no"]);
    console.log("ok", path.relative(raiz, destino), `${t}x${t}`);
  }
}

// Pantallas de inicio: se reemplazan las de Capacitor manteniendo sus tamaños.
for (const carpeta of fs.readdirSync(res).filter((c) => c.startsWith("drawable"))) {
  const archivo = path.join(res, carpeta, "splash.png");
  if (!fs.existsSync(archivo)) continue;
  const [ancho, alto] = execFileSync("python", ["-c", "import sys;from PIL import Image;print(*Image.open(sys.argv[1]).size)", archivo]).toString().trim().split(" ").map(Number);
  captura({ que: "splash", ancho, alto }, ancho, alto, archivo);
}
fs.rmSync(tmp, { recursive: true, force: true });
