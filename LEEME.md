# ¿Hay algo en Vélez? — notas de uso

## Cómo se actualiza

1. La tarea programada de Claude "Eventos en Vélez" corre lunes y jueves a las 9:00 (con la app de Claude abierta).
2. Actualiza `www/data/eventos.json` y lo sube a GitHub (repo público Cygosc/eventos-velez).
3. La app del celular descarga ese archivo cada vez que se abre o vuelve a primer plano, y programa los avisos.
4. Los partidos de Vélez de local los trae directamente de ESPN.

Sin internet, la app usa la última copia que descargó.

## Avisos en el celular

Después de tocar 🔔 una vez, la app programa dos avisos por evento: el día anterior a las 20:00 y 2 horas antes de que empiecen los cortes.
Los avisos de eventos nuevos se programan recién cuando abrís la app, así que conviene abrirla de vez en cuando.

## Horarios de cortes

- **Recitales:** de 13:00 del día del show a 04:00 del día siguiente (lo que publica la Ciudad), salvo que el evento tenga otro horario cargado.
- **Partidos:** la Ciudad no publica cortes; son una estimación (3 h antes a 2,5 h después, o todo el día si la hora no está confirmada).

## Ver la versión web en la PC

```
python -m http.server 8765 --directory www
```

y entrar a http://localhost:8765.

## Recompilar la APK

```
npm run apk
```

Queda en `android/app/build/outputs/apk/debug/app-debug.apk`. Solo hace falta si cambia el código, no para eventos nuevos.
