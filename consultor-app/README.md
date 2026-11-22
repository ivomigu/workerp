# Agenda Consultor

App de Expo (iOS y Android) para que los clientes de un consultor financiero vean los
horarios libres, agenden una cita y la confirmen.

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

## Dónde cambiar cosas

- `src/constants/consultor.ts`: nombre, horario de atención, duración, temas.
- `src/constants/colors.ts`: colores (usa los colores del sistema).
- `src/screens/`: las pantallas. `src/app/`: la navegación (cada archivo es una ruta).

## Conectar con Supabase (para que veas todas las citas)

Las citas se guardan en Supabase. Cada teléfono entra como usuario anónimo (el
cliente no se registra) y solo puede ver y cancelar sus propias citas. Tú las ves
todas desde el panel de Supabase.

1. Crea un proyecto gratis en https://supabase.com.
2. **SQL Editor → New query**: pega todo el archivo
   `supabase/migrations/20261122000000_citas.sql` y pulsa **Run**.
   Si tu zona horaria no es `Europe/Madrid`, cámbiala en ese archivo antes (al final).
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
   - `ZONA_HORARIA` = tu zona, por ejemplo `Europe/Madrid` o `America/Mexico_City` (opcional)
4. **Supabase → Edge Functions → Deploy a new function → Via Editor**: llámala
   `aviso-nueva-cita`, pega el contenido de `supabase/functions/aviso-nueva-cita/index.ts` y
   pulsa **Deploy**. Después, en los ajustes de la función, **desactiva «Verify JWT»**
   (la función se protege con tu clave secreta).
5. **SQL Editor**: abre `supabase/migrations/20261122010000_aviso_email.sql`, cambia las dos
   líneas marcadas con «CAMBIA» (tu Project URL y la clave secreta del paso 2) y pulsa **Run**.
6. En **SQL Editor**, ejecuta también `supabase/migrations/20261122020000_aviso_cancelacion.sql`
   (no hay que cambiar nada) para recibir otro email cuando un cliente cancela.
7. Agenda una cita de prueba desde la app y luego cancélala. Te llegan dos emails en unos segundos.

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
2. **SQL Editor**: abre `supabase/migrations/20261122030000_consultor.sql`, cambia la línea
   marcada con «CAMBIA» por ese email y pulsa **Run**. Al final debe aparecer tu email.
3. En la app: **Agendar → Acceso consultor** y entra.

Solo las cuentas de la tabla `consultores` pueden ver el panel. Si cancelas tú una cita, no te
llega el email de cancelación y el cliente no recibe aviso automático: avísale con los botones
de la ficha. Para que WhatsApp funcione, el teléfono del cliente debe incluir el código de país.

### Reglas que aplica la base de datos

- Un horario no puede tener dos citas confirmadas.
- Las citas tienen que ser en el futuro, como máximo a 60 días y en múltiplos de 15 minutos.
- Cada cliente puede tener como máximo 3 citas próximas.
- Los clientes ven qué horas están ocupadas, pero nunca los datos de otros clientes.
