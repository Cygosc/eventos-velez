# Versión 1.1 (versionCode 2) — notas para Play Console

Si la 1.0 todavía no se subió a Play Console, se puede subir directamente esta versión como primera (paso 7 de la
[guía](guia-google-play.md)).

- **Lugares frecuentes:** además de la casa, hasta 10 lugares (trabajo, escuela, amigos…). Por defecto se muestra uno
  vacío para configurar. Se comportan igual que la casa: la lista muestra los eventos dentro del radio de cualquiera
  de ellos, dice de cuál está cerca ("220 m de Trabajo") y los avisos se calculan para todos.
- **Agregar un lugar:** tocar la fila → tocar el mapa, mantenerlo presionado o buscar la dirección con 🔎 → elegir un
  nombre (con sugerencias). Cada lugar se puede renombrar, mover o borrar con el lápiz ✏️.
- **Radio de búsqueda** ahora está debajo de "Mis lugares".
- Cada lugar se ve en el mapa con su ícono (🏠 💼 🏫 🎓 ⭐…).
- **Colores más sobrios:** azul y celeste en lugar de violeta y fucsia (pedido de los testers). También cambiaron el
  ícono, la pantalla de inicio, la barra de estado y el color de las notificaciones.

## Cómo generar el AAB

1. Pausá OneDrive.
2. Android Studio → **Build → Generate Signed App Bundle or APK** → Android App Bundle → tu clave de
   `H:\OneDrive\Diego\Claves\` (la misma de siempre) → `release`.
3. El archivo queda en `android/app/release/app-release.aab`. Avisame y lo reviso antes de subirlo.

## Ficha de Play Store: qué actualizar

En **Crecimiento → Presencia en Play Store → Ficha de Play Store principal** reemplazá:

| Campo | Archivo o texto |
|---|---|
| Ícono (512 × 512) | `store/icon-512.png` (nuevo, azul) |
| Gráfico destacado (1024 × 500) | `store/feature-graphic.png` (nuevo, azul, menciona tus lugares) |
| Capturas del teléfono | Borrá las 5 anteriores y subí las 5 nuevas de `store/screenshots/`, en orden del 1 al 5 |
| Descripción breve | El texto de abajo |
| Descripción completa | El texto de abajo |

**Descripción breve** (78/80):
```
Cortes de calle en CABA cerca de tu casa, tu trabajo y tus lugares, en un mapa
```

**Descripción completa** (2086/4000):
```
¿Hay partido, recital o marcha cerca de tu casa o de tu trabajo? Cortes CABA te muestra en un mapa qué calles se cortan en la Ciudad de Buenos Aires y en qué horario.

MIS LUGARES
• Guardá tu casa y hasta 10 lugares frecuentes: trabajo, escuela, facultad, amigos, familia, gimnasio…
• Agregalos tocando el mapa o buscando la dirección, ponele un nombre a cada uno y editalos o borralos cuando quieras.
• Elegí un radio de 1, 3 o 6 km y mirá solo los cortes que te afectan. La app te dice de cuál de tus lugares está cerca cada uno ("220 m de Trabajo").

QUÉ INCLUYE
• Partidos de local de River, Boca, Vélez, Huracán, San Lorenzo, Argentinos, Ferro, Atlanta y más equipos porteños.
• Recitales y eventos en estadios, Movistar Arena, Luna Park, Hipódromo de Palermo, Campo de Polo, La Rural y otros lugares.
• Marchas y manifestaciones anunciadas en Congreso, Plaza de Mayo, el Obelisco y otros puntos.
• Cortes programados por obras, carreras, actos y eventos en la vía pública.

DONDE ESTÉS
• Tocá 📡 para ver los cortes cerca de donde estás.
• Buscá una dirección o una esquina, o mantené presionado el mapa para ver lo que pasa en esa zona.
• Filtrá por partidos, recitales, marchas, cortes y obras.

AVISOS
Recibí un aviso el día anterior a las 20:00 y otro dos horas antes de que empiecen los cortes cerca de cualquiera de tus lugares.

EN EL MAPA
• Línea roja: calle cerrada según el operativo publicado.
• Línea naranja a rayas: corte parcial.
• Línea punteada: calles que rodean el lugar del evento, cuando todavía no se publicó el operativo.

La información se actualiza todos los martes y jueves. Sin registro: tus lugares se guardan solo en tu teléfono. Solo un banner chico abajo, sin anuncios que interrumpan.

AVISO: Cortes CABA no es una app oficial y no está afiliada al Gobierno de la Ciudad de Buenos Aires ni a ningún club u organismo. Los eventos y cortes se recopilan de fuentes públicas, como los avisos de tránsito de buenosaires.gob.ar, agendas de espectáculos y medios de prensa. Ante cualquier duda, consultá la información oficial en https://buenosaires.gob.ar
```

## Nombre de la versión

```
1.1
```

## Notas de la versión

```
<es-419>
• Nuevo: guardá hasta 10 lugares frecuentes además de tu casa (trabajo, escuela, amigos…).
• Te mostramos y avisamos los cortes cerca de cualquiera de tus lugares, y te decimos de cuál está cerca.
• Agregalos tocando el mapa o buscando la dirección, y editalos o borralos con el lápiz.
• El radio de búsqueda ahora está debajo de tus lugares.
• Nuevo diseño en azul, más sobrio.
</es-419>
```
