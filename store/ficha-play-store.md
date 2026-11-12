# Ficha de Play Store — Cortes CABA

Todo lo que pide Play Console, listo para copiar y pegar. Mismo método que Karen Cat Rescue.

## 1. Crear la app en Play Console

**Inicio → Crear app**

| Campo | Qué poner |
|---|---|
| Nombre de la app | `Cortes CABA: calles cortadas` |
| Idioma predeterminado | Español (Latinoamérica) – es-419 |
| App o juego | App |
| Gratuita o pagada | Gratuita |

ID de la app (ya está configurado en el proyecto, no se puede cambiar después de publicar): **`ar.cygosc.cortescaba`**

## 2. Generar el AAB firmado (lo hacés vos en Android Studio)

1. En la carpeta del proyecto: `npm run sync` (copia la versión web a Android).
2. Android Studio → **File → Open** → la carpeta `android` del proyecto.
3. **Build → Generate Signed App Bundle / APK** → **Android App Bundle** → Next.
4. Clave: es una app nueva, así que en **Key store path** elegí **Create new...** y guardala **fuera** de la carpeta del
   proyecto (por ejemplo `Documentos\claves\cortes-caba-upload.jks`). Completá contraseñas, alias (`upload`) y tus datos.
5. Variante **release** → **Create**. El archivo queda en `android/app/release/app-release.aab`.

**Guardá el `.jks` y sus contraseñas con copia de seguridad** (pendrive o nube). Los vas a necesitar para cada
actualización. Google firma la versión final con su propia clave (Firma de apps de Play); la tuya es la "clave de subida".

Si Android Studio da el error **"Unable to delete directory … build"**, es OneDrive bloqueando archivos: pausá la
sincronización de OneDrive (ícono de la nube → Pausar sincronización) mientras compilás.

Para cada actualización: subí `versionCode` en `android/app/build.gradle` (1 → 2 → 3…) y `versionName` (1.0 → 1.1…).

## 3. Ficha de Play Store principal

**Crecimiento → Presencia en Play Store → Ficha de Play Store principal**

| Campo | Qué poner |
|---|---|
| Ícono (512 × 512) | `store/icon-512.png` |
| Gráfico destacado (1024 × 500) | `store/feature-graphic.png` |
| Capturas del teléfono | `store/screenshots/` → las 5, en orden del 1 al 5 |
| Video | Dejalo vacío |
| Capturas de tablet / Chromebook | Dejalo vacío |

**Título** (28/30):

```
Cortes CABA: calles cortadas
```

**Descripción breve** (78/80):

```
Partidos, recitales, marchas y obras que cortan calles en CABA, en un mapa
```

**Descripción completa:**

```
¿Hay partido, recital o marcha cerca de tu casa? Cortes CABA te muestra en un mapa qué calles se cortan en la Ciudad de Buenos Aires y en qué horario.

QUÉ INCLUYE
• Partidos de local de River, Boca, Vélez, Huracán, San Lorenzo, Argentinos, Ferro, Atlanta y más equipos porteños.
• Recitales y eventos en estadios, Movistar Arena, Luna Park, Hipódromo de Palermo, Campo de Polo, La Rural y otros lugares.
• Marchas y manifestaciones anunciadas en Congreso, Plaza de Mayo, el Obelisco y otros puntos.
• Cortes programados por obras, carreras, actos y eventos en la vía pública.

CERCA DE VOS
• Marcá tu casa y elegí un radio de 1, 3 o 6 km para ver solo lo que te afecta.
• Tocá 📡 para ver los cortes cerca de donde estás.
• Buscá una dirección o una esquina, o mantené presionado el mapa para ver lo que pasa en esa zona.
• Filtrá por partidos, recitales, marchas, cortes y obras.

AVISOS
Recibí un aviso el día anterior a las 20:00 y otro dos horas antes de que empiecen los cortes cerca de tu casa.

EN EL MAPA
• Línea roja: calle cerrada según el operativo publicado.
• Línea naranja a rayas: corte parcial.
• Línea punteada: calles que rodean el lugar del evento, cuando todavía no se publicó el operativo.

La información se actualiza todos los martes y jueves. Sin registro, sin publicidad.

AVISO: Cortes CABA no es una app oficial y no está afiliada al Gobierno de la Ciudad de Buenos Aires ni a ningún club u organismo. Los eventos y cortes se recopilan de fuentes públicas, como los avisos de tránsito de buenosaires.gob.ar, agendas de espectáculos y medios de prensa. Ante cualquier duda, consultá la información oficial en https://buenosaires.gob.ar
```

