# ¿Hay algo en Vélez?

App (web + Android) que avisa de los eventos en el Estadio José Amalfitani (Vélez Sarsfield, Liniers)
y muestra en un mapa las calles que se cortan y en qué horario.

- **Partidos:** se leen de la API pública de ESPN.
- **Recitales y otros eventos:** [`www/data/eventos.json`](www/data/eventos.json), actualizado por una tarea programada.
- **Cortes de calle:** [`www/data/cortes.json`](www/data/cortes.json), según el operativo publicado por el Gobierno de la Ciudad. Geometría © OpenStreetMap.

La app descarga estos JSON desde este repositorio cada vez que se abre.

## Compilar la APK

```
npm install
npm run apk
```

La APK queda en `dist/eventos-velez.apk`.
