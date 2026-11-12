# Versión 1.0 (versionCode 1) — notas para Play Console

Primera versión publicada en Google Play. Va primero a la **prueba cerrada** (paso 7 de la
[guía](guia-google-play.md)) y después, sin cambios, a **Producción** (paso 8).

- **Eventos en toda CABA:** partidos de local de los equipos porteños (desde ESPN), recitales, marchas y cortes
  programados (los carga la tarea en la nube los martes y jueves).
- **Mapa de calles cortadas:** calles cerradas, cortes parciales y perímetro estimado alrededor de cada lugar.
- **Cerca de vos:** mi casa con radio de 1, 3 o 6 km, "Dónde estoy" (📡), búsqueda por dirección o esquina y
  mantener presionado el mapa.
- **Avisos:** el día anterior a las 20:00 y 2 horas antes de que empiecen los cortes.
- **Diseño:** degradado violeta y fucsia, tipografía Plus Jakarta Sans, modo oscuro.
- **Monetización:** un banner de AdMob fijo abajo y el botón "Invitame un cafecito".

## Cómo generar el AAB

1. Pausá OneDrive.
2. Android Studio → **Build → Generate Signed App Bundle or APK** → Android App Bundle → tu clave de
   `H:\OneDrive\Diego\Claves\` → `release`.
3. El archivo queda en `android/app/release/app-release.aab`. Avisame y lo reviso antes de subirlo.

## Nombre de la versión

```
1.0
```

## Notas de la versión

```
<es-419>
¡Primera versión de Cortes CABA! 🚧
• Partidos, recitales, marchas y obras que cortan calles en la Ciudad, en un mapa.
• Marcá tu casa y elegí un radio para ver solo lo que te afecta.
• Tocá 📡 para ver los cortes donde estás, buscá una dirección o mantené presionado el mapa.
• Avisos el día anterior y 2 horas antes de los cortes.
</es-419>
```
