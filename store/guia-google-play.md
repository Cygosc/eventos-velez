# Guía para publicar Cortes CABA en Google Play

Paso a paso, en orden. Incluye lo que aprendimos publicando Karen Cat Rescue (marcado con 💡).
Todo lo que hay que copiar y pegar está en bloques grises.

**Datos fijos de la app**

| Dato | Valor |
|---|---|
| Nombre | Cortes CABA |
| ID del paquete (no se puede cambiar nunca) | `ar.cygosc.cortescaba` |
| Versión | 1.0 (versionCode 1) |
| Correo | `cygosc@gmail.com` |
| Sitio web | `https://cygosc.github.io` |
| Política de privacidad | `https://cygosc.github.io/cortes-caba/privacidad.html` |

---

## Paso 1 — AdMob: crear la app y el bloque de anuncios

Usás la misma cuenta de AdMob de Karen y PesoTrack (ya tiene tu `app-ads.txt` publicado).

1. Entrá a https://admob.google.com → menú **Apps** → **Agregar app**.
2. Plataforma: **Android**.
3. "¿La app está publicada en una tienda de aplicaciones compatible?" → **No**.
4. Nombre: `Cortes CABA` → **Agregar app**.

   💡 **No marques Galaxy Store, Xiaomi ni ninguna otra tienda** en ningún momento. En Karen eso hizo que AdMob no
   encontrara la app, la pasara a "publicación de anuncios limitada" y dejara de mostrar anuncios. La única tienda es
   Google Play, y se vincula recién en el Paso 9.

5. AdMob te muestra el **ID de la app**, del tipo `ca-app-pub-7512587545135575~XXXXXXXXXX` (con `~`).
6. **Agregar bloque de anuncios** → **Banner** → nombre `Banner inferior` → **Crear bloque de anuncios**.
7. Copiá el **ID del bloque de anuncios**, del tipo `ca-app-pub-7512587545135575/XXXXXXXXXX` (con `/`).
8. **Pasame los dos IDs** (como hiciste con Karen). Yo los pongo en la app y apago el modo prueba.

**Dispositivo de prueba (importante):**

💡 **Nunca toques tus propios anuncios reales.** AdMob lo toma como fraude y puede suspender la cuenta, y la cuenta es la
misma de Karen y PesoTrack: se suspenderían todas.

1. En tu teléfono: **Ajustes → Google → Todos los servicios → Anuncios** y copiá el ID de publicidad.
2. En AdMob: **Configuración → Dispositivos de prueba → Agregar dispositivo de prueba**, pegalo y guardá.
3. Desde ahí, en tu teléfono los anuncios salen con la etiqueta "Test Ad" y los podés tocar sin problema.
   Hacé lo mismo con los teléfonos de los testers que quieran tocar el banner.

**Consentimiento (opcional):** la app solo se distribuye en Argentina, donde no hace falta. Si más adelante la abrís a
Europa, configurá **Privacidad y mensajes → Europa** en AdMob; la app ya muestra el formulario cuando Google lo pide.

---

## Paso 2 — Cafecito (aportes voluntarios)

1. Entrá a https://cafecito.app y creá tu cuenta (te pide CUIT/CUIL y una cuenta para cobrar, porque es en pesos).
2. Elegí tu usuario: tu link queda como `https://cafecito.app/tu_usuario`.
3. **Pasame el link.** Con eso aparece el botón "☕ ¿Te sirve la app? Invitame un cafecito" al pie de la lista
   (sin link, el botón queda oculto).

---

## Paso 3 — Generar el AAB firmado (en Android Studio)

Lo hago listo para firmar cuando me pases los IDs de los Pasos 1 y 2. Después:

1. 💡 **Pausá OneDrive** (ícono de la nube en la barra de Windows → **Pausar sincronización → 2 horas**). En Karen,
   OneDrive bloqueaba archivos y la compilación fallaba con `AccessDeniedException` o `Unable to delete directory`.
2. Android Studio → **File → Open** → la carpeta `H:\OneDrive\Diego\Eventos\android`. Esperá a que termine la barra de
   abajo ("Gradle sync").
