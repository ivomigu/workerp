import { Stack } from 'expo-router';

import { tabStackOptions } from '@/constants/stack-options';

export default function AgendarLayout() {
  return (
    <Stack screenOptions={tabStackOptions}>
      <Stack.Screen name="index" options={{ title: 'Agendar' }} />
    </Stack>
  );
}
