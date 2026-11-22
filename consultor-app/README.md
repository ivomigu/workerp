# Agenda Consultor

App de Expo (iOS y Android) para que los clientes de un consultor financiero vean los
horarios libres, agenden una cita y la confirmen.

## Modo demostración

Si abres la app **sin** configurar Supabase (sin archivo `.env.local`), funciona en **modo
demostración**: trae citas de ejemplo de otros clientes, puedes reservar, cancelar y entrar como
consultor con `demo@consultor.mx` / `demo1234` (ya vienen escritos). Todo se guarda solo en ese
teléfono y no se envían emails. Un aviso arriba lo indica; al tocarlo puedes reiniciar los datos
de ejemplo.

Para forzarlo aunque tengas Supabase configurado, añade `EXPO_PUBLIC_DEMO=1` a `.env.local`.
Cuando pongas tus datos de Supabase en `.env.local`, la app deja el modo demostración sola.

## Probarla en tu celular con Expo Go

Necesitas Node.js 20 o más nuevo en la computadora (https://nodejs.org).

1. Instala **Expo Go** en tu iPhone (App Store) o Android (Google Play), en su última versión.
2. Conecta la computadora y el celular a **la misma red WiFi**.
3. En una terminal, dentro de esta carpeta:

   ```bash
   npm install
   npx expo start
   ```

4. Aparece un código QR en la terminal.
   - **iPhone:** escanéalo con la app Cámara y toca el aviso de Expo Go.
   - **Android:** abre Expo Go y toca «Scan QR code».

Mientras la terminal siga abierta, cada cambio que guardes se ve al instante en el celular.

## Si no abre

| Qué pasa | Qué hacer |
| --- | --- |
| Se queda cargando o dice «Could not connect» / «timed out» | El celular no llega a tu computadora. Comprueba que están en la misma WiFi (no datos móviles, no la red de invitados) y vuelve a intentar. Si sigue, usa el túnel: `npx expo start --tunnel` y escanea el QR nuevo. |
| `--tunnel` pide instalar `@expo/ngrok` | Responde que sí (`Y`). |
| Expo Go dice que el proyecto usa otro SDK («incompatible SDK version») | Actualiza Expo Go desde la tienda. Este proyecto usa el SDK 58. |
| Pantalla roja con un error | Pulsa `r` en la terminal para recargar. Si sigue, cierra con `Ctrl+C` y corre `npx expo start --clear`. |
| `npm install` falla | Revisa la versión de Node con `node -v` (debe ser 20 o más) y vuelve a correr `npm install`. |
| No ves el QR en la terminal | Pulsa `?` para ver las opciones; o abre Expo Go y escribe a mano la dirección `exp://...` que muestra la terminal. |
| El firewall de Windows pregunta por Node.js | Permite el acceso en redes privadas. |

## Zona horaria

Los horarios de atención están en **hora del centro de México** (`America/Mexico_City`), y la app
muestra todas las horas en esa zona, esté donde esté el cliente (Cancún, Tijuana o el
extranjero). Si algún día atiendes desde otra zona, cambia `zonaHoraria` y `nombreZona` en
`src/constants/consultor.ts`, el secret `ZONA_HORARIA` de la Edge Function y la zona de la
vista `agenda_consultor`.

## Dónde cambiar cosas

- `src/constants/consultor.ts`: nombre, horario de atención, duración, temas.
- `src/constants/colors.ts`: colores (usa los colores del sistema).
- `src/screens/`: las pantallas. `src/app/`: la navegación (cada archivo es una ruta).

## Conectar con Supabase (para que veas todas las citas)

Todo el SQL que necesitas está en `supabase/pasos/`, en tres archivos que se ejecutan en orden:
`1-base.sql` (la agenda), `2-consultor.sql` (tu acceso al panel) y `3-emails.sql` (los emails).
La carpeta `supabase/migrations/` es el historial de cambios; si ya ejecutaste esos archivos,
no hace falta repetir nada.

Las citas se guardan en Supabase. Cada teléfono entra como usuario anónimo (el
cliente no se registra) y solo puede ver y cancelar sus propias citas. Tú las ves
todas desde el panel de Supabase.

1. Crea un proyecto gratis en https://supabase.com.
2. **SQL Editor → New query**: pega todo el archivo `supabase/pasos/1-base.sql` y pulsa
   **Run** (no hay nada que cambiar).
3. **Authentication → Sign In / Providers**: activa **Allow anonymous sign-ins**.
4. **Project Settings → API** (o *Data API* / *API Keys*): copia la **Project URL**
   y la clave **publishable** (en proyectos antiguos se llama **anon public**).
   Nunca uses la *secret* ni la *service_role* en la app.
5. Copia `.env.example` como `.env.local` y pega esos dos valores.
6. Reinicia con `npx expo start --clear`.

### Ver las citas

En Supabase → **Table Editor → agenda_consultor**: fecha, hora, estado, nombre,
teléfono, email, modalidad, tema y comentario, de la más reciente a la más antigua.

### Recibir un email cuando alguien agenda o cancela

Usa [Resend](https://resend.com) (gratis hasta 3.000 emails al mes) y una Edge Function.

1. **Resend:** crea una cuenta con tu email y ve a **API Keys → Create API Key**. Copia la clave
   (empieza por `re_`). Sin dominio propio, Resend solo envía a tu propio email, que es justo lo
   que necesitas.
2. **Inventa una clave secreta** larga (por ejemplo, 30 letras y números al azar). La usarás en
   los pasos 3 y 5.
3. **Supabase → Edge Functions → Secrets**: añade
   - `RESEND_API_KEY` = la clave de Resend
   - `AVISO_EMAIL` = tu email
   - `AVISO_SECRETO` = la clave secreta del paso 2
   - `ZONA_HORARIA` = `America/Mexico_City` (opcional; es el valor por defecto)
4. **Supabase → Edge Functions → Deploy a new function → Via Editor**: llámala
   `aviso-nueva-cita`, pega el contenido de `supabase/functions/aviso-nueva-cita/index.ts` y
   pulsa **Deploy**. Después, en los ajustes de la función, **desactiva «Verify JWT»**
   (la función se protege con tu clave secreta).
5. **SQL Editor**: abre `supabase/pasos/3-emails.sql`, cambia las dos líneas marcadas con
   «CAMBIA» (tu Project URL y la clave secreta del paso 2) y pulsa **Run**. Si te equivocas,
   corrígelo y vuelve a ejecutarlo.
6. Agenda una cita de prueba desde la app y luego cancélala. Te llegan dos emails en unos segundos.

Si no llega: mira **Edge Functions → aviso-nueva-cita → Logs**. `401` significa que la clave
secreta no coincide entre el paso 3 y el 5; `502` significa que Resend rechazó el envío
(revisa la clave de Resend y que `AVISO_EMAIL` sea el email de tu cuenta de Resend).
Para corregir la URL o la clave del SQL: **Project Settings → Vault** (`aviso_url`, `aviso_secreto`).

### Panel del consultor dentro de la app

Al pie de la pantalla «Agendar» hay un enlace discreto, **Acceso consultor**. Ahí entras con
tu email y contraseña y ves todas las citas agrupadas por día, con botones para llamar, escribir
por WhatsApp o email, y cancelar.

1. **Authentication → Users → Add user → Create new user**: tu email y una contraseña,
   marcando **Auto Confirm User**.
2. **SQL Editor**: abre `supabase/pasos/2-consultor.sql`, cambia la línea marcada con «CAMBIA»
   por ese email y pulsa **Run**. Al final debe aparecer tu email.
3. En la app: **Agendar → Acceso consultor** y entra.

Solo las cuentas de la tabla `consultores` pueden ver el panel. Si cancelas tú una cita, no te
llega el email de cancelación; el cliente recibe un email si dejó el suyo (ver «Email de
confirmación para el cliente»). Si no dejó email, avísale con los botones de la ficha.

### Teléfonos con código de país

Si el cliente escribe su teléfono sin código de país, la app lo añade sola usando el país
configurado en su teléfono (México → +52, España → +34…), y lo guarda en formato internacional
(+525512345678). Así los botones de llamar y WhatsApp funcionan desde cualquier país. Si el
teléfono del cliente no indica su país, se usa `codigoPais` de `src/constants/consultor.ts`
(por defecto +52, México): cámbialo si atiendes desde otro país.

### Email de confirmación para el cliente

Cuando un cliente deja su email, recibe un email «Cita confirmada» con fecha, hora, modalidad y
tema, y un archivo `cita.ics` para añadir la cita a su calendario (con recordatorio 1 hora antes).
Si responde a ese email, la respuesta te llega a ti.
Si el cliente cancela desde la app, también recibe un email «Cita cancelada». Si cancelas tú (desde
el panel de la app o desde Supabase), el cliente recibe «Tu cita fue cancelada» y a ti no te llega
aviso, porque ya lo sabes.

Para escribir a los clientes, Resend exige un **dominio propio verificado** (por ejemplo
`tuconsultoria.mx`). Sin él, solo te llegan tus avisos.

1. **Resend → Domains → Add Domain**: escribe tu dominio y añade los registros DNS que te
   indica en el sitio donde lo compraste (GoDaddy, Namecheap, Cloudflare…). Espera a que salga
   **Verified**.
2. **Supabase → Edge Functions → Secrets**: añade
   - `AVISO_REMITENTE` = `Tu Nombre <citas@tudominio.mx>` (con tu dominio verificado)
   - `CONSULTOR_NOMBRE` = tu nombre tal como lo verán los clientes (opcional)
3. **Edge Functions → aviso-nueva-cita**: pega el `index.ts` actualizado y pulsa **Deploy**.
4. En `src/constants/consultor.ts` pon `confirmacionPorEmail: true`. Así la app le dice al cliente
   que recibirá los emails de confirmación y de cancelación.

Si algo falla, en **Edge Functions → aviso-nueva-cita → Logs** cada llamada dice
`cliente: confirmación enviada`, `omitido: falta AVISO_REMITENTE…` o `error al enviar…`.
Un fallo del email al cliente nunca impide que te llegue tu aviso, ni al revés.

### Reglas que aplica la base de datos

- Un horario no puede tener dos citas confirmadas.
- Las citas tienen que ser en el futuro, como máximo a 60 días y en múltiplos de 15 minutos.
- Cada cliente puede tener como máximo 3 citas próximas.
- Los clientes ven qué horas están ocupadas, pero nunca los datos de otros clientes.
