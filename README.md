# Ojitos de Mili

App web instalable (PWA) para registrar, día a día, qué ojo lleva el parche del
tratamiento de Mili. **Los datos viven en tu propio proyecto de Supabase** (Postgres +
Auth) — no en un servidor de terceros — y se sincronizan al instante entre todos los
dispositivos y personas con acceso (mamá, papá, quien cuide a Mili ese día).
**Necesita internet para funcionar.**

Publicada en: **https://holbaph.github.io/ojitos-de-mili/**

## Qué incluye

- **Carita interactiva**: toca el ojo derecho o izquierdo de Mili para registrar en
  cuál quedó puesto el parche hoy, con la hora exacta. Un aviso te recuerda cuál tocó
  la última vez, para no repetir lado por error.
- **Cuentas por invitación, con un administrador**: inicias sesión con correo y
  contraseña — no hay registro público. La primera cuenta que se cree queda como
  **administradora** automáticamente; solo ella ve el botón para invitar a nuevas
  personas (ver más abajo). Cualquiera con acceso ve y registra en el mismo
  historial compartido, y cada registro queda con el nombre de quién lo puso.
- **Historial de constancia**: días seguidos registrados, total de días con registro,
  % de constancia desde el primer día, balance entre ojo derecho/izquierdo, un
  calendario de los últimos 28 días y la lista completa de registros (con opción de
  agregar uno atrasado o corregir/eliminar uno equivocado).
- **Sincronizado en vivo**: si dos personas tienen la app abierta a la vez, un
  registro nuevo aparece al instante en ambas pantallas.
- **Instalable** en el celular (ícono de pantalla de inicio, como una app nativa) y
  funciona igual desde cualquier computador o tablet con la misma cuenta.
- **Temporizador con reloj de arena**: apenas se registra el parche del día, aparece
  un reloj de arena animado mostrando cuánto falta — pensado para que la propia Mili
  pueda mirarlo y entender cuánto queda, sin tener que preguntar. La duración
  (cuántos minutos va el parche puesto) se configura y se puede cambiar cuando
  quieras, en Historial → Temporizador y avisos.
- **Avisos aunque la app esté cerrada**: al activarlos en un dispositivo (mismo
  bloque de Ajustes), llega una notificación exactamente cuando se cumple el
  tiempo — no hace falta tener la app abierta ni el celular desbloqueado.
- **Recordatorio diario**: en Historial → Temporizador y avisos se elige una hora
  (por ejemplo, 9:00 a.m.) y cada día, a esa hora, llega un aviso para ponerle el
  parche a Mili — solo si todavía nadie lo registró ese día. Llega a los mismos
  dispositivos que tienen los avisos activados.
- **Mili personalizable**: con el botón **🎨 Personalizar** se elige su color de
  piel y de ojos; 17 peinados, 5 flequillos y el color de pelo; la ropa (vestidos,
  poleras, camisas, suéteres, jeans, calzas, faldas, tutú, jardinera, enterito,
  chaquetas, abrigo… con estampado y colores); zapatos (zapatillas, botas, botas
  de lluvia, guillerminas, pantuflas, patines…); coronas y gorros (corona, corona
  de flores o de estrellas, gorro de lana, jockey, sombrero, orejitas, cuerno de
  unicornio); joyas (aros, collares, reloj, pulseras, anillos); lentes; y **el parche** (forma ovalada, redonda, de
  corazón o nube; estampado liso, lunares, corazones, estrellas, rayas o arcoíris;
  color y un adornito). Toda la familia ve a la misma Mili.
