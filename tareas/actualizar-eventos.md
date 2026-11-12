# Tarea: actualizar los eventos de "Cortes CABA"

Instrucciones para la tarea programada (corre martes y jueves). Las rutas son relativas a la raíz del repositorio.

La app "Cortes CABA" (web + Android) descarga `www/data/eventos-caba.json` y `www/data/lugares.json` desde
https://raw.githubusercontent.com/Cygosc/eventos-velez/main/www/data/ cada vez que se abre, así que los cambios
solo le llegan a los usuarios cuando se suben a la rama **main**.

La app muestra eventos en toda la Ciudad de Buenos Aires que generan cortes de calle y los dibuja en un mapa.
Los PARTIDOS de los equipos porteños de local los trae sola desde ESPN: **no los cargues**. Tu trabajo es mantener
`www/data/eventos-caba.json` con:

- recitales y otros eventos en estadios, arenas, predios y teatros de CABA (River, Boca, Vélez, Huracán, San Lorenzo,
  Argentinos, Ferro, Atlanta, etc., Movistar Arena, Obras, Luna Park, Hipódromo de Palermo, Campo de Polo, La Rural,
  Parque de la Ciudad, Autódromo, Teatro Colón, y cualquier otro de CABA que genere cortes);
- marchas y manifestaciones anunciadas (Congreso, Plaza de Mayo, Obelisco, 9 de Julio, ministerios, etc.),
  incluidas las recurrentes si siguen vigentes;
- cortes programados: obras, cierres de autopistas, maratones y carreras, ferias, actos, visitas oficiales,
  eventos en la vía pública.

Solo dentro de CABA (no Gran Buenos Aires).

## Formato

Lugares conocidos: `www/data/lugares.json` (campos `id`, `nombre`, `tipo`, `lat`, `lon` y `cortes` = perímetro
estimado). Para un evento en un lugar conocido usá `"lugar": "<id>"`. Para otros, usá
`"ubicacion": {"nombre", "barrio", "lat", "lon"}`.

`eventos-caba.json` es JSON válido, UTF-8, indentado con 2 espacios. Raíz: `{"actualizado": "AAAA-MM-DD", "eventos": [...]}`.
Cada evento:

```json
{ "id": "slug-aaaa-mm-dd", "titulo": "...", "tipo": "recital | marcha | corte | evento",
  "lugar": "<id de lugares.json>",
  "inicio": "AAAA-MM-DDTHH:MM:00-03:00", "fin": "... (opcional, recomendado en marchas y cortes)",
  "horaConfirmada": true, "confirmado": true, "fuente": "https://...", "notas": "...",
  "cortes": {"desde": "ISO -03:00", "hasta": "ISO -03:00"},
  "tramos": [] }
```

(`lugar` o `ubicacion`; `cortes` y `tramos` son opcionales.)

Horario que asume la app si no hay `cortes`: recital en estadio o predio de 13:00 del día a 04:00 del día siguiente;
en arena o teatro de 3 h antes a 4 h después; marcha de 1 h antes hasta `fin` (o 5 h); corte de `inicio` a `fin`.

## Pasos

1. Leé `www/data/eventos-caba.json` y `www/data/lugares.json`.
2. Buscá en la web (WebSearch en español, varias búsquedas) eventos de los próximos 60 días. Fuentes útiles:
   buenosaires.gob.ar (noticias "afectaciones de tránsito", sección cortes de tránsito), noticias de tránsito porteño,
   songkick, bandsintown, quehacemos.com.ar, misconciertos.com.ar, indiehoy.com/eventos,
   timeout.com/es/buenos-aires, ticketeras (allaccess, ticketek, enigma, movistararena.com.ar) y diarios
   (La Nación, Clarín, Infobae, Página/12, iProfesional, El Destape, Ámbito) para marchas y cortes de la semana.
3. Actualizá `eventos-caba.json`: agregá nuevos, corregí fechas y horas, marcá `confirmado: true` con 2 o más fuentes
   o una fuente oficial, `horaConfirmada: true` si la hora es oficial, y borrá los que terminaron hace más de 2 días
   o se cancelaron. Poné `actualizado` con la fecha de hoy (hora de Argentina). No inventes eventos: cada uno con una
   URL de fuente real que hayas visto.
4. Si la Ciudad u otra fuente publica las calles cortadas de un evento de los próximos 10 días, dibujalas: armá un
   archivo temporal fuera del repo con
   `{"lat": ..., "lon": ..., "radio": 1500, "cortes": [{"calle": "Av. de Mayo", "desde": "Bolívar", "hasta": "Av. 9 de Julio", "tipo": "total"}]}`
   (`tipo`: `total` o `parcial`; `tramo` opcional) y ejecutá `python3 scripts/tramos.py archivo.json > salida.json`.
   Pegá la lista resultante en `tramos` del evento. Los tramos que el script no pueda resolver (lo dice por stderr)
   mencionalos en `notas`. Si el script no puede conectarse a overpass-api.de, no dibujes tramos y seguí con el resto.
   No dibujes calles que no estén publicadas.
5. Si aparece un lugar de CABA que no está en `lugares.json` y va a tener eventos seguido, usá `ubicacion` en el
   evento y mencionalo en el resumen (no regeneres `lugares.json`: tarda mucho).
6. Validá: `python3 -c "import json; json.load(open('www/data/eventos-caba.json', encoding='utf-8'))"`
7. Publicá directamente en **main** (no abras PR ni uses otra rama):
   `git checkout main && git pull`, `git add www/data/eventos-caba.json`,
   `git commit -m "Eventos actualizados AAAA-MM-DD"` y `git push origin main`.
   Hacé el commit aunque solo cambie `actualizado`. No toques `www/data/eventos.json` ni otros archivos.
8. Terminá con un resumen corto en español: qué agregaste o cambiaste (con fuentes), si el push salió bien y qué
   debería revisar a mano el dueño de la app.
