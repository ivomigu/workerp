import { Stack } from 'expo-router';

export default function ConsultorLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Consultor' }} />
      <Stack.Screen name="cita/[id]" options={{ title: 'Cita' }} />
    </Stack>
  );
}
