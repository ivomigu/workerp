# Agenda Consultor

App de Expo (iOS y Android) para que los clientes de un consultor financiero vean los
horarios libres, agenden una cita y la confirmen.

## Probarla en tu celular

1. Instala **Expo Go** en tu iPhone o Android.
2. En esta carpeta: `npm install` y luego `npx expo start`.
3. Escanea el código QR con la cámara (iPhone) o con Expo Go (Android).

## Dónde cambiar cosas

- `src/constants/consultor.ts`: nombre, horario de atención, duración, temas.
- `src/constants/colors.ts`: colores (usa los colores del sistema).
- `src/screens/`: las pantallas. `src/app/`: la navegación (cada archivo es una ruta).

Las citas se guardan en el propio teléfono (expo-sqlite). Para que el consultor vea
las citas de todos sus clientes hace falta un servidor (por ejemplo, Supabase).
