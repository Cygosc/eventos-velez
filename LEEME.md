# ¿Qué se corta en CABA? — notas de uso

## Cómo se actualiza

1. La tarea programada de Claude "Cortes en CABA" corre lunes, miércoles y viernes a las 9:00 (con la app de Claude abierta).
2. Busca recitales, eventos, marchas y cortes programados en CABA, actualiza `www/data/eventos-caba.json` y lo sube a GitHub (repo público Cygosc/eventos-velez).
3. La app del celular descarga ese archivo cada vez que se abre o vuelve a primer plano, y programa los avisos.
4. Los partidos de local de los equipos porteños los trae directamente de ESPN.

Sin internet, la app usa la última copia que descargó.

## Filtros y radio

- **📍 Mi casa:** marcala en el mapa. La app calcula a qué distancia de tu casa está cada corte.
- **Radio:** mostrar solo lo que pasa a 1, 3 o 6 km de tu casa, o en toda CABA.
- **Tipos:** partidos, recitales, marchas, cortes y obras, otros eventos. Tocá cada uno para ocultarlo o mostrarlo.

Los avisos se programan solo para los eventos que se ven con los filtros elegidos.

## Avisos en el celular

Después de tocar 🔔 una vez, la app programa dos avisos por evento: el día anterior a las 20:00 y 2 horas antes de que empiecen los cortes.
Los avisos de eventos nuevos se programan recién cuando abrís la app, así que conviene abrirla de vez en cuando.

## Calles cortadas en el mapa

- **Línea roja continua:** calle cerrada según el operativo publicado.
- **Línea naranja a rayas:** corte parcial (un carril).
- **Línea roja punteada:** estimado, son las calles que rodean el lugar. Se reemplaza por las calles oficiales cuando la Ciudad publica el operativo.

## Horarios de cortes (si no hay horario oficial)

- **Recitales en estadios y predios:** de 13:00 del día del show a 04:00 del día siguiente.
- **Recitales en arenas y teatros:** de 3 h antes a 4 h después.
- **Partidos:** de 3 h antes a 2,5 h después, o todo el día si la hora no está confirmada.
- **Marchas:** desde 1 h antes hasta la hora de fin (o 5 h).

## Ver la versión web en la PC

```
python -m http.server 8765 --directory www
```

y entrar a http://localhost:8765.

## Recompilar la APK

```
npm run apk
```

Queda en `dist/eventos-velez.apk`. Solo hace falta si cambia el código, no para eventos nuevos.