- **Juego "Jugar a vestir"**: se elige un personaje (Mili; Rumi, Mira y Zoey;
  Elsa, Anna, Kristoff, Olaf, Sven y los reyes Agnarr e Iduna; Moana; Rapunzel,
  Ariel, Bella, Cenicienta, Mérida, Tiana y Jasmine; la familia Madrigal
  (Mirabel, Abuela Alma, Isabela, Luisa, Pepa, Dolores, Camilo, Antonio y
  Bruno); Lilo, Stitch y Ángel; Mickey y Minnie; Luli Pampín y Blippi — dibujos propios
  inspirados en esas películas, no imágenes oficiales; Olaf, Sven, Stitch y
  Ángel solo usan accesorios porque la ropa no les calza) y
  se le cambia la ropa arrastrando prendas del armario hasta el personaje (o
  tocándolas): poleras, tops, polerones, jeans, faldas, vestidos, chaquetas,
  capas, zapatillas, botas, peinados, color de pelo, ojos, moños, tiaras,
  lentes, cola de sirena… Todo se guarda solo. **Original** le devuelve su ropa
  de siempre y **En blanco** lo deja sin ropa ni accesorios.
  Con **📸 Foto** se abre una cámara estilo Snapchat: **tocar** el botón saca
  la foto (a la resolución completa de la cámara) y **mantenerlo apretado**
  graba un video de hasta 15 s. Abajo hay un carrusel con tres pestañas:
  **🧸 Personaje** (quieto con una pose animada; se mueve con el dedo y se
  agranda pellizcando o con ➕/➖), **✨ Con IA** (el personaje juega con quien
  sale en la foto: 🎲 Sorpresa, 🪞 Copión — imita tus brazos —, ✋ Choca 5 —
  levanta la mano y te la choca —, 💃 Baile, 🙈 Escondidas, 🧚 en tu hombro,
  🤗 abrazo por detrás, 🐰 orejas de conejo, 🫧 burbujas, 🦋 mariposas,
  🎈 globos, 👑 corona, 😘 besito, 🤝 mano en el hombro y 👋 hola) y **🎭
  Filtros** de cara (🐶 perrito — saca la lengua si abres la boca —, 🐰
  conejita, 🐱 gatito, 👑 princesa, 😍 ojos de corazón, 🦄 unicornio — arcoíris
  al abrir la boca —, 🏴‍☠️ pirata, ✨ brillitos), que se combinan con el
  personaje. Al costado: ⏱ foto con 3 segundos de espera, 🎨 color de la
  imagen (vívido, cálido, frío, soñado, blanco y negro), 🩹 parche (con Mili)
  y ↔️ voltear. Las fotos y videos quedan en **Mis fotos**, guardados **solo
  en ese celular** (no se suben a ningún lado), y se pueden guardar en la
  galería o compartir. La IA es MediaPipe (detecta el cuerpo, la silueta y la
  cara) y corre en el mismo celular: la imagen no se envía a ningún lado.
- **📸 Foto con mi avatar**: bajo el avatar, en la pantalla principal; abre la
  misma cámara con Mili tal cual está en su avatar (no gasta tiempo de juego).
  La Mili del juego de vestir también queda igual al avatar cada vez que este
  cambia.
- **Juegos con el parche**: cinco juegos de visión fina para entretenerse
  *mientras* se usa el parche (así trabaja el ojito destapado): 🔍 Diferencias,
  ⭐ Busca a…, ✏️ Une los puntos, 〰️ Sigue el caminito y 🫧 Burbujas. Tienen
  niveles que se van poniendo más difíciles y dan estrellitas ⭐. Son para
  acompañar el tratamiento, **no lo reemplazan** ni son ejercicios indicados
  por un oftalmólogo.
- **Un solo tiempo de juego**: en Historial → **Tiempo de juego** se fijan los
  minutos por día, que valen para "Jugar a vestir" y "Juegos con el parche"
  sumados. Al acabarse, los juegos se cierran solos hasta el día siguiente (o
  hasta tocar **Dar más tiempo hoy**).
  El guardarropa es el mismo del avatar de Mili (coronas, joyas, etc.).

## 1. Configurar Supabase (una sola vez)

La app necesita un proyecto de Supabase propio para guardar los datos y las cuentas.
Es gratis y toma unos minutos:

1. Crea una cuenta gratis en **https://supabase.com** y un proyecto nuevo.
2. Ve a **SQL Editor → New query**, pega el contenido completo de
   [`supabase/schema.sql`](supabase/schema.sql) y presiona **Run**. Esto crea las
   tablas `profiles` y `registros`, sus permisos (RLS) y el disparador que arma tu
   perfil automáticamente al crear tu cuenta.
3. Ve a **Authentication → URL Configuration** y en **Site URL** pon
   `https://holbaph.github.io/ojitos-de-mili/` (o el dominio donde la publiques).
   Agrega esa misma URL en **Redirect URLs**. Esto hace que los correos de
   invitación y recuperación de contraseña te devuelvan a la app.
4. Ve a **Authentication → Users → Invite user**, escribe tu propio correo y
   envíate la invitación. Te llegará un correo para elegir tu contraseña — esa
   primera cuenta queda como **administradora** automáticamente.
5. Ve a **Project Settings → API** y copia la **Project URL** y la **anon public**
   key.
6. Abre [`js/supabase-config.js`](js/supabase-config.js) y reemplaza `SUPABASE_URL`
   y `SUPABASE_ANON_KEY` con esos dos valores. Guarda y sube el cambio (`git add`,
   `git commit`, `git push`) para que quede publicado.

Esos dos valores son públicos por diseño (los usa cualquiera que abra la app en su
navegador); la seguridad real la dan las políticas de la base de datos (RLS) del
script SQL — sin haber iniciado sesión, esas claves no permiten leer ni escribir nada.

## 2. Activar el botón "Invitar" dentro de la app (Edge Function)