## 4. Configuración de Play Store

**Crecimiento → Presencia en Play Store → Configuración de Play Store**

| Campo | Qué poner |
|---|---|
| App o juego | App |
| Categoría | Mapas y navegación |
| Etiquetas | Elegí hasta 5 de la lista (por ejemplo: Mapas, Tránsito, Eventos locales) |
| Correo electrónico | `cygosc@gmail.com` |
| Sitio web | `https://cygosc.github.io` |
| Teléfono | Dejalo vacío |

## 5. Contenido de la app

**Política → Contenido de la app** (cada sección se completa una vez)

| Sección | Qué poner |
|---|---|
| Política de privacidad | `https://cygosc.github.io/cortes-caba/privacidad.html` |
| Anuncios | No, la app no contiene anuncios |
| Acceso a la app | Toda la funcionalidad está disponible sin restricciones (no hay login) |
| Clasificación del contenido | Categoría **"Todas las demás apps"**. Respondé **No** a todo (violencia, sexo, lenguaje, drogas, apuestas, etc.). En "¿Los usuarios pueden interactuar o intercambiar contenido?" → **No**. En "¿Comparte la ubicación de los usuarios con otros usuarios?" → **No**. Resultado esperado: apta para todo público |
| Público objetivo | **18 años o más** (así no entra en las reglas de apps para niños) |
| App de noticias | No |
| Apps gubernamentales | **No** (no es una app oficial; por eso la descripción tiene el aviso de que no está afiliada al Gobierno de la Ciudad) |
| Funciones financieras | Mi app no ofrece funciones financieras |
| Salud | Mi app no tiene funciones de salud |
| Permisos de ubicación | Si lo pregunta: la ubicación se usa **solo con la app abierta**, cuando el usuario toca 📡, para mostrarlo en el mapa. No se usa en segundo plano |

### Seguridad de los datos

| Pregunta | Respuesta |
|---|---|
| ¿Tu app recopila o comparte alguno de los tipos de datos del usuario requeridos? | **Sí** |
| ¿Todos los datos se encriptan en tránsito? | **Sí** (todas las conexiones son HTTPS) |
| ¿Ofrecés una forma de pedir que se borren los datos? | **No** (la app no guarda datos fuera del teléfono; se borran desinstalándola) |

Tipo de dato que hay que marcar:

- **Actividad en la app → Historial de búsqueda en la app** (el texto que se escribe en el buscador se envía a OpenStreetMap
  para encontrar la dirección)
  - Recopilado: **Sí** · Compartido: **No**
  - ¿Se procesa de forma efímera? **Sí**
  - ¿Es obligatorio o el usuario puede elegir? **El usuario puede elegir** (el buscador es opcional)
  - Finalidad: **Funcionalidad de la app**

No marques "Ubicación": la ubicación GPS se usa solo dentro del teléfono y nunca se envía a ningún servidor.

## 6. Prueba cerrada y producción

Las cuentas de desarrollador personales tienen que hacer una **prueba cerrada con al menos 12 testers durante 14 días
seguidos** antes de poder publicar en producción. Es lo mismo que con Karen, y vale para cada app nueva.

1. **Pruebas → Prueba cerrada → Crear pista** → subí `app-release.aab`.
2. En **Testers**, armá una lista de correos (Gmail) con al menos 12 personas: la gente a la que le gustó la app.
3. Compartiles el link de "Unirse en Android" para que acepten y la instalen desde Play Store.
4. Después de 14 días con 12 o más testers, en **Panel → Solicitar acceso a producción** respondé el cuestionario y
   publicá en **Producción**.

País de distribución: **Argentina** (la app solo sirve para CABA).

## 7. Notas de la versión 1.0

```
Primera versión: partidos, recitales, marchas y cortes programados en CABA, con mapa de calles cortadas, búsqueda por dirección, "Dónde estoy" y avisos.
```
