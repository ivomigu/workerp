# Fichas de las tiendas · Citas Financieras

Textos listos para copiar en App Store Connect y en Google Play Console. Los límites de
caracteres ya están comprobados. Cambia lo que quieras, sobre todo si ya tienes marca propia.

---

## App Store (App Store Connect)

| Campo | Texto |
|---|---|
| **Nombre** (máx. 30) | Citas Financieras |
| **Subtítulo** (máx. 30) | Agenda tu asesoría financiera |
| **Categoría principal** | Negocios (*Business*) |
| **Categoría secundaria** | Productividad (*Productivity*) |
| **Palabras clave** (máx. 100) | `cita,agenda,asesoría,finanzas,consultor,inversiones,ahorro,jubilación,impuestos,deudas,reservar` |
| **Clasificación por edad** | 4+ (responde «No» a todo el cuestionario) |
| **Precio** | Gratis |

> **Categoría:** recomiendo *Negocios* y no *Finanzas*. Apple revisa con más exigencia las
> apps de la categoría Finanzas (pide que las publique una entidad financiera autorizada), y
> esta app solo agenda citas: no maneja dinero ni da asesoría dentro de la app.

**Texto promocional** (máx. 170; se puede cambiar sin publicar una versión nueva):

```
Elige un horario libre y agenda tu asesoría en segundos. Recibe la confirmación por email y añade la cita a tu calendario con un toque.
```

**Descripción:**

```
Agenda tu asesoría financiera sin llamadas ni mensajes de ida y vuelta.

Con Citas Financieras ves en tiempo real los horarios libres de tu consultor, eliges el que mejor te queda y confirmas tu cita en segundos.

• Horarios libres de los próximos días, siempre actualizados.
• Videollamada o presencial: tú eliges.
• Temas: inversiones, ahorro, jubilación, impuestos, deudas, seguros y más.
• Confirmación por email con un archivo para añadir la cita a tu calendario.
• Consulta y cancela tus citas desde «Mis citas».
• Sin registro ni contraseñas.

Las horas se muestran en hora del centro de México.
```

**Información para la revisión de Apple** (*App Review Information → Notes*):

```
La app sirve para que los clientes de un consultor financiero agenden citas. Los clientes no necesitan cuenta: abren la app, eligen un horario en «Agendar», llenan sus datos y confirman. Pueden ver y cancelar sus citas en «Mis citas».

El enlace «Acceso consultor» al pie de la pantalla «Agendar» es solo para el dueño del negocio (ve todas las citas). No es necesario para usar la app.

La app no procesa pagos ni ofrece productos financieros; solo agenda citas.
```

> Si Apple pide entrar al panel del consultor, crea en Supabase un usuario consultor temporal
> **solo para la revisión** y bórralo después. Ten en cuenta que con él verían las citas reales.

### Privacidad de la app (*App Privacy*)

- **URL del aviso de privacidad:** la dirección donde publiques `legal/aviso-de-privacidad.html`.
- **¿Recopilas datos?** Sí.
- **¿Se usan para rastrear (*tracking*)?** No.

| Tipo de dato | ¿Vinculado a la identidad? | Uso |
|---|---|---|
| Información de contacto → **Nombre** | Sí | Funcionalidad de la app |
| Información de contacto → **Correo electrónico** | Sí | Funcionalidad de la app |
| Información de contacto → **Número de teléfono** | Sí | Funcionalidad de la app |
| Contenido del usuario → **Otro contenido del usuario** (comentarios) | Sí | Funcionalidad de la app |
| Identificadores → **ID de usuario** (identificador anónimo) | Sí | Funcionalidad de la app |

### Capturas de pantalla

Apple pide capturas de **iPhone de 6.9"** (1320 × 2868 o 1290 × 2796). Hazlas desde un iPhone
grande o desde el simulador de Xcode, con la versión real de la app (no la web). Sugerencia de
3 a 5 capturas: Agendar · Confirmar cita · ¡Cita confirmada! · Mis citas.

---

## Google Play (Play Console)

| Campo | Texto |
|---|---|
| **Nombre de la app** (máx. 30) | Citas Financieras |
| **Descripción breve** (máx. 80) | Elige un horario libre y agenda tu asesoría financiera en segundos. |
| **Categoría** | Empresa (*Business*) |
| **Etiquetas** | Agenda, Citas |
| **Clasificación de contenido** | Responde el cuestionario IARC: todo «No» → apta para todos |
| **Público objetivo** | 18 años o más |
| **Anuncios** | No contiene anuncios |
| **Precio** | Gratis |

**Descripción completa:** usa la misma descripción de la App Store.

**Gráficos:**
- Icono de 512 × 512: exporta `assets/images/icon.png` a ese tamaño.
- Imagen destacada de 1024 × 500: obligatoria. Puede ser el icono sobre fondo azul `#0A57C2`
  con el nombre de la app.
- Al menos 2 capturas de teléfono (por ejemplo, 1080 × 1920) tomadas desde un Android.

### Seguridad de los datos (*Data safety*)

- **¿Recopila o comparte datos?** Recopila: sí. Comparte: no (Supabase y Resend son
  proveedores que actúan por tu cuenta, eso no cuenta como «compartir»).
- **¿Cifrado en tránsito?** Sí.
- **¿Los usuarios pueden pedir que se eliminen sus datos?** Sí, escribiendo al email del aviso
  de privacidad.

| Categoría → tipo | Obligatorio | Finalidad |
|---|---|---|
| Información personal → **Nombre** | Sí | Funcionalidad de la app |
| Información personal → **Teléfono** | Sí | Funcionalidad de la app |
| Información personal → **Correo electrónico** | No (opcional) | Funcionalidad de la app |
| Mensajes → **Otro contenido generado por el usuario** (comentarios) | No | Funcionalidad de la app |
| Identificadores de la app → **ID de usuario** | Sí | Funcionalidad de la app |

### Acceso a la app (*App access*)

Elige «Todas las funciones están disponibles sin restricciones de acceso» y explica en el
campo de instrucciones que «Acceso consultor» es solo para el dueño del negocio. Si Google
lo pide, usa el mismo usuario temporal de revisión que para Apple.
