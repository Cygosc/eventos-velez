# ¿Qué se corta en CABA?

App (web + Android) que avisa de los eventos que cortan calles en la Ciudad de Buenos Aires
(partidos, recitales, marchas, obras y cortes programados) y los muestra en un mapa con sus horarios.

- **Partidos:** los de local de los equipos porteños se leen de la API pública de ESPN.
- **Recitales, marchas y cortes programados:** [`www/data/eventos-caba.json`](www/data/eventos-caba.json), actualizado por una tarea programada.
- **Lugares:** [`www/data/lugares.json`](www/data/lugares.json): estadios, arenas, predios y plazas, con el perímetro de calles que los rodean (© OpenStreetMap). Se regenera con `python scripts/lugares.py`.
- **Calles oficiales de un operativo:** `python scripts/tramos.py entrada.json` convierte "Calle X entre A y B" en tramos para el mapa.

La app descarga estos JSON desde este repositorio cada vez que se abre.

`www/data/eventos.json` y `www/data/cortes.json` son de la versión 1 (solo Vélez) y se mantienen para no romperla.

## Compilar la APK

```
npm install
npm run apk
```

La APK queda en `dist/eventos-velez.apk`.
