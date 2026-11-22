# Versión 1.2 (versionCode 6) — notas para Play Console

> El primer AAB 1.2 (versionCode 3) lo rechazó la revisión previa de Play Console: la orientación vertical obligatoria
> (`android.hardware.screen.portrait`) dejaba afuera tablets, computadoras y Android XR. Ahora está declarada como
> opcional. Después se sumaron las alertas meteorológicas (versionCode 5), pero el plugin que las revisa con la app
> cerrada (Background Runner) agregaba el permiso `ACCESS_BACKGROUND_LOCATION` y Play pidió declararlo. La app no usa
> la ubicación en segundo plano (el aviso usa la última ubicación que guardó la app abierta), así que el permiso se
> quita en el manifiesto. El AAB final es el **versionCode 6** (el nombre sigue siendo 1.2; Play no deja reusar un
> versionCode ya subido y acepta saltos). En la versión borrador quitá el AAB que hayas subido (3, 4 o 5) y subí el 6.
> **No completes el formulario de ubicación en segundo plano:** al cambiar el AAB por el 6 ese pedido desaparece.

- **Alertas meteorológicas del SMN:** las alertas (amarilla, naranja, roja) y los avisos a corto plazo del Servicio
  Meteorológico Nacional que cubren alguno de tus lugares o el lugar donde estás aparecen arriba de todo y en el mapa
  (zona pintada del color del nivel). Tocando la tarjeta se ve la descripción, qué hacer y el enlace al SMN.
- **Aviso de alertas con la app cerrada:** Android revisa las alertas cada 15 minutos aproximadamente (plugin
  Background Runner) y manda una notificación cuando una nueva te afecta. La misma alerta no se repite: se vuelve a
  avisar si sube de nivel o si pasaron 6 horas (1 hora en los avisos a corto plazo).
- Las alertas las baja una acción de GitHub cada 10 minutos (`.github/workflows/alertas.yml`); no usa Claude.

- **Avisos con el día correcto:** si el teléfono se reiniciaba o Android demoraba la alarma, el aviso del día anterior
  ("Mañana: …") podía llegar el mismo día del evento, junto con el de "Hoy". Ahora los títulos dicen el día y la hora
  ("El viernes 20 cortan calles: …", "Desde las 17:00 cortan calles: …"), así que siempre son correctos.
- Al abrir la app se borran de la bandeja los avisos de eventos que ya terminaron.
- La app se puede instalar también en tablets, Chromebooks y Android XR (antes Play la ocultaba).
- Los eventos se actualizan también los domingos (martes, jueves y domingos). Cambió la leyenda de la app.

## Cómo generar el AAB

1. Pausá OneDrive.
2. Android Studio → **Build → Generate Signed App Bundle or APK** → Android App Bundle → tu clave de
   `H:\OneDrive\Diego\Claves\` (la misma de siempre) → `release`.
3. El archivo queda en `android/app/release/app-release.aab`. Avisame y lo reviso antes de subirlo.

## Política de privacidad y seguridad de los datos

- `store/web/privacidad.html` suma la sección de alertas meteorológicas y que la app toma la ubicación al abrirse (si
  el permiso ya está dado). Hay que publicarla en https://cygosc.github.io/cortes-caba/privacidad.html (repo
  Cygosc/cygosc.github.io) antes de mandar la versión a revisión.
- **Seguridad de los datos: no cambia.** La ubicación se compara con las zonas de las alertas dentro del teléfono y no
  se envía a ningún lado; la app no usa ubicación con la app cerrada (no pide "ubicación en segundo plano").

## Ficha de Play Store

En **Crecimiento → Presencia en Play Store → Ficha de Play Store principal**:

| Campo | Qué hacer |
|---|---|
| Ícono | Queda igual |
| Gráfico destacado (1024 × 500) | Reemplazalo por `store/feature-graphic.png` (ahora menciona las alertas del clima) |
| Capturas del teléfono | Las 5 que están quedan. Subí `store/screenshots/6-alertas.png` y arrastrala al **segundo lugar**, para que se vea enseguida |
| Descripción breve | El texto de abajo (suma las alertas) |
| Descripción completa | El texto de abajo (dice "martes, jueves y domingos" y tiene la sección de alertas) |

**Descripción breve** (76/80):
```
Cortes de calle y alertas del SMN cerca de tu casa, tu trabajo y tus lugares
```

**Descripción completa** (2356/4000):
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

ALERTAS METEOROLÓGICAS
• Las alertas y avisos a corto plazo del Servicio Meteorológico Nacional (tormentas, lluvias, viento, calor) que tocan tus lugares o la zona donde estás, arriba de todo y pintadas en el mapa.
• Te avisamos aunque tengas la app cerrada.

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
• Nuevo: alertas meteorológicas del SMN para tus lugares y la zona donde estás, con aviso aunque la app esté cerrada.
• Los eventos se actualizan también los domingos.
</es-419>
```
