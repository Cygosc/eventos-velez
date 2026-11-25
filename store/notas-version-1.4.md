# Versión 1.4 (versionCode 8) — notas para Play Console

- **Botón de avisos como interruptor:** con el permiso de notificaciones ya dado, el botón "🔔 Avisos activados" no
  hacía nada al tocarlo (se vio en un Poco X7 Pro). Ahora prende y apaga los avisos de la app:
  - Tocando "🔔 Avisos activados" pasa a "🔕 Avisos desactivados": se cancelan los avisos programados de cortes y
    la revisión de alertas en segundo plano deja de notificar.
  - Tocándolo de nuevo vuelven a programarse.
  - La elección queda guardada en el teléfono y no cambia el permiso de Android.
  - Si el permiso está bloqueado, el botón sigue abriendo los ajustes de notificaciones (1.3).

## Cómo generar el AAB

1. Pausá OneDrive.
2. Android Studio → **Build → Generate Signed App Bundle or APK** → Android App Bundle → tu clave de
   `H:\OneDrive\Diego\Claves\` (la misma de siempre) → `release`.
3. El archivo queda en `android/app/release/app-release.aab`. Avisame y lo reviso antes de subirlo.

## Política de privacidad, seguridad de los datos y ficha

No cambian: no hay permisos ni datos nuevos.

## Nombre de la versión

```
1.4
```

## Notas de la versión

```
<es-419>
• El botón de avisos ahora es un interruptor: tocalo para desactivar o volver a activar los avisos.
</es-419>
```
