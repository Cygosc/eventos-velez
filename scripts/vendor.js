// Copia a www/vendor las librerías que la app usa sin internet: Leaflet (mapa) y la tipografía Plus Jakarta Sans.
const fs = require("fs");
const path = require("path");
const raiz = path.join(__dirname, "..");
const destino = path.join(raiz, "www", "vendor");
fs.mkdirSync(path.join(destino, "images"), { recursive: true });
fs.mkdirSync(path.join(destino, "fonts"), { recursive: true });

const leaflet = path.join(raiz, "node_modules", "leaflet", "dist");
for (const f of ["leaflet.js", "leaflet.css"]) fs.copyFileSync(path.join(leaflet, f), path.join(destino, f));
for (const f of fs.readdirSync(path.join(leaflet, "images"))) fs.copyFileSync(path.join(leaflet, "images", f), path.join(destino, "images", f));

const fuente = path.join(raiz, "node_modules", "@fontsource", "plus-jakarta-sans", "files");
for (const peso of [400, 600, 700, 800]) {
  const f = `plus-jakarta-sans-latin-${peso}-normal.woff2`;
  fs.copyFileSync(path.join(fuente, f), path.join(destino, "fonts", f));
}
console.log("vendor listo");
