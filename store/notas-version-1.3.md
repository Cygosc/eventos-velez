# Versión 1.3 (versionCode 7) — notas para Play Console

- **Botón "Activar avisos":** si los avisos ya estaban rechazados, Android no vuelve a mostrar el cartel de permiso y
  el botón no hacía nada. Ahora dice "Avisos bloqueados: activalos en Ajustes" y abre los ajustes de notificaciones
  de la app; al volver, el botón y los avisos se actualizan solos. Si nunca se pidió el permiso, sigue apareciendo
  el cartel de Android como antes.
- Complemento nativo nuevo `Ajustes` (`android/app/src/main/java/ar/cygosc/eventosvelez/AjustesPlugin.java`), que
  solo abre la pantalla de notificaciones de la app. No agrega permisos.

## Cómo generar el AAB

1. Pausá OneDrive.
2. Android Studio → **Build → Generate Signed App Bundle or APK** → Android App Bundle → tu clave de
   `H:\OneDrive\Diego\Claves\` (la misma de siempre) → `release`.
3. El archivo queda en `android/app/release/app-release.aab`. Avisame y lo reviso antes de subirlo.

## Política de privacidad, seguridad de los datos y ficha

No cambian: no hay permisos ni datos nuevos, y la ficha de Play Store de la 1.2 sigue sirviendo.

## Nombre de la versión

```
1.3
```

## Notas de la versión

```
<es-419>
• Si bloqueaste los avisos, el botón "Activar avisos" ahora te lleva a los ajustes para activarlos.
</es-419>
```
