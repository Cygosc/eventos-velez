# Versión 1.2 (versionCode 3) — notas para Play Console

- **Avisos con el día correcto:** si el teléfono se reiniciaba o Android demoraba la alarma, el aviso del día anterior
  ("Mañana: …") podía llegar el mismo día del evento, junto con el de "Hoy". Ahora los títulos dicen el día y la hora
  ("El viernes 20 cortan calles: …", "Desde las 17:00 cortan calles: …"), así que siempre son correctos.
- Al abrir la app se borran de la bandeja los avisos de eventos que ya terminaron.
- Los eventos se actualizan también los domingos (martes, jueves y domingos). Cambió la leyenda de la app.

## Cómo generar el AAB

1. Pausá OneDrive.
2. Android Studio → **Build → Generate Signed App Bundle or APK** → Android App Bundle → tu clave de
   `H:\OneDrive\Diego\Claves\` (la misma de siempre) → `release`.
3. El archivo queda en `android/app/release/app-release.aab`. Avisame y lo reviso antes de subirlo.

## Ficha de Play Store

Solo cambia la descripción completa (dice "martes, jueves y domingos"). En **Crecimiento → Presencia en Play Store →
Ficha de Play Store principal** reemplazala por esta. El ícono, el gráfico y las capturas quedan igual.

**Descripción completa** (2096/4000):
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

La información se actualiza todos los martes, jueves y domingos. Sin registro: tus lugares se guardan solo en tu teléfono. Solo un banner chico abajo, sin anuncios que interrumpan.

AVISO: Cortes CABA no es una app oficial y no está afiliada al Gobierno de la Ciudad de Buenos Aires ni a ningún club u organismo. Los eventos y cortes se recopilan de fuentes públicas, como los avisos de tránsito de buenosaires.gob.ar, agendas de espectáculos y medios de prensa. Ante cualquier duda, consultá la información oficial en https://buenosaires.gob.ar
```

## Nombre de la versión

```
1.2
```

## Notas de la versión

```
<es-419>
• Los avisos ahora dicen el día y la hora del corte, así nunca llega un "mañana" el mismo día.
• Se borran solos los avisos de eventos que ya pasaron.
• Los eventos se actualizan también los domingos.
</es-419>
```