Solo la administradora/or ve y puede usar el botón **Invitar** (en Historial →
Personas con acceso). Para que funcione, hay que desplegar una función de
Supabase que hace la invitación por ti — es la única forma segura de hacerlo,
porque invitar gente requiere una clave que nunca debe llegar al navegador
(`supabase/functions/invite-user/index.ts` ya está escrita, solo falta subirla).

1. Instala la CLI de Supabase (una sola vez en tu computador). En Windows con
   [Scoop](https://scoop.sh): `scoop install supabase`. En Mac: `brew install supabase/tap/supabase`.
   (Otras opciones en <https://supabase.com/docs/guides/cli>.)
2. Abre una terminal en la carpeta de este proyecto y entra sesión:
   ```
   supabase login
   ```
   Se abre el navegador para que confirmes con tu cuenta de Supabase.
3. Conecta la carpeta con tu proyecto (el ID está en la URL de tu proyecto,
   `https://supabase.com/dashboard/project/<ID>`, o en Project Settings → General):
   ```
   supabase link --project-ref TU-PROJECT-REF
   ```
4. Despliega la función:
   ```
   supabase functions deploy invite-user
   ```

Y listo — el botón **Invitar** ya funciona dentro de la app. Cada vez que cambies
`supabase/functions/invite-user/index.ts`, vuelve a correr `supabase functions
deploy invite-user` para actualizarla.

**Alternativa sin CLI:** si prefieres no instalar nada, puedes seguir invitando
igual desde **Authentication → Users → Invite user** en el panel de Supabase —
funciona exactamente igual, solo que fuera de la app.

## 3. Activar el temporizador y los avisos (Edge Function + cron)

Esto hace que, cuando se cumpla el tiempo del parche, llegue una notificación al
celular aunque nadie tenga la app abierta. Usa **Web Push** (el mismo mecanismo
de notificaciones de cualquier app, pero para páginas web) — funciona en iPhone
si la app está agregada a la pantalla de inicio (iOS 16.4 o más nuevo).

1. Corre [`supabase/schema_temporizador.sql`](supabase/schema_temporizador.sql)
   completo en **SQL Editor** (igual que hiciste con `schema.sql` en el paso 1).
   Esto agrega la tabla de duración configurable, las suscripciones de aviso, y
   programa (`pg_cron`) una revisión automática cada minuto.
2. Guarda las llaves VAPID como secretos de tus Edge Functions (con la CLI, misma
   terminal del paso 2 de arriba):
   ```
   supabase secrets set VAPID_PUBLIC_KEY=<la llave pública de js/supabase-config.js>
   supabase secrets set VAPID_PRIVATE_KEY=<la llave privada>
   ```
   *(Para generar un par nuevo: `npx web-push generate-vapid-keys`. La
   **pública** va en `js/supabase-config.js`; la **privada** va SOLO como
   secreto de Supabase — nunca en este repositorio, que es público.)*
3. Despliega la función que manda los avisos:
   ```
   supabase functions deploy send-patch-reminders
   ```
4. En la app, ve a Historial → **Temporizador y avisos** → **Activar avisos en
   este dispositivo**, en cada celular donde quieras recibirlos (recuerda: tiene
   que estar agregada a la pantalla de inicio primero, no una pestaña suelta de
   Safari/Chrome).

### 3b. Activar el recordatorio diario

Usa las mismas piezas del paso 3 (avisos push y el cron de cada minuto), así que
solo hay que agregar dos cosas:

1. Corre [`supabase/schema_recordatorio.sql`](supabase/schema_recordatorio.sql)
   completo en **SQL Editor** (agrega la hora del recordatorio a `configuracion`).
2. Vuelve a desplegar la función de avisos, que ahora también revisa el
   recordatorio:
   ```
   supabase functions deploy send-patch-reminders
   ```

Después, en la app: Historial → **Temporizador y avisos** → elige la hora del
recordatorio → **Guardar**. El aviso sale dentro de la hora siguiente a la
elegida (si se guarda una hora que ya pasó hoy, parte mañana) y una sola vez al
día.

### 3c. Activar "Personalizar a Mili"

Corre [`supabase/schema_apariencia.sql`](supabase/schema_apariencia.sql) en
**SQL Editor** (agrega a `configuracion` la columna donde se guarda cómo se ve
Mili). No hace falta desplegar nada más.

### 3d. Activar el juego de vestir

Corre [`supabase/schema_juego.sql`](supabase/schema_juego.sql) en **SQL Editor**
(agrega a `configuracion` dónde se guarda la ropa de cada personaje y los
minutos de juego por día). Sin esto el juego igual funciona, pero la ropa se
guarda solo en ese dispositivo.

### 3e. Refuerzo de seguridad (obligatorio)

1. Corre [`supabase/schema_seguridad.sql`](supabase/schema_seguridad.sql) en
   **SQL Editor**. Hace que cada persona solo pueda cambiar su **nombre** (no
   su rol), limpia los nombres, exige tener perfil para ver o cambiar datos y
   que cada registro quede firmado por quien lo hizo.
2. Despliega la función para **quitar acceso** (el admin la usa desde
   Historial → Personas con acceso):
   ```
   supabase functions deploy remove-user
   ```
3. En el panel de Supabase, **Authentication → Sign In / Providers**:
   - Desactiva **"Allow new users to sign up"**: así nadie puede crearse una
     cuenta sola; solo entran las personas que invita el admin (las
     invitaciones siguen funcionando).
   - En **Email**, sube **"Minimum password length"** a **8**.

## 4. Publicar en GitHub Pages

Si clonaste este repo tal cual, en **Settings → Pages** del repositorio elige
**Deploy from a branch**, rama `main`, carpeta `/ (root)`. GitHub publicará la app en
`https://<tu-usuario>.github.io/<nombre-del-repo>/` en un par de minutos. Cada
`git push` a `main` actualiza la app publicada automáticamente.

## Cómo instalarla en el celular

1. Abre el navegador (Safari en iPhone, Chrome en Android) y entra a la URL
   publicada.
2. Inicia sesión con tu correo y la contraseña que elegiste al aceptar la invitación.
3. Toca **Compartir → Agregar a pantalla de inicio** (iPhone) o el menú **⋮ →
   Instalar app** (Android/Chrome).
4. Abre la app siempre desde ese ícono — se ve a pantalla completa, como una app
   nativa. Necesitas internet cada vez que la uses.

## Seguridad

- **Quién entra:** solo las personas invitadas por el admin (el registro
  público debe estar desactivado, ver 3e). Las contraseñas nuevas piden al
  menos 8 caracteres.
- **Qué puede hacer cada perfil:** todas las cuentas ven y registran el parche
  y cambian la configuración (es compartida en familia). Solo el **admin**
  invita y **quita el acceso** a otras personas; nadie puede cambiarse el rol a
  sí mismo. Al quitar el acceso, la persona queda fuera al instante en todos
  sus dispositivos.
- **Datos en el celular:** las fotos y videos de la cámara quedan **solo** en
  ese dispositivo (no se suben a ningún lado); la IA de la cámara corre en el
  celular. El service worker guarda únicamente los archivos de la app, nunca
  registros, nombres ni correos.
- **En la página:** política de seguridad (CSP) que solo permite scripts de la
  app y de jsDelivr, la librería de Supabase con versión fija y huella
  (`integrity`), nombres mostrados siempre como texto, y la app no se deja
  abrir dentro de otra página.
- **Claves:** la URL y la anon key de Supabase y la llave VAPID **pública**
  son públicas por diseño. La service role key y la llave VAPID **privada**
  viven solo como secretos de Supabase.

## Estructura del proyecto

```
index.html              pantallas de acceso + la app
css/styles.css           estilos (claro/oscuro automático)
js/inicio.js             registra el service worker y bloquea abrir la app dentro de otra página
js/supabase-config.js    credenciales de tu proyecto Supabase (paso 1.6)
js/auth.js                sesión, perfiles, invitación/recuperación de contraseña
js/core.js                fechas/horas y acceso a la tabla "registros"
js/vestuario.js           dibuja a una persona completa: pelo, ropa, zapatos, coronas, joyas, lentes
js/mili.js                el avatar de Mili (apariencia, parche) usando vestuario.js
js/tiempo-juego.js        el reloj de juego compartido (vestir + juegos con el parche)
js/juego.js               juego de vestir personajes (armario, arrastrar, tiempo por día)
js/camara.js              foto con el personaje + "Mis fotos" (solo en el dispositivo)
js/ar.js                  realidad aumentada: el avatar abraza, hace orejitas, etc.
js/juegos-parche.js       juegos de visión fina para el rato con el parche puesto
js/app.js                 toda la interacción de la app
supabase/schema.sql            tablas, RLS y el disparador que crea tu perfil
supabase/schema_temporizador.sql  duración, suscripciones push y el cron (paso 3)
supabase/schema_recordatorio.sql  hora del recordatorio diario (paso 3b)
supabase/schema_apariencia.sql    apariencia personalizable de Mili (paso 3c)
supabase/schema_juego.sql         ropa de los personajes y minutos de juego (paso 3d)
supabase/schema_seguridad.sql     refuerzo de seguridad: roles, nombres, acceso solo con perfil (paso 3e)
supabase/functions/invite-user           Edge Function que envía invitaciones (paso 2)
supabase/functions/send-patch-reminders  Edge Function que manda los avisos y el recordatorio (pasos 3 y 3b)
supabase/functions/remove-user           Edge Function para que el admin quite el acceso (paso 3e)
manifest.json, sw.js      configuración PWA (instalable, caché del cascarón, avisos push)
icons/                    íconos de la app
```

---
Hecho con cariño para el tratamiento de Mili 🩹