3. **Build → Generate Signed App Bundle or APK** → **Android App Bundle** → **Next**.
4. Clave de firma (es una app nueva):
   - En **Key store path** tocá **Create new...** y guardala **fuera** de OneDrive y del proyecto, por ejemplo
     `C:\Users\cygos\Documents\claves\cortes-caba-upload.jks`.
   - Inventá una contraseña para el archivo y otra para la clave (pueden ser la misma), alias `upload`, validez 25 años,
     y completá tu nombre en "First and Last Name".
   - **Next** → variante **release** → **Create**.
5. El archivo queda en `H:\OneDrive\Diego\Eventos\android\app\release\app-release.aab`.
6. 💡 **Guardá el `.jks` y sus contraseñas con copia de seguridad** (pendrive o nube). Sin ellos no podés subir
   actualizaciones. Si se pierden, Google permite cambiar la clave de subida, pero hay que pedirlo y tarda días.
7. Avisame y reviso el AAB antes de subirlo (firma, versión, Android 16, IDs de AdMob reales y modo prueba apagado),
   como hicimos con Karen.

---

## Paso 4 — Play Console: crear la app

https://play.google.com/console → **Crear app**

| Campo | Qué poner |
|---|---|
| Nombre de la app | `Cortes CABA: calles cortadas` |
| Idioma predeterminado | Español (Latinoamérica) – es-419 |
| App o juego | **App** |
| Gratuita o pagada | **Gratuita** |
| Declaraciones | Marcá las dos casillas (políticas del programa y leyes de exportación de EE. UU.) |

→ **Crear app**. Te lleva al **Panel**, que tiene la lista de tareas "Configura tu app". Seguí los pasos 5 y 6 en ese
orden; cada tarea se marca con ✓ cuando la terminás.

---

## Paso 5 — Contenido de la app (Panel → "Configura tu app")

### 5.1 Política de privacidad
```
https://cygosc.github.io/cortes-caba/privacidad.html
```

### 5.2 Acceso a la app
**Toda la funcionalidad está disponible sin acceso especial** (no hay login).

### 5.3 Anuncios
**Sí, mi app contiene anuncios.**

### 5.4 Clasificación del contenido
- Correo: `cygosc@gmail.com` · Categoría: **Todas las demás apps** (no es juego, ni red social, ni de noticias).
- Respondé **No** a todo: violencia, sexo, lenguaje, drogas, apuestas, contenido generado por usuarios, etc.
- "¿Los usuarios pueden interactuar o intercambiar contenido?" → **No**.
- "¿Comparte la ubicación actual del usuario con otros usuarios?" → **No**.
- "¿Permite comprar productos digitales?" → **No**.
- "¿La app contiene anuncios?" (si lo pregunta) → **Sí**.
- Resultado esperado: apta para todo público.

### 5.5 Público objetivo
- Edades: **18 años o más**.
- 💡 Así no entra en las reglas para apps de chicos ("Familias"), que son mucho más estrictas con los anuncios.
- "¿Podría atraer a niños?" → **No**.

### 5.6 App de noticias
**No.**

### 5.7 ID de publicidad
💡 **Respondé "Sí"** y marcá **Publicidad o marketing**. AdMob usa el ID de publicidad; si respondés que no, Play
rechaza la versión al subirla.

### 5.8 Apps gubernamentales
**No.** La app no es oficial; por eso la descripción tiene el aviso de que no está afiliada al Gobierno de la Ciudad.

### 5.9 Funciones financieras / Salud
- Funciones financieras: **Mi app no ofrece ninguna de estas funciones**.
- Salud: **Mi app no tiene funciones relacionadas con la salud**.

### 5.10 Seguridad de los datos

Primera pantalla:

| Pregunta | Respuesta |
|---|---|
| ¿Tu app recopila o comparte alguno de los tipos de datos del usuario requeridos? | **Sí** |
| ¿Todos los datos se encriptan en tránsito? | **Sí** |
| Métodos de creación de cuentas | **Mi app no permite que los usuarios creen una cuenta** |
| ¿Acceso con cuentas creadas fuera de la app? | **No** |
| ¿Ofrecés una forma de pedir que se borren los datos? | **No** |
| Insignias adicionales | No marques nada |

Tipos de datos — marcá **solo estos cinco**:

