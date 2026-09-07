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
  **administradora** automáticamente; solo ella puede invitar a nuevas personas
  (desde el panel de Supabase, ver más abajo). Cualquiera con acceso ve y registra en
  el mismo historial compartido, y cada registro queda con el nombre de quién lo puso.
- **Historial de constancia**: días seguidos registrados, total de días con registro,
  % de constancia desde el primer día, balance entre ojo derecho/izquierdo, un
  calendario de los últimos 28 días y la lista completa de registros (con opción de
  agregar uno atrasado o corregir/eliminar uno equivocado).
- **Sincronizado en vivo**: si dos personas tienen la app abierta a la vez, un
  registro nuevo aparece al instante en ambas pantallas.
- **Instalable** en el celular (ícono de pantalla de inicio, como una app nativa) y
  funciona igual desde cualquier computador o tablet con la misma cuenta.

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

## 2. Invitar a alguien nuevo

Solo la administradora puede hacerlo, y se hace **desde el panel de Supabase**, no
desde la app (para que quede completamente bajo su control):

**Authentication → Users → Invite user**, escribe el correo de la persona y
listo. Le llega un correo para elegir su propia contraseña; al aceptar, queda con
acceso a la app y aparece en **Historial → Personas con acceso**, marcada como
usuaria normal (no administradora).

## 3. Publicar en GitHub Pages

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

## Estructura del proyecto

```
index.html              pantallas de acceso + la app
css/styles.css           estilos (claro/oscuro automático)
js/supabase-config.js    credenciales de tu proyecto Supabase (paso 1.6)
js/auth.js                sesión, perfiles, invitación/recuperación de contraseña
js/core.js                fechas/horas y acceso a la tabla "registros"
js/app.js                 toda la interacción de la app
supabase/schema.sql       tablas, RLS y el disparador que crea tu perfil
manifest.json, sw.js      configuración PWA (instalable, caché del cascarón)
icons/                    íconos de la app
```

---
Hecho con cariño para el tratamiento de Mili 🩹
