import { Stack } from 'expo-router';

import { tabStackOptions } from '@/constants/stack-options';

export default function CitasLayout() {
  return (
    <Stack screenOptions={tabStackOptions}>
      <Stack.Screen name="citas" options={{ title: 'Mis citas' }} />
    </Stack>
  );
}