| Categoría → tipo | Recopilado | Compartido | ¿Efímero? | ¿Obligatorio? | Finalidades |
|---|---|---|---|---|---|
| **Ubicación → Ubicación aproximada** | Sí | Sí | No | Obligatorio | Publicidad o marketing · Estadísticas · Prevención de fraudes, seguridad y cumplimiento |
| **Actividad en la app → Interacciones con la app** | Sí | Sí | No | Obligatorio | Publicidad o marketing · Estadísticas |
| **Actividad en la app → Historial de búsqueda en la app** | Sí | No | No | El usuario puede elegir | Funcionalidad de la app |
| **Rendimiento e información de la app → Registros de fallas** y **Diagnóstico** | Sí | Sí | No | Obligatorio | Estadísticas |
| **Dispositivo u otros identificadores → Dispositivo u otros identificadores** | Sí | Sí | No | Obligatorio | Publicidad o marketing · Estadísticas · Prevención de fraudes, seguridad y cumplimiento |

- La "Ubicación aproximada" es la que AdMob deduce de la dirección IP, **no** la del GPS.
- El "Historial de búsqueda" es el texto del buscador de direcciones, que se envía a OpenStreetMap.
- **No marques** Ubicación precisa: el GPS se usa solo dentro del teléfono y nunca sale de él.
- Tampoco marques nombre, correo, fotos, contactos ni información financiera.

Al final, el resumen debería decir: "Datos compartidos: Ubicación, Actividad en la app, Rendimiento e información de la
app, Dispositivo u otros identificadores".

---

## Paso 6 — Ficha de Play Store

### 6.1 Ficha principal (Crecimiento → Presencia en Play Store → Ficha de Play Store principal)

| Campo | Qué poner |
|---|---|
| Ícono (512 × 512) | `store/icon-512.png` |
| Gráfico destacado (1024 × 500) | `store/feature-graphic.png` |
| Capturas del teléfono | `store/screenshots/` → las 5, en orden del 1 al 5 |
| Video, capturas de tablet / Chromebook | Dejalos vacíos |

**Nombre de la app** (28/30):
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

La información se actualiza todos los martes y jueves. Sin registro. Solo un banner chico abajo, sin anuncios que interrumpan.

AVISO: Cortes CABA no es una app oficial y no está afiliada al Gobierno de la Ciudad de Buenos Aires ni a ningún club u organismo. Los eventos y cortes se recopilan de fuentes públicas, como los avisos de tránsito de buenosaires.gob.ar, agendas de espectáculos y medios de prensa. Ante cualquier duda, consultá la información oficial en https://buenosaires.gob.ar
```

### 6.2 Configuración de Play Store (Crecimiento → Presencia en Play Store → Configuración de Play Store)

| Campo | Qué poner |
|---|---|
| App o juego | App |
| Categoría | **Mapas y navegación** |
| Etiquetas | Hasta 5 de la lista (por ejemplo: Mapas, Tránsito, Navegación) |
| Correo electrónico | `cygosc@gmail.com` |
| Sitio web | `https://cygosc.github.io` |
| Teléfono | Vacío |

💡 En **Sitio web** va la raíz `https://cygosc.github.io`, sin carpeta: AdMob busca ahí el `app-ads.txt` para verificar
que la app es tuya.

---

## Paso 7 — Prueba cerrada (obligatoria: 12 testers, 14 días)

Las cuentas personales tienen que probar cada app nueva con **al menos 12 testers durante 14 días seguidos** antes de
poder publicarla para todos.

1. **Probar y publicar → Pruebas → Prueba cerrada** → **Crear pista** (o usá la "Alpha" que ya viene) → **Administrar pista**.
2. **Países y regiones** → agregá **Argentina**.
3. **Testers** → **Crear lista de correo** → nombre `Testers Cortes CABA` → pegá los Gmail de los testers (uno por
   línea o separados por coma) → guardá y marcá la lista. Poné tu correo como "comentarios" (`cygosc@gmail.com`).
