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

## Cómo generar el AAB

1. Pausá OneDrive.
2. Android Studio → **Build → Generate Signed App Bundle or APK** → Android App Bundle → tu clave de
   `H:\OneDrive\Diego\Claves\` (la misma de siempre) → `release`.
3. El archivo queda en `android/app/release/app-release.aab`. Avisame y lo reviso antes de subirlo.

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
</es-419>
```