4. **Crear versión** → subí `app-release.aab`.
   - 💡 Si aparecen **avisos amarillos** por "archivo de desofuscación" o "símbolos de depuración nativos", ignoralos: no son errores.
   - 💡 En la biblioteca la versión figura como **"1 (1.0)"**: el 1 es el número interno; la gente ve "1.0".
   - Nombre de la versión: `1.0`. Notas de la versión:
     ```
     <es-419>
     Primera versión: partidos, recitales, marchas y cortes programados en CABA, con mapa de calles cortadas, búsqueda por dirección, "Dónde estoy" y avisos.
     </es-419>
     ```
5. **Siguiente → Guardar** → andá a **Descripción general de la publicación** → **Enviar cambios para revisión**.
   💡 Si no tocás este botón, los cambios quedan guardados pero nadie los revisa. La primera revisión puede tardar de
   unas horas a 7 días.
6. Cuando esté aprobada, en la pista → **Testers** → copiá el **link para unirse (Android)** y mandáselo a los testers
   junto con este texto:

```
¡Gracias por probar Cortes CABA! 🚧

1. Abrí este link desde el celular (con el mismo Gmail que me pasaste) y tocá "Aceptar invitación": <LINK>
2. Instalala desde Play Store y dejala instalada al menos 14 días (es un requisito de Google).

Qué probar:
• Mirá los eventos de la lista y tocá uno: el mapa muestra las calles que se cortan.
• 📍 Marcá tu casa y elegí el radio: la lista muestra solo lo que pasa cerca.
• 📡 Tocá el botón del mapa para ver los cortes donde estás.
• 🔎 Buscá una dirección o una esquina ("Corrientes y Callao").
• Mantené presionado el mapa en cualquier zona.
• 🔔 Activá los avisos.

Si algo falla o se ve raro, mandame una captura. ¡Gracias!
```

💡 Los 12 testers tienen que **aceptar la invitación e instalarla**, y no salirse de la prueba durante los 14 días.
Conviene invitar a 15 o más por si alguno se olvida.

---

## Paso 8 — Pedir acceso a producción (después de los 14 días)

1. **Panel** → **Solicitar acceso a producción** (aparece cuando se cumplen los 14 días con 12 testers).
2. Respondé el cuestionario con tus palabras. Ideas:
   - **Cómo reclutaste testers:** amigos, familiares y vecinos de CABA que usan la app para saber qué calles se cortan.
   - **Qué comentarios recibiste y qué cambiaste:** por ejemplo el arreglo del buscador en el teléfono, la búsqueda
     manteniendo presionado el mapa, el botón "Dónde estoy" y la ampliación de Vélez a toda la Ciudad.
   - **Público:** vecinos de CABA y gente que se mueve por la Ciudad.
   - **Por qué está lista:** se probó en distintos teléfonos, los datos se actualizan dos veces por semana y los errores
     reportados se corrigieron.
3. Google responde en unos días. Cuando aprueba: **Producción → Crear versión** → **Agregar desde biblioteca** (el mismo
   AAB) → **Países: Argentina** → **Enviar cambios para revisión**.

---

## Paso 9 — Vincular AdMob con Google Play (cuando ya está publicada)

💡 En Karen, AdMob decía "No se puede encontrar ninguna aplicación de Google Play que coincida": es porque **solo se
puede vincular cuando la app está en Producción y visible en Play Store.** Mientras está en prueba cerrada, es normal
que AdMob diga "configuración incompleta" y que haya pocos anuncios o ninguno.

1. Esperá 1 o 2 días después de que salga en Producción, hasta que aparezca buscándola en Play Store.
2. AdMob → **Apps → Cortes CABA → Configuración de la app** → **Tiendas de aplicaciones → Agregar** → **Google Play**
   → buscá `ar.cygosc.cortescaba` → **Agregar**.
3. AdMob la revisa sola en unos días. Revisá también que en **Apps → Ver todas → app-ads.txt** figure como verificado.

---

## Paso 10 — Actualizaciones

- **Eventos nuevos:** no hace falta hacer nada. La tarea en la nube los carga martes y jueves y la app los descarga sola.
- **Cambios en la app:** subo `versionCode` (1 → 2 → 3…) y `versionName` (1.0 → 1.1…), generás el AAB con **la misma
  clave `.jks`**, y lo subís en **Producción → Crear versión → Enviar cambios para revisión**.
